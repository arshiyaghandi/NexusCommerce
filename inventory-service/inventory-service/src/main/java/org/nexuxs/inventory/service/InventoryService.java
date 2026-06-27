package org.nexuxs.inventory.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.inventory.data.dto.InventoryResponse;
import org.nexuxs.inventory.data.repository.InventoryRepository;
import org.nexuxs.inventory.messaging.InventoryEventPublisher;
import org.nexuxs.messaging.contracts.event.InventoryFailedEvent;
import org.nexuxs.messaging.contracts.event.InventoryReservedEvent;
import org.nexuxs.messaging.contracts.event.OrderCreatedEvent;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ObjectProvider<InventoryEventPublisher> publisherProvider;

    public Mono<InventoryResponse> getStock(String skuCode) {
        return inventoryRepository.findBySkuCode(skuCode)
                .map(item -> new InventoryResponse(item.getSkuCode(), item.getQuantity()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "SKU not found: " + skuCode)));
    }

    public Mono<Void> handleOrderCreated(OrderCreatedEvent event) {
        // خواندن دیتا از record با متدهای مستقیم
        String skuCode = toSkuCode(event.productId());
        int requestedQuantity = event.quantity();

        log.info("Processing reservation for Order: {}, SKU: {}, Quantity: {}", event.orderId(), skuCode, requestedQuantity);

        return inventoryRepository.findBySkuCode(skuCode)
                .flatMap(item -> {
                    if (item.getQuantity() >= requestedQuantity) {
                        item.setQuantity(item.getQuantity() - requestedQuantity);
                        return inventoryRepository.save(item)
                                .flatMap(saved -> publishSuccess(event, saved.getQuantity()));
                    } else {
                        log.warn("Insufficient stock for Order: {}. Requested: {}, Available: {}", event.orderId(), requestedQuantity, item.getQuantity());
                        return publishFailure(event, "INSUFFICIENT_STOCK");
                    }
                })
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("SKU {} not found for Order {}", skuCode, event.orderId());
                    return publishFailure(event, "SKU_NOT_FOUND");
                }));
    }

    public Mono<Void> releaseStock(Long productId, int quantity) {
        String skuCode = toSkuCode(productId);
        return inventoryRepository.findBySkuCode(skuCode)
                .flatMap(item -> {
                    item.setQuantity(item.getQuantity() + quantity);
                    return inventoryRepository.save(item)
                            .doOnSuccess(saved -> log.info("Compensating action: Released {} units of {} back to inventory.", quantity, skuCode));
                })
                .then();
    }

    private Mono<Void> publishSuccess(OrderCreatedEvent event, int remainingQuantity) {
        InventoryEventPublisher publisher = publisherProvider.getIfAvailable();
        if (publisher == null) return Mono.empty();
        InventoryReservedEvent reservedEvent = new InventoryReservedEvent(
                event.orderId(),
                event.userId(),
                toSkuCode(event.productId()),
                event.quantity(),
                remainingQuantity,
                event.totalPrice(),
                Instant.now()
        );
        return publisher.publishReservedEvent(reservedEvent);
    }

    private Mono<Void> publishFailure(OrderCreatedEvent event, String reason) {
        InventoryEventPublisher publisher = publisherProvider.getIfAvailable();
        if (publisher == null) return Mono.empty();

        InventoryFailedEvent failedEvent = new InventoryFailedEvent(
                event.orderId(),
                toSkuCode(event.productId()),
                reason,
                Instant.now()
        );
        return publisher.publishFailedEvent(failedEvent);
    }

    private String toSkuCode(Long productId) {
        return "SKU" + String.format("%03d", productId);
    }
}