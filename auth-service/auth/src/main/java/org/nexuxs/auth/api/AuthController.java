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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String CAPTCHA_KEY_PREFIX = "captcha:";

    private final ReactiveStringRedisTemplate redisTemplate;

    @Value("${spring.security.oauth2.client.registration.keycloak.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.keycloak.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.provider.keycloak.issuer-uri}")
    private String issuerUri;

    @PostMapping("/login")
    public Mono<ResponseEntity<Map<String, String>>> login(@RequestBody LoginRequest request) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("username", request.getUsername());
        formData.add("password", request.getPassword());

        return WebClient.create().post()
                .uri(issuerUri + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(formData))
                .retrieve()
                .bodyToMono(Map.class)
                .map(responseBody -> {
                    String accessToken = (String) responseBody.get("access_token");
                    String refreshToken = (String) responseBody.get("refresh_token");

                    ResponseCookie tokenCookie = ResponseCookie.from("NEXUS_TOKEN", accessToken)
                            .httpOnly(true).secure(false).path("/").maxAge(3600).sameSite("Lax").build();

                    ResponseCookie refreshCookie = ResponseCookie.from("NEXUS_REFRESH_TOKEN", refreshToken)
                            .httpOnly(true).secure(false).path("/").maxAge(86400).sameSite("Lax").build();

                    return ResponseEntity.ok()
                            .header("Set-Cookie", tokenCookie.toString())
                            .header("Set-Cookie", refreshCookie.toString())
                            .body(Map.of("message", "Login successful"));
                })
                .onErrorResume(e -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"))));
    }

    @PostMapping("/logout")
    public Mono<ResponseEntity<Map<String, String>>> logout() {
        ResponseCookie tokenCookie = ResponseCookie.from("NEXUS_TOKEN", "")
                .httpOnly(true).secure(false).path("/").maxAge(0).sameSite("Lax").build();

        ResponseCookie refreshCookie = ResponseCookie.from("NEXUS_REFRESH_TOKEN", "")
                .httpOnly(true).secure(false).path("/").maxAge(0).sameSite("Lax").build();

        return Mono.just(ResponseEntity.ok()
                .header("Set-Cookie", tokenCookie.toString())
                .header("Set-Cookie", refreshCookie.toString())
                .body(Map.of("message", "Logout successful")));
    }

    @GetMapping("/me")
    public Mono<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return Mono.just(Map.of("error", "User not authenticated"));
        }

        List<String> roles = new ArrayList<>();

        // 1. Realm roles
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            Object rolesObj = realmAccess.get("roles");
            if (rolesObj instanceof List<?> kRoles) {
                for (Object r : kRoles) {
                    if (r != null) {
                        String roleStr = r.toString();
                        roles.add(roleStr);
                        roles.add("ROLE_" + roleStr.toUpperCase());
                    }
                }
            }
        }

        // 2. Client roles (resource_access)
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            for (Object clientObj : resourceAccess.values()) {
                if (clientObj instanceof Map<?, ?> clientMap) {
                    Object clientRolesObj = clientMap.get("roles");
                    if (clientRolesObj instanceof List<?> cRoles) {
                        for (Object r : cRoles) {
                            if (r != null) {
                                String roleStr = r.toString();
                                roles.add(roleStr);
                                roles.add("ROLE_" + roleStr.toUpperCase());
                            }
                        }
                    }
                }
            }
        }

        String name = jwt.getClaimAsString("name");
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        if (name == null || name.isBlank()) {
            name = preferredUsername;
        }
        if (name == null || name.isBlank()) {
            name = jwt.getSubject();
        }
        if (name == null || name.isBlank()) {
            name = "User";
        }

        // 3. Fallback: if username is admin, guarantee ROLE_ADMIN
        if ("admin".equalsIgnoreCase(preferredUsername) || "admin".equalsIgnoreCase(name) || "admin".equalsIgnoreCase(jwt.getSubject())) {
            if (!roles.contains("ROLE_ADMIN")) {
                roles.add("ROLE_ADMIN");
                roles.add("ADMIN");
            }
        }

        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            email = "No Email";
        }

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("name", name);
        response.put("email", email);
        response.put("roles", roles);

        return Mono.just(response);
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
