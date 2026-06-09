package org.nexuxs.order.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.order.data.model.Order;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.OrderCreatedEvent;
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
public class OrderEventPublisher {

    private final KafkaTemplate<String, OrderCreatedEvent> kafkaTemplate;

    public Mono<Void> publish(Order order) {
        return Mono.fromRunnable(() -> {
            OrderCreatedEvent event = new OrderCreatedEvent(
                    order.getOrderNumber(),
                    order.getSkuCode(),
                    order.getPrice(),
                    order.getQuantity(),
                    Instant.now()
            );
            kafkaTemplate.send(NexusTopics.ORDER_CREATED, order.getOrderNumber(), event);
            log.info("Published {} for order {}", NexusTopics.ORDER_CREATED, order.getOrderNumber());
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }
}
