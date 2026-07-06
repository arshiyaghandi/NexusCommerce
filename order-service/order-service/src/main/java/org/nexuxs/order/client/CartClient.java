package org.nexuxs.order.client;

import lombok.RequiredArgsConstructor;
import org.nexuxs.order.data.dto.CartItemDto;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Inter-service client that reads the authenticated user's shopping cart from
 * cart-service via Eureka load-balanced WebClient. The bearer token is forwarded
 * so cart-service can identify the owner.
 */
@Component
@RequiredArgsConstructor
public class CartClient {

    private static final String CART_URL = "http://cart-service/api/cart";

    private final WebClient.Builder webClientBuilder;

    public Mono<List<CartItemDto>> getCart() {
        return currentBearerToken()
                .flatMap(token -> webClientBuilder.build()
                        .get()
                        .uri(CART_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .bodyToFlux(CartItemDto.class)
                        .collectList());
    }

    public Mono<Void> clearCart() {
        return currentBearerToken()
                .flatMap(token -> webClientBuilder.build()
                        .delete()
                        .uri(CART_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .toBodilessEntity()
                        .then());
    }

    private Mono<String> currentBearerToken() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .cast(JwtAuthenticationToken.class)
                .map(auth -> auth.getToken().getTokenValue())
                .switchIfEmpty(Mono.error(new IllegalStateException("Missing authentication for cart call")));
    }
}
