package org.nexuxs.order.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.InventoryFailedEvent;
import org.nexuxs.order.service.OrderService;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Saga compensation listener: an inventory reservation failure rejects the order.
 * No stock was decremented, so {@link OrderService#applyInventoryFailure(Long)} only
 * needs to move the order to a terminal {@code REJECTED} state.
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class InventoryFailedEventConsumer {

    private final OrderService orderService;

    @KafkaListener(
            topics = NexusTopics.INVENTORY_FAILED,
            groupId = "order-service",
            containerFactory = "inventoryFailedListenerFactory"
    )
    public void consume(InventoryFailedEvent event) {
        log.info("[order] inventory.failed | orderId={} skuCode={} reason={}",
                event.orderId(), event.skuCode(), event.reason());

        orderService.applyInventoryFailure(event.orderId())
                .subscribe(
                        order -> log.info("[order] saga applied | orderId={} -> {}",
                                order.getId(), order.getStatus()),
                        error -> log.error("[order] failed to reject order for orderId={}",
                                event.orderId(), error)
                );
    }
}
