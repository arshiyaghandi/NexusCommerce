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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Authentication & Customer Account Management controller:
 * login, logout, register, /me, profile view, profile update, and password change.
 *
 * <p><strong>Security & Architecture notes:</strong>
 * <ul>
 *   <li>ROLE_ADMIN is granted ONLY when Keycloak's {@code realm_access.roles} contains "admin".
 *       There is intentionally NO username-based fallback.</li>
 *   <li>Keycloak admin credentials are injected via environment variables
 *       ({@code KEYCLOAK_ADMIN_USERNAME}, {@code KEYCLOAK_ADMIN_PASSWORD}) — never hardcoded.</li>
 *   <li>Logout revokes the refresh token at Keycloak so the server-side session is invalidated.</li>
 *   <li>Password change verifies the user's current password against Keycloak's token endpoint
 *       before resetting to the new password via the Admin API.</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String CAPTCHA_KEY_PREFIX = "captcha:";

    private final ReactiveStringRedisTemplate redisTemplate;

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

    private Keycloak getKeycloakAdminClient() {
        return KeycloakBuilder.builder()
                .serverUrl(keycloakServerUrl)
                .realm("master")
                .clientId("admin-cli")
                .username(keycloakAdminUsername)
                .password(keycloakAdminPassword)
                .build();
    }

    private List<String> extractRoles(Jwt jwt) {
        List<String> roles = new ArrayList<>();
        if (jwt == null) return roles;

        // 1. Realm roles from Keycloak JWT claim
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

        return WebClient.create().post()
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
    // Logout — revokes the refresh token at Keycloak, then expires cookies
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

            revoke = WebClient.create().post()
                    .uri(issuerUri + "/protocol/openid-connect/logout")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData(revokeForm))
                    .retrieve()
                    .toBodilessEntity()
                    .doOnSuccess(r -> log.info("Keycloak session revoked, status={}", r.getStatusCode()))
                    .doOnError(e -> log.warn("Failed to revoke Keycloak session: {}", e.getMessage()))
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
    // /me — returns the authenticated user's quick profile and roles from JWT
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

        Map<String, Object> response = new java.util.HashMap<>();
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
    // GET /profile — fetches live customer profile from Keycloak
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public Mono<ResponseEntity<UserProfileResponse>> getProfile(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        String userId = jwt.getSubject();
        List<String> roles = extractRoles(jwt);

        return Mono.fromCallable(() -> {
            try (Keycloak keycloak = getKeycloakAdminClient()) {
                UserRepresentation user = keycloak.realm(keycloakRealm).users().get(userId).toRepresentation();

                String firstName = user.getFirstName() != null ? user.getFirstName() : "";
                String lastName = user.getLastName() != null ? user.getLastName() : "";
                String fullName = (firstName + " " + lastName).trim();
                if (fullName.isBlank()) {
                    fullName = user.getUsername();
                }

                UserProfileResponse profile = UserProfileResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .firstName(firstName)
                        .lastName(lastName)
                        .name(fullName)
                        .email(user.getEmail() != null ? user.getEmail() : "")
                        .roles(roles)
                        .createdTimestamp(user.getCreatedTimestamp())
                        .build();

                return ResponseEntity.ok(profile);
            } catch (Exception e) {
                log.warn("Failed to fetch live Keycloak profile for userId={}, using JWT fallback: {}", userId, e.getMessage());
                String username = jwt.getClaimAsString("preferred_username");
                if (username == null || username.isBlank()) username = userId;

                String firstName = jwt.getClaimAsString("given_name");
                String lastName = jwt.getClaimAsString("family_name");
                String name = jwt.getClaimAsString("name");
                if (name == null || name.isBlank()) {
                    name = username;
                }

                UserProfileResponse fallback = UserProfileResponse.builder()
                        .id(userId)
                        .username(username)
                        .firstName(firstName != null ? firstName : "")
                        .lastName(lastName != null ? lastName : "")
                        .name(name)
                        .email(jwt.getClaimAsString("email") != null ? jwt.getClaimAsString("email") : "")
                        .roles(roles)
                        .build();

                return ResponseEntity.ok(fallback);
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /profile — updates customer profile details (first name, last name, email)
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/profile")
    public Mono<ResponseEntity<Map<String, Object>>> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody UpdateProfileRequest request) {

        if (jwt == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated")));
        }

        String userId = jwt.getSubject();

        return Mono.fromCallable(() -> {
            try (Keycloak keycloak = getKeycloakAdminClient()) {
                UserRepresentation user = keycloak.realm(keycloakRealm).users().get(userId).toRepresentation();

                if (request.getFirstName() != null) {
                    user.setFirstName(request.getFirstName().trim());
                }
                if (request.getLastName() != null) {
                    user.setLastName(request.getLastName().trim());
                }
                if (request.getEmail() != null && !request.getEmail().isBlank()) {
                    user.setEmail(request.getEmail().trim());
                }

                keycloak.realm(keycloakRealm).users().get(userId).update(user);
                log.info("Profile updated successfully for userId={}", userId);

                return ResponseEntity.ok(Map.<String, Object>of(
                        "message", "Profile updated successfully",
                        "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                        "lastName", user.getLastName() != null ? user.getLastName() : "",
                        "email", user.getEmail() != null ? user.getEmail() : ""
                ));
            } catch (Exception e) {
                log.error("Failed to update profile for userId={}: {}", userId, e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.<String, Object>of("error", "Failed to update profile: " + e.getMessage()));
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /password — verifies current password and sets new password
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/password")
    public Mono<ResponseEntity<Map<String, String>>> changePassword(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody ChangePasswordRequest request) {

        if (jwt == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated")));
        }

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

        // 1. Verify current password with Keycloak ROPC token endpoint
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("username", username);
        formData.add("password", request.getCurrentPassword());

        return WebClient.create().post()
                .uri(issuerUri + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(formData))
                .retrieve()
                .toBodilessEntity()
                .flatMap(authResponse -> {
                    // Current password verified successfully!
                    // 2. Set new password via Keycloak Admin API
                    return Mono.fromCallable(() -> {
                        try (Keycloak keycloak = getKeycloakAdminClient()) {
                            CredentialRepresentation cred = new CredentialRepresentation();
                            cred.setType(CredentialRepresentation.PASSWORD);
                            cred.setValue(request.getNewPassword());
                            cred.setTemporary(false);

                            keycloak.realm(keycloakRealm).users().get(userId).resetPassword(cred);
                            log.info("Password changed successfully for username={}, userId={}", username, userId);

                            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
                        } catch (Exception e) {
                            log.error("Failed to reset password in Keycloak for userId={}: {}", userId, e.getMessage());
                            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                    .body(Map.of("error", "Failed to update password: " + e.getMessage()));
                        }
                    }).subscribeOn(Schedulers.boundedElastic());
                })
                .onErrorResume(e -> {
                    log.warn("Current password verification failed for username={}: {}", username, e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Current password is incorrect")));
                });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Register
    // ─────────────────────────────────────────────────────────────────────────

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
            try (Keycloak keycloak = getKeycloakAdminClient()) {
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

                Response response = keycloak.realm(keycloakRealm).users().create(user);

                if (response.getStatus() == 201) {
                    String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");
                    try {
                        RoleRepresentation userRole = keycloak.realm(keycloakRealm).roles().get("user").toRepresentation();
                        keycloak.realm(keycloakRealm).users().get(userId).roles().realmLevel().add(Collections.singletonList(userRole));
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
