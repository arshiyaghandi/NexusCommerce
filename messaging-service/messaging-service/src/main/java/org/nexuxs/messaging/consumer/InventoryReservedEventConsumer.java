package org.nexuxs.messaging.consumer;

import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.InventoryReservedEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!test")
public class InventoryReservedEventConsumer {

    @KafkaListener(
            topics = NexusTopics.INVENTORY_RESERVED,
            groupId = "messaging-service",
            containerFactory = "inventoryReservedListenerFactory"
    )
    public void consume(InventoryReservedEvent event) {
        log.info("[messaging-broker] inventory.reserved | sku={} quantity={} remaining={}",
                event.skuCode(), event.quantity(), event.remainingQuantity());
    }
}
