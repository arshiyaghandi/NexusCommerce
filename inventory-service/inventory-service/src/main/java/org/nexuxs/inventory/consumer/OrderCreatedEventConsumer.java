package org.nexuxs.inventory.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.inventory.service.InventoryService;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.OrderCreatedEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Entry point for the inventory portion of the checkout Saga.
 * Listens for new orders and attempts to reserve stock.
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
                event.orderId(), event.userId(), event.items() != null ? event.items().size() : 0);

        try {
            inventoryService.handleOrderCreated(event).block(Duration.ofSeconds(30));
        } catch (Exception e) {
            log.error("[inventory] failed to handle order.created for orderId={}", event.orderId(), e);
            throw e;
        }
    }
}
