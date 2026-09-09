package org.nexuxs.auth.api;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Authentication & Customer Account Management controller:
 * login, logout, register, /me, profile view, profile update, and password change.
 *
 * <p><strong>Pure Reactive WebFlux Architecture:</strong>
 * Instead of using the blocking Keycloak Admin Client Java SDK (which requires thread-pool offloading),
 * this implementation communicates with Keycloak's Admin REST APIs completely natively using WebClient,
 * keeping the entire flow non-blocking and maximizing Netty event loop efficiency.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String CAPTCHA_KEY_PREFIX = "captcha:";
    private final ReactiveStringRedisTemplate redisTemplate;
    private final WebClient webClient = WebClient.builder().build();

    // ── Keycloak client config (OAuth2 token endpoint) ────────────────────────
    @Value("${spring.security.oauth2.client.registration.keycloak.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.keycloak.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.provider.keycloak.issuer-uri}")
    private String issuerUri;

    // ── Keycloak Admin client config (user management) ────────────────────────
    @Value("${nexus.keycloak.server-url:http://localhost:8081}")
    private String keycloakServerUrl;

    @Value("${nexus.keycloak.realm:nexus-realm}")
    private String keycloakRealm;

    @Value("${nexus.keycloak.admin.username:${KEYCLOAK_ADMIN_USERNAME:admin}}")
    private String keycloakAdminUsername;

    @Value("${nexus.keycloak.admin.password:${KEYCLOAK_ADMIN_PASSWORD:admin}}")
    private String keycloakAdminPassword;

    /**
     * Gets a short-lived admin access token for calling Keycloak Admin REST APIs.
     */
    private Mono<String> getAdminAccessToken() {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("client_id", "admin-cli");
        formData.add("username", keycloakAdminUsername);
        formData.add("password", keycloakAdminPassword);

        return webClient.post()
                .uri(keycloakServerUrl + "/realms/master/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(formData))
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> (String) response.get("access_token"));
    }

    private List<String> extractRoles(Jwt jwt) {
        List<String> roles = new ArrayList<>();
        if (jwt == null) return roles;

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
        return roles;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Login
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public Mono<ResponseEntity<Map<String, String>>> login(@RequestBody LoginRequest request) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("username", request.getUsername());
        formData.add("password", request.getPassword());

        return webClient.post()
                .uri(issuerUri + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(formData))
                .retrieve()
                .bodyToMono(Map.class)
                .map(responseBody -> {
                    String accessToken  = (String) responseBody.get("access_token");
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
                .onErrorResume(e -> {
                    log.warn("Login failed: {}", e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "Invalid credentials")));
                });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Logout
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/logout")
    public Mono<ResponseEntity<Map<String, String>>> logout(
            @CookieValue(value = "NEXUS_REFRESH_TOKEN", required = false) String refreshToken) {

        Mono<Void> revoke = Mono.empty();
        if (refreshToken != null && !refreshToken.isBlank()) {
            MultiValueMap<String, String> revokeForm = new LinkedMultiValueMap<>();
            revokeForm.add("client_id", clientId);
            revokeForm.add("client_secret", clientSecret);
            revokeForm.add("refresh_token", refreshToken);

            revoke = webClient.post()
                    .uri(issuerUri + "/protocol/openid-connect/logout")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData(revokeForm))
                    .retrieve()
                    .toBodilessEntity()
                    .doOnSuccess(r -> log.info("Keycloak session revoked, status={}", r.getStatusCode()))
                    .onErrorResume(e -> Mono.empty())
                    .then();
        }

        ResponseCookie expiredToken = ResponseCookie.from("NEXUS_TOKEN", "")
                .httpOnly(true).secure(false).path("/").maxAge(0).sameSite("Lax").build();
        ResponseCookie expiredRefresh = ResponseCookie.from("NEXUS_REFRESH_TOKEN", "")
                .httpOnly(true).secure(false).path("/").maxAge(0).sameSite("Lax").build();

        return revoke.then(Mono.just(
                ResponseEntity.ok()
                        .header("Set-Cookie", expiredToken.toString())
                        .header("Set-Cookie", expiredRefresh.toString())
                        .body(Map.of("message", "Logout successful"))
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // /me
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/me")
    public Mono<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return Mono.just(Map.of("error", "User not authenticated"));
        }

        List<String> roles = extractRoles(jwt);

        String username = jwt.getClaimAsString("preferred_username");
        if (username == null || username.isBlank()) username = jwt.getSubject();

        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");

        String name = jwt.getClaimAsString("name");
        if (name == null || name.isBlank()) {
            if (firstName != null && !firstName.isBlank()) {
                name = firstName + (lastName != null && !lastName.isBlank() ? " " + lastName : "");
            } else {
                name = username;
            }
        }
        if (name == null || name.isBlank()) name = "User";

        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) email = "No Email";

        Map<String, Object> response = new HashMap<>();
        response.put("sub", jwt.getSubject());
        response.put("username", username);
        response.put("firstName", firstName != null ? firstName : "");
        response.put("lastName", lastName != null ? lastName : "");
        response.put("name", name);
        response.put("email", email);
        response.put("roles", roles);

        return Mono.just(response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /profile (Pure Reactive)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public Mono<ResponseEntity<UserProfileResponse>> getProfile(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());

        String userId = jwt.getSubject();
        List<String> roles = extractRoles(jwt);

        return getAdminAccessToken()
                .flatMap(token -> webClient.get()
                        .uri(keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users/" + userId)
                        .header("Authorization", "Bearer " + token)
                        .retrieve()
                        .bodyToMono(Map.class))
                .map(userMap -> {
                    String firstName = (String) userMap.getOrDefault("firstName", "");
                    String lastName = (String) userMap.getOrDefault("lastName", "");
                    String username = (String) userMap.getOrDefault("username", "");
                    String fullName = (firstName + " " + lastName).trim();
                    if (fullName.isBlank()) fullName = username;

                    UserProfileResponse profile = UserProfileResponse.builder()
                            .id((String) userMap.get("id"))
                            .username(username)
                            .firstName(firstName)
                            .lastName(lastName)
                            .name(fullName)
                            .email((String) userMap.getOrDefault("email", ""))
                            .roles(roles)
                            .createdTimestamp(((Number) userMap.getOrDefault("createdTimestamp", 0L)).longValue())
                            .build();
                    return ResponseEntity.ok(profile);
                })
                .onErrorResume(e -> {
                    log.warn("Failed to fetch live Keycloak profile reactively for userId={}, fallback to JWT: {}", userId, e.getMessage());
                    String username = jwt.getClaimAsString("preferred_username");
                    if (username == null || username.isBlank()) username = userId;
                    String firstName = jwt.getClaimAsString("given_name");
                    String lastName = jwt.getClaimAsString("family_name");
                    String name = jwt.getClaimAsString("name");
                    if (name == null || name.isBlank()) name = username;

                    UserProfileResponse fallback = UserProfileResponse.builder()
                            .id(userId)
                            .username(username)
                            .firstName(firstName != null ? firstName : "")
                            .lastName(lastName != null ? lastName : "")
                            .name(name)
                            .email(jwt.getClaimAsString("email") != null ? jwt.getClaimAsString("email") : "")
                            .roles(roles)
                            .build();
                    return Mono.just(ResponseEntity.ok(fallback));
                });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /profile (Pure Reactive)
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/profile")
    public Mono<ResponseEntity<Map<String, Object>>> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody UpdateProfileRequest request) {

        if (jwt == null) return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        String userId = jwt.getSubject();

        return getAdminAccessToken().flatMap(token -> {
            String userUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users/" + userId;
            // 1. Fetch current user representation
            return webClient.get()
                    .uri(userUrl)
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .flatMap(userMap -> {
                        // 2. Modify properties
                        if (request.getFirstName() != null) userMap.put("firstName", request.getFirstName().trim());
                        if (request.getLastName() != null) userMap.put("lastName", request.getLastName().trim());
                        if (request.getEmail() != null && !request.getEmail().isBlank()) {
                            userMap.put("email", request.getEmail().trim());
                        }

                        // 3. PUT updated representation back
                        return webClient.put()
                                .uri(userUrl)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(userMap)
                                .retrieve()
                                .toBodilessEntity()
                                .map(r -> {
                                    log.info("Profile updated successfully (reactively) for userId={}", userId);
                                    return ResponseEntity.ok(Map.<String, Object>of(
                                            "message", "Profile updated successfully",
                                            "firstName", userMap.getOrDefault("firstName", ""),
                                            "lastName", userMap.getOrDefault("lastName", ""),
                                            "email", userMap.getOrDefault("email", "")
                                    ));
                                });
                    });
        }).onErrorResume(e -> {
            log.error("Reactive profile update failed for userId={}: {}", userId, e.getMessage());
            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update profile: " + e.getMessage())));
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /password (Pure Reactive)
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/password")
    public Mono<ResponseEntity<Map<String, String>>> changePassword(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody ChangePasswordRequest request) {

        if (jwt == null) return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()
                || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Current password and new password are required")));
        }
        if (request.getNewPassword().length() < 6) {
            return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "New password must be at least 6 characters long")));
        }

        String username = jwt.getClaimAsString("preferred_username");
        String userId = jwt.getSubject();

        // 1. Verify current password
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("username", username);
        formData.add("password", request.getCurrentPassword());

        return webClient.post()
                .uri(issuerUri + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(formData))
                .retrieve()
                .toBodilessEntity()
                .onErrorResume(e -> {
                    log.warn("Current password verification failed for username={}", username);
                    return Mono.error(new IllegalArgumentException("Current password is incorrect"));
                })
                .flatMap(authResponse -> getAdminAccessToken())
                .flatMap(token -> {
                    // 2. Reset password via Admin API
                    Map<String, Object> cred = Map.of(
                            "type", "password",
                            "value", request.getNewPassword(),
                            "temporary", false
                    );
                    return webClient.put()
                            .uri(keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users/" + userId + "/reset-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(cred)
                            .retrieve()
                            .toBodilessEntity()
                            .map(r -> ResponseEntity.ok(Map.of("message", "Password changed successfully")));
                })
                .onErrorResume(e -> {
                    if (e instanceof IllegalArgumentException) {
                        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage())));
                    }
                    log.error("Reactive password reset failed for userId={}: {}", userId, e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Failed to update password: " + e.getMessage())));
                });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /register (Pure Reactive)
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/register")
    public Mono<ResponseEntity<Map<String, String>>> register(@RequestBody RegisterRequest request) {
        if (request.getCaptchaId() == null || request.getCaptchaAnswer() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Captcha is required")));
        }

        String captchaKey = CAPTCHA_KEY_PREFIX + request.getCaptchaId();
        return redisTemplate.opsForValue().get(captchaKey)
                .flatMap(storedAnswer -> {
                    redisTemplate.delete(captchaKey).subscribe();
                    if (!storedAnswer.equals(request.getCaptchaAnswer().trim())) {
                        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Incorrect captcha answer. Please try again.")));
                    }
                    return registerUser(request);
                })
                .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Captcha expired or invalid. Please refresh."))));
    }

    private Mono<ResponseEntity<Map<String, String>>> registerUser(RegisterRequest request) {
        return getAdminAccessToken()
                .flatMap(token -> {
                    Map<String, Object> user = new HashMap<>();
                    user.put("username", request.getUsername());
                    user.put("enabled", true);
                    if (request.getEmail() != null && !request.getEmail().isBlank()) {
                        user.put("email", request.getEmail());
                        user.put("emailVerified", true);
                    }
                    if (request.getFirstName() != null) user.put("firstName", request.getFirstName());
                    if (request.getLastName() != null) user.put("lastName", request.getLastName());

                    Map<String, Object> cred = Map.of(
                            "type", "password",
                            "value", request.getPassword(),
                            "temporary", false
                    );
                    user.put("credentials", List.of(cred));

                    return webClient.post()
                            .uri(keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(user)
                            .retrieve()
                            .toBodilessEntity()
                            .flatMap(response -> {
                                if (response.getStatusCode() == HttpStatus.CREATED) {
                                    String location = response.getHeaders().getFirst("Location");
                                    if (location != null) {
                                        String userId = location.substring(location.lastIndexOf('/') + 1);
                                        return assignRoleToUser(token, userId, "user")
                                                .thenReturn(ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User created successfully")));
                                    }
                                    return Mono.just(ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User created successfully")));
                                }
                                return Mono.just(ResponseEntity.status(response.getStatusCode()).body(Map.of("error", "Registration failed")));
                            })
                            .onErrorResume(e -> {
                                if (e instanceof WebClientResponseException.Conflict) {
                                    return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Username already exists. Please choose a different one.")));
                                }
                                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal error: " + e.getMessage())));
                            });
                });
    }

    private Mono<Void> assignRoleToUser(String adminToken, String userId, String roleName) {
        return webClient.get()
                .uri(keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/roles/" + roleName)
                .header("Authorization", "Bearer " + adminToken)
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(roleMap -> webClient.post()
                        .uri(keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users/" + userId + "/role-mappings/realm")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(List.of(roleMap))
                        .retrieve()
                        .toBodilessEntity()
                )
                .then()
                .onErrorResume(e -> {
                    log.warn("Failed to assign role to user {}: {}", userId, e.getMessage());
                    return Mono.empty();
                });
    }
}
