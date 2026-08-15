package org.nexuxs.auth.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URI;
import java.time.Duration;
import java.util.Collections;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String USER_CACHE_PREFIX = "auth:user:";
    private static final String CAPTCHA_KEY_PREFIX = "captcha:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);

    private final ReactiveStringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @GetMapping("/success")
    public Mono<Void> loginSuccess(@AuthenticationPrincipal OidcUser oidcUser, ServerHttpResponse response) {
        if (oidcUser != null) {
            ResponseCookie cookie = ResponseCookie.from("NEXUS_TOKEN", oidcUser.getIdToken().getTokenValue())
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .maxAge(3600)
                    .sameSite("Lax")
                    .build();
            response.addCookie(cookie);
        }
        response.setStatusCode(HttpStatus.FOUND);
        response.getHeaders().setLocation(URI.create("http://localhost:3000"));
        return response.setComplete();
    }

    @GetMapping("/me")
    public Mono<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal OidcUser oidcUser) {
        if (oidcUser == null) {
            return Mono.just(Map.of("error", "User not authenticated"));
        }
        String userId = oidcUser.getSubject();
        String cacheKey = USER_CACHE_PREFIX + userId;
        return redisTemplate.opsForValue().get(cacheKey)
                .flatMap(json -> {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> cached = objectMapper.readValue(json, Map.class);
                        return Mono.just(cached);
                    } catch (Exception e) {
                        return Mono.error(e);
                    }
                })
                .switchIfEmpty(Mono.defer(() -> {
                    Map<String, Object> profile = Map.of(
                            "name", oidcUser.getFullName() != null ? oidcUser.getFullName() : oidcUser.getPreferredUsername(),
                            "email", oidcUser.getEmail() != null ? oidcUser.getEmail() : "No Email",
                            "roles", oidcUser.getAuthorities()
                    );
                    try {
                        String json = objectMapper.writeValueAsString(profile);
                        return redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL)
                                .thenReturn(profile);
                    } catch (Exception e) {
                        return Mono.just(profile);
                    }
                }));
    }

    @PostMapping("/register")
    public Mono<ResponseEntity<Map<String, String>>> register(@RequestBody RegisterRequest request) {
        if (request.getCaptchaId() == null || request.getCaptchaAnswer() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Captcha is required")));
        }

        String captchaKey = CAPTCHA_KEY_PREFIX + request.getCaptchaId();
        return redisTemplate.opsForValue().get(captchaKey)
                .flatMap(storedAnswer -> {
                    redisTemplate.delete(captchaKey).subscribe();
                    if (!storedAnswer.equals(request.getCaptchaAnswer().trim())) {
                        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of("error", "Incorrect captcha answer. Please try again.")));
                    }
                    return registerUser(request);
                })
                .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Captcha expired or invalid. Please refresh."))));
    }

    private Mono<ResponseEntity<Map<String, String>>> registerUser(RegisterRequest request) {
        return Mono.fromCallable(() -> {
            try (Keycloak keycloak = KeycloakBuilder.builder()
                    .serverUrl("http://localhost:8081")
                    .realm("master")
                    .clientId("admin-cli")
                    .username("admin")
                    .password("admin")
                    .build()) {

                UserRepresentation user = new UserRepresentation();
                user.setUsername(request.getUsername());
                user.setEnabled(true);

                if (request.getEmail() != null && !request.getEmail().isBlank()) {
                    user.setEmail(request.getEmail());
                    user.setEmailVerified(true);
                }
                if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
                    user.setFirstName(request.getFirstName());
                }
                if (request.getLastName() != null && !request.getLastName().isBlank()) {
                    user.setLastName(request.getLastName());
                }

                CredentialRepresentation cred = new CredentialRepresentation();
                cred.setType(CredentialRepresentation.PASSWORD);
                cred.setValue(request.getPassword());
                cred.setTemporary(false);
                user.setCredentials(Collections.singletonList(cred));

                Response response = keycloak.realm("nexus-realm").users().create(user);

                if (response.getStatus() == 201) {
                    String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");
                    try {
                        RoleRepresentation userRole = keycloak.realm("nexus-realm").roles().get("user").toRepresentation();
                        keycloak.realm("nexus-realm").users().get(userId).roles().realmLevel().add(Collections.singletonList(userRole));
                    } catch (Exception roleEx) {
                        log.warn("User created but role assignment failed: {}", roleEx.getMessage());
                    }
                    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User created successfully"));
                } else if (response.getStatus() == 409) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Username already exists. Please choose a different one."));
                } else {
                    String body = "";
                    try { body = response.readEntity(String.class); } catch (Exception ignored) {}
                    return ResponseEntity.status(response.getStatus()).body(Map.of("error", "Registration failed: " + body));
                }
            } catch (Exception e) {
                log.error("Registration error", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal error: " + e.getMessage()));
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
