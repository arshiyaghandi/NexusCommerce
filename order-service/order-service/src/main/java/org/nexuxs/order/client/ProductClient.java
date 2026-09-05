package org.nexuxs.order.client;

import lombok.extern.slf4j.Slf4j;
import org.nexuxs.order.data.dto.ProductDto;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

/**
 * Inter-service client that fetches product details (source-of-truth price) from
 * product-service via Eureka load-balanced WebClient.
 */
@Slf4j
@Component
public class ProductClient {

    private static final String PRODUCT_URL = "http://product-service/api/products/";
    private final WebClient webClient;

    public ProductClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public Mono<ProductDto> getProduct(Long productId) {
        return currentBearerToken()
                .flatMap(token -> webClient.get()
                        .uri(PRODUCT_URL + productId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .onStatus(HttpStatusCode::isError, response -> 
                                Mono.error(new ResponseStatusException(response.statusCode(), "Failed to get product: " + productId)))
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
