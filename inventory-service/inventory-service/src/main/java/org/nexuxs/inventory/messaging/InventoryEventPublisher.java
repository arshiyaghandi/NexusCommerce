package org.nexuxs.inventory.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.inventory.data.model.Inventory;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.InventoryReservedEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nexus.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)
public class InventoryEventPublisher {

    private final KafkaTemplate<String, InventoryReservedEvent> kafkaTemplate;

    public Mono<Void> publish(Inventory inventory, int reservedQuantity) {
        return Mono.fromRunnable(() -> {
            InventoryReservedEvent event = new InventoryReservedEvent(
                    inventory.getSkuCode(),
                    reservedQuantity,
                    inventory.getQuantity(),
                    Instant.now()
            );
            kafkaTemplate.send(NexusTopics.INVENTORY_RESERVED, inventory.getSkuCode(), event);
            log.info("Published {} for sku {}", NexusTopics.INVENTORY_RESERVED, inventory.getSkuCode());
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }
}
