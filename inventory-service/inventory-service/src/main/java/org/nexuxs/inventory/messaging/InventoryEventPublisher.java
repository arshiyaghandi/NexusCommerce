package org.nexuxs.inventory.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.InventoryFailedEvent;
import org.nexuxs.messaging.contracts.event.InventoryReservedEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nexus.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)
public class InventoryEventPublisher {

    // نوع داده به Object تغییر کرده تا هر دو کلاس رویداد را پشتیبانی کند
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public Mono<Void> publishReservedEvent(InventoryReservedEvent event) {
        return Mono.fromRunnable(() -> {
            kafkaTemplate.send(NexusTopics.INVENTORY_RESERVED, String.valueOf(event.orderId()), event);
            log.info("Published {} for orderId {}", NexusTopics.INVENTORY_RESERVED, event.orderId());
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }

    public Mono<Void> publishFailedEvent(InventoryFailedEvent event) {
        return Mono.fromRunnable(() -> {
            kafkaTemplate.send(NexusTopics.INVENTORY_FAILED, String.valueOf(event.orderId()), event);
            log.error("Published {} for orderId {} due to: {}", NexusTopics.INVENTORY_FAILED, event.orderId(), event.reason());
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }
}