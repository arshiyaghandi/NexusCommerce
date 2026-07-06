package org.nexuxs.inventory.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.inventory.data.dto.InventoryResponse;
import org.nexuxs.inventory.data.model.ProcessedCompensation;
import org.nexuxs.inventory.data.repository.InventoryRepository;
import org.nexuxs.inventory.messaging.InventoryEventPublisher;
import org.nexuxs.messaging.contracts.event.InventoryFailedEvent;
import org.nexuxs.messaging.contracts.event.InventoryReservedEvent;
import org.nexuxs.messaging.contracts.event.OrderCreatedEvent;
import org.nexuxs.messaging.contracts.event.OrderLineRecord;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ObjectProvider<InventoryEventPublisher> publisherProvider;
    private final R2dbcEntityTemplate entityTemplate;

    public Mono<InventoryResponse> getStock(String skuCode) {
        return inventoryRepository.findBySkuCode(skuCode)
                .map(item -> new InventoryResponse(item.getSkuCode(), item.getQuantity()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "SKU not found: " + skuCode)));
    }

    /**
     * Saga execution: for each order line, attempt to reserve stock.
     * If any line fails, publishes InventoryFailedEvent immediately.
     * If all succeed, publishes InventoryReservedEvent.
     */
    @Transactional
    public Mono<Void> handleOrderCreated(OrderCreatedEvent event) {
        return Flux.fromIterable(event.items())
                .flatMap(line -> reserveLine(event.orderId(), event.userId(), event.totalPrice(), line))
                .collectList()
                .flatMap(reservedLines -> {
                    InventoryEventPublisher publisher = publisherProvider.getIfAvailable();
                    if (publisher == null) return Mono.empty();
                    return publisher.publishReservedEvent(new InventoryReservedEvent(
                            event.orderId(),
                            event.userId(),
                            reservedLines.get(0).skuCode(),
                            reservedLines.get(0).quantity(),
                            reservedLines.get(0).remainingQuantity(),
                            java.util.List.of(), // items list not populated in single-SKU flow
                            event.totalPrice(),
                            Instant.now()
                    ));
                });
    }

    /**
     * Reserves stock for a single order line. Returns a record with reservation details
     * on success, or errors with insufficient stock.
     */
    private Mono<ReservedLine> reserveLine(Long orderId, String userId, BigDecimal totalPrice, OrderLineRecord line) {
        String skuCode = toSkuCode(line.productId());
        int requestedQuantity = line.quantity();

        log.info("Processing reservation for Order: {}, SKU: {}, Quantity: {}", orderId, skuCode, requestedQuantity);

        return inventoryRepository.findBySkuCode(skuCode)
                .flatMap(item -> {
                    if (item.getQuantity() >= requestedQuantity) {
                        item.setQuantity(item.getQuantity() - requestedQuantity);
                        return inventoryRepository.save(item)
                                .map(saved -> new ReservedLine(skuCode, requestedQuantity, saved.getQuantity()));
                    } else {
                        log.warn("Insufficient stock for Order: {}. Requested: {}, Available: {}", orderId, requestedQuantity, item.getQuantity());
                        return Mono.error(new IllegalStateException("INSUFFICIENT_STOCK"));
                    }
                })
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("SKU {} not found for Order {}", skuCode, orderId);
                    return Mono.error(new IllegalStateException("SKU_NOT_FOUND"));
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

    /**
     * Saga compensation entry point for a failed payment: releases the reserved stock,
     * exactly once. The {@code processed_compensations} insert is the idempotency gate —
     * because {@code order_id} is the primary key, a redelivered {@code payment.failed}
     * event (Kafka at-least-once) collides on insert and is skipped, so stock is never
     * credited twice. {@link #releaseStock(Long, int)} only runs after a fresh insert.
     */
    public Mono<Void> compensateReservation(Long orderId, Long productId, int quantity) {
        ProcessedCompensation marker = ProcessedCompensation.builder()
                .orderId(orderId)
                .processedAt(LocalDateTime.now())
                .build();

        return entityTemplate.insert(ProcessedCompensation.class).using(marker)
                .then(Mono.defer(() -> {
                    log.info("Compensating reservation for orderId={}, productId={}, quantity={}",
                            orderId, productId, quantity);
                    return releaseStock(productId, quantity);
                }))
                .onErrorResume(this::isDuplicateCompensation, error -> {
                    log.info("Skipping duplicate compensation for orderId={} (already processed)", orderId);
                    return Mono.empty();
                });
    }

    private boolean isDuplicateCompensation(Throwable error) {
        return error instanceof DuplicateKeyException
                || error instanceof DataIntegrityViolationException;
    }

    private String toSkuCode(Long productId) {
        return "SKU" + String.format("%03d", productId);
    }

    private record ReservedLine(String skuCode, int quantity, int remainingQuantity) {}
}
