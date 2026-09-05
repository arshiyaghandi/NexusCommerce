package org.nexuxs.order.client;

import lombok.extern.slf4j.Slf4j;
import org.nexuxs.order.data.dto.CartItemDto;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Inter-service client that reads the authenticated user's shopping cart from
 * cart-service via Eureka load-balanced WebClient. The bearer token is forwarded
 * so cart-service can identify the owner.
 */
@Slf4j
@Component
public class CartClient {

    private static final String CART_URL = "http://cart-service/api/cart";
    private final WebClient webClient;

    public CartClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public Mono<List<CartItemDto>> getCart() {
        return currentBearerToken()
                .flatMap(token -> webClient.get()
                        .uri(CART_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .onStatus(HttpStatusCode::isError, response -> 
                                Mono.error(new ResponseStatusException(response.statusCode(), "Failed to get cart")))
                        .bodyToMono(new ParameterizedTypeReference<List<CartItemDto>>() {}))
                .switchIfEmpty(Mono.just(List.of()));
    }

    public Mono<Void> clearCart() {
        return currentBearerToken()
                .flatMap(token -> webClient.delete()
                        .uri(CART_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .onStatus(HttpStatusCode::isError, response -> 
                                Mono.error(new ResponseStatusException(response.statusCode(), "Failed to clear cart")))
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
