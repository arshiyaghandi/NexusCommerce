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
}