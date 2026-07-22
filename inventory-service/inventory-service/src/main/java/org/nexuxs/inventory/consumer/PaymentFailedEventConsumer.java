package org.nexuxs.inventory.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.inventory.service.InventoryService;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.PaymentFailedEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

/**
 * Saga compensation listener: when a payment fails after stock was reserved, this
 * releases the reserved units back to inventory for ALL order lines. Compensation is
 * idempotent — see {@link InventoryService#compensateReservation(Long, Long, int)}.
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class PaymentFailedEventConsumer {

    private final InventoryService inventoryService;

    @KafkaListener(
            topics = NexusTopics.PAYMENT_FAILED,
            groupId = "inventory-service",
            containerFactory = "paymentFailedListenerFactory"
    )
    public void consume(PaymentFailedEvent event) {
        log.info("[inventory] payment.failed | orderId={} items={} reason={}",
                event.orderId(), event.items() != null ? event.items().size() : 0, event.reason());

        if (event.items() == null || event.items().isEmpty()) {
            log.warn("[inventory] payment.failed for orderId={} has no items, skipping compensation", event.orderId());
            return;
        }

        Flux.fromIterable(event.items())
                .flatMap(item -> inventoryService.compensateReservation(
                        event.orderId(), item.productId(), item.quantity()))
                .subscribe(
                        null,
                        error -> log.error("[inventory] failed to compensate reservation for orderId={}",
                                event.orderId(), error)
                );
    }
}
