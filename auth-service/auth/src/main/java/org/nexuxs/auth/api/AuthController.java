package org.nexuxs.auth.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

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

        return Mono.just(Map.of(
                "name", oidcUser.getFullName() != null ? oidcUser.getFullName() : oidcUser.getPreferredUsername(),
                "email", oidcUser.getEmail() != null ? oidcUser.getEmail() : "No Email",
                "roles", oidcUser.getAuthorities()
        ));
    }

    @org.springframework.web.bind.annotation.PostMapping("/register")
    public Mono<org.springframework.http.ResponseEntity<Object>> register(@org.springframework.web.bind.annotation.RequestBody RegisterRequest request) {
        return Mono.fromCallable(() -> {
            try (org.keycloak.admin.client.Keycloak keycloak = org.keycloak.admin.client.KeycloakBuilder.builder()
                    .serverUrl("http://localhost:8081")
                    .realm("master")
                    .clientId("admin-cli")
                    .username("admin")
                    .password("admin")
                    .build()) {
                
                org.keycloak.representations.idm.UserRepresentation user = new org.keycloak.representations.idm.UserRepresentation();
                user.setUsername(request.getUsername());
                user.setEnabled(true);
                
                // Set email, firstName, lastName if provided
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
                
                org.keycloak.representations.idm.CredentialRepresentation cred = new org.keycloak.representations.idm.CredentialRepresentation();
                cred.setType(org.keycloak.representations.idm.CredentialRepresentation.PASSWORD);
                cred.setValue(request.getPassword());
                cred.setTemporary(false);
                user.setCredentials(java.util.Collections.singletonList(cred));
                
                jakarta.ws.rs.core.Response response = keycloak.realm("nexus-realm").users().create(user);
                
                if (response.getStatus() == 201) {
                    // Get the created user ID
                    String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");
                    
                    // Assign 'user' role
                    try {
                        org.keycloak.representations.idm.RoleRepresentation userRole = keycloak.realm("nexus-realm").roles().get("user").toRepresentation();
                        keycloak.realm("nexus-realm").users().get(userId).roles().realmLevel().add(java.util.Collections.singletonList(userRole));
                    } catch (Exception roleEx) {
                        // Role assignment failed but user was created - log and continue
                        System.err.println("Warning: User created but role assignment failed: " + roleEx.getMessage());
                    }
                    
                    return org.springframework.http.ResponseEntity.status(HttpStatus.CREATED).body((Object) Map.of("message", "User created successfully"));
                } else if (response.getStatus() == 409) {
                    return org.springframework.http.ResponseEntity.status(HttpStatus.CONFLICT).body((Object) Map.of("error", "Username already exists. Please choose a different one."));
                } else {
                    String body = "";
                    try { body = response.readEntity(String.class); } catch (Exception ignored) {}
                    return org.springframework.http.ResponseEntity.status(response.getStatus()).body((Object) Map.of("error", "Registration failed: " + body));
                }
            } catch (Exception e) {
                e.printStackTrace();
                return org.springframework.http.ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body((Object) Map.of("error", "Internal error: " + e.getMessage()));
            }
        }).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic());
    }
}