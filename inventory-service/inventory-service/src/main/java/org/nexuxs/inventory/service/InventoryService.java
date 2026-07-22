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
import org.nexuxs.messaging.contracts.event.ReservedLineRecord;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
     * If all succeed, publishes InventoryReservedEvent.
     * If any line fails, releases all previously reserved stock for this order
     * and publishes InventoryFailedEvent so the order-service can reject the order.
     */
    public Mono<Void> handleOrderCreated(OrderCreatedEvent event) {
        List<ReservedLine> reserved = new ArrayList<>();

        return Flux.fromIterable(event.items())
                .flatMap(line -> reserveLine(event.orderId(), event.userId(), event.totalPrice(), line)
                        .doOnNext(reserved::add))
                .collectList()
                .flatMap(reservedLines -> {
                    InventoryEventPublisher publisher = publisherProvider.getIfAvailable();
                    if (publisher == null) return Mono.empty();

                    List<ReservedLineRecord> items = reservedLines.stream()
                            .map(rl -> new ReservedLineRecord(null, rl.skuCode(), rl.quantity(), rl.remainingQuantity()))
                            .toList();

                    return publisher.publishReservedEvent(new InventoryReservedEvent(
                            event.orderId(),
                            event.userId(),
                            reservedLines.get(0).skuCode(),
                            reservedLines.stream().mapToInt(ReservedLine::quantity).sum(),
                            reservedLines.get(0).remainingQuantity(),
                            items,
                            event.totalPrice(),
                            Instant.now()
                    ));
                })
                .onErrorResume(error -> {
                    String reason = error.getMessage() != null ? error.getMessage() : "RESERVATION_FAILED";
                    String skuCode = event.items().isEmpty() ? "UNKNOWN" : toSkuCode(event.items().get(0).productId());
                    log.error("Reservation failed for orderId={}, publishing InventoryFailedEvent: {}",
                            event.orderId(), reason);

                    // Release stock for any lines that were already reserved before the failure
                    return Flux.fromIterable(reserved)
                            .flatMap(rl -> releaseStock(toProductId(rl.skuCode()), rl.quantity()))
                            .then(Mono.defer(() -> {
                                InventoryEventPublisher publisher = publisherProvider.getIfAvailable();
                                if (publisher == null) return Mono.empty();

                                return publisher.publishFailedEvent(new InventoryFailedEvent(
                                        event.orderId(),
                                        skuCode,
                                        reason,
                                        Instant.now()
                                ));
                            }));
                });
    }

    /**
     * Reserves stock for a single order line using an atomic UPDATE to prevent
     * the TOCTOU race condition. Returns a record with reservation details
     * on success, or errors with insufficient stock.
     */
    private Mono<ReservedLine> reserveLine(Long orderId, String userId, BigDecimal totalPrice, OrderLineRecord line) {
        String skuCode = toSkuCode(line.productId());
        int requestedQuantity = line.quantity();

        log.info("Processing reservation for Order: {}, SKU: {}, Quantity: {}", orderId, skuCode, requestedQuantity);

        return inventoryRepository.decrementStock(skuCode, requestedQuantity)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Insufficient stock or SKU not found for Order: {}. SKU: {}, Requested: {}",
                            orderId, skuCode, requestedQuantity);
                    return Mono.error(new IllegalStateException("INSUFFICIENT_STOCK"));
                }))
                .map(saved -> new ReservedLine(skuCode, requestedQuantity, saved.getQuantity()));
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
     *
     * <p>If {@link #releaseStock} fails after the marker was inserted, the marker is
     * removed so the next Kafka redelivery can retry the compensation.
     */
    public Mono<Void> compensateReservation(Long orderId, Long productId, int quantity) {
        ProcessedCompensation marker = ProcessedCompensation.builder()
                .orderId(orderId)
                .productId(productId)
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
                })
                .onErrorResume(error -> {

                    log.warn("Stock release failed for orderId={}, productId={}, removing idempotency marker for retry: {}",
                            orderId, productId, error.getMessage());
                    Query deleteQuery = Query.query(Criteria.where("orderId").is(orderId)
                            .and("productId").is(productId));
                    return entityTemplate.delete(ProcessedCompensation.class)
                            .matching(deleteQuery)
                            .all()
                            .then(Mono.error(error));
                });
    }

    private boolean isDuplicateCompensation(Throwable error) {
        return error instanceof DuplicateKeyException
                || error instanceof DataIntegrityViolationException;
    }

    private String toSkuCode(Long productId) {
        return "SKU" + String.format("%03d", productId);
    }

    private Long toProductId(String skuCode) {
        return Long.parseLong(skuCode.replace("SKU", ""));
    }

    private record ReservedLine(String skuCode, int quantity, int remainingQuantity) {}
}
