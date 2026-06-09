package org.nexuxs.order.client;

import lombok.RequiredArgsConstructor;
import org.nexuxs.order.data.dto.InventoryReserveRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class InventoryClient {

    private static final String INVENTORY_RESERVE_URL = "http://inventory-service/api/inventory/reserve";

    private final WebClient.Builder webClientBuilder;

    public Mono<Void> reserveStock(String skuCode, int quantity) {
        return currentBearerToken()
                .flatMap(token -> webClientBuilder.build()
                        .post()
                        .uri(INVENTORY_RESERVE_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .bodyValue(new InventoryReserveRequest(skuCode, quantity))
                        .retrieve()
                        .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                                .defaultIfEmpty("Inventory reservation failed")
                                .flatMap(message -> Mono.error(new IllegalStateException(message))))
                        .toBodilessEntity()
                        .then());
    }

    private Mono<String> currentBearerToken() {
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> context.getAuthentication())
                .cast(JwtAuthenticationToken.class)
                .map(auth -> auth.getToken().getTokenValue())
                .switchIfEmpty(Mono.error(new IllegalStateException("Missing authentication for inventory call")));
    }
}
