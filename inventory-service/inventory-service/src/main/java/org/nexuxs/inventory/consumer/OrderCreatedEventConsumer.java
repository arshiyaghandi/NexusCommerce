package org.nexuxs.inventory.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.inventory.service.InventoryService;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.OrderCreatedEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Saga execution listener: the inventory-service reacts to a newly created order by
 * attempting to reserve stock. On success it publishes {@code nexus.inventory.reserved};
 * on failure it publishes {@code inventory.failed.topic}, which the order-service turns
 * into an immediate {@code REJECTED} order. This is the first hop of the choreography.
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class OrderCreatedEventConsumer {

    private final InventoryService inventoryService;

    @KafkaListener(
            topics = NexusTopics.ORDER_CREATED,
            groupId = "inventory-service",
            containerFactory = "orderCreatedListenerFactory"
    )
    public void consume(OrderCreatedEvent event) {
        log.info("[inventory] order.created | orderId={} userId={} items={}",
                event.orderId(), event.userId(), event.items().size());

        inventoryService.handleOrderCreated(event)
                .subscribe(
                        null,
                        error -> {
                            log.error("[inventory] failed to handle order.created for orderId={}",
                                    event.orderId(), error);
                        }
                );
    }
}
