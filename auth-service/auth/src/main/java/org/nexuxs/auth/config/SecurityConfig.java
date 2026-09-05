package org.nexuxs.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/api/auth/register", "/api/auth/captcha", "/api/auth/login", "/api/auth/logout").permitAll()
                        .pathMatchers(
                                "/v3/api-docs/**",
                                "/v3/api-docs",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/webjars/**"
                        ).permitAll()
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2Login(Customizer.withDefaults())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenConverter(exchange -> {
                            org.springframework.http.HttpCookie cookie = exchange.getRequest().getCookies().getFirst("NEXUS_TOKEN");
                            if (cookie != null && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                                return reactor.core.publisher.Mono.just(cookie.getValue());
                            }
                            String authHeader = exchange.getRequest().getHeaders().getFirst(org.springframework.http.HttpHeaders.AUTHORIZATION);
                            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                                return reactor.core.publisher.Mono.just(authHeader.substring(7));
                            }
                            return reactor.core.publisher.Mono.empty();
                        })
                        .jwt(Customizer.withDefaults()));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}