package org.nexuxs.order.client;

import lombok.RequiredArgsConstructor;
import org.nexuxs.order.data.dto.ProductDto;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Inter-service client that fetches product details (source-of-truth price) from
 * product-service via Eureka load-balanced WebClient.
 */
@Component
@RequiredArgsConstructor
public class ProductClient {

    private static final String PRODUCT_URL = "http://product-service/api/products";

    private final WebClient.Builder webClientBuilder;

    public Mono<ProductDto> getProduct(Long productId) {
        return currentBearerToken()
                .flatMap(token -> webClientBuilder.build()
                        .get()
                        .uri(PRODUCT_URL + "/{id}", productId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .bodyToMono(ProductDto.class));
    }

    private Mono<String> currentBearerToken() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .cast(JwtAuthenticationToken.class)
                .map(auth -> auth.getToken().getTokenValue())
                .switchIfEmpty(Mono.error(new IllegalStateException("Missing authentication for product call")));
    }
}
