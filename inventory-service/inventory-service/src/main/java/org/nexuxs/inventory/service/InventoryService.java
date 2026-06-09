package org.nexuxs.inventory.service;

import lombok.RequiredArgsConstructor;
import org.nexuxs.inventory.data.dto.InventoryResponse;
import org.nexuxs.inventory.data.dto.ReserveRequest;
import org.nexuxs.inventory.data.model.Inventory;
import org.nexuxs.inventory.data.repository.InventoryRepository;
import org.nexuxs.inventory.messaging.InventoryEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ObjectProvider<InventoryEventPublisher> inventoryEventPublisherProvider;

    public Mono<InventoryResponse> getStock(String skuCode) {
        return inventoryRepository.findBySkuCode(skuCode)
                .map(item -> new InventoryResponse(item.getSkuCode(), item.getQuantity()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "SKU not found: " + skuCode)));
    }

    public Mono<Void> reserveStock(ReserveRequest request) {
        if (request.quantity() <= 0) {
            return Mono.error(new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Quantity must be greater than zero"));
        }

        return inventoryRepository.findBySkuCode(request.skuCode())
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "SKU not found: " + request.skuCode())))
                .flatMap(item -> updateQuantity(item, request.quantity()));
    }

    private Mono<Void> updateQuantity(Inventory item, int requestedQuantity) {
        if (item.getQuantity() < requestedQuantity) {
            return Mono.error(new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient stock for SKU " + item.getSkuCode()
                            + ". Available: " + item.getQuantity() + ", requested: " + requestedQuantity));
        }

        item.setQuantity(item.getQuantity() - requestedQuantity);
        return inventoryRepository.save(item)
                .flatMap(saved -> {
                    InventoryEventPublisher publisher = inventoryEventPublisherProvider.getIfAvailable();
                    Mono<Void> published = publisher != null
                            ? publisher.publish(saved, requestedQuantity)
                            : Mono.empty();
                    return published.then();
                });
    }
}
