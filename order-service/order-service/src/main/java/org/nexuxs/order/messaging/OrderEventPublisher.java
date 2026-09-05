package org.nexuxs.order.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.OrderCreatedEvent;
import org.nexuxs.messaging.contracts.event.OrderLineRecord;
import org.nexuxs.order.data.model.Order;
import org.nexuxs.order.data.repository.OrderLineRepository;
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
    private final OrderLineRepository orderLineRepository;

    public Mono<Void> publish(Order order) {
        return orderLineRepository.findByOrderId(order.getId())
                .map(line -> new OrderLineRecord(
                        line.getProductId(),
                        line.getQuantity(),
                        line.getUnitPrice()))
                .collectList()
                .flatMap(items -> {
                    OrderCreatedEvent event = new OrderCreatedEvent(
                            order.getId(),
                            order.getUserId(),
                            null,
                            items.stream().mapToInt(OrderLineRecord::quantity).sum(),
                            items,
                            order.getTotalPrice(),
                            order.getStatus().name(),
                            Instant.now()
                    );
                    String key = order.getId() != null ? order.getId().toString() : order.getUserId();
                    return Mono.fromFuture(() -> kafkaTemplate.send(NexusTopics.ORDER_CREATED, key, event))
                            .doOnSuccess(result -> log.info("Published {} for orderId={} with {} items",
                                    NexusTopics.ORDER_CREATED, order.getId(), items.size()))
                            .doOnError(error -> log.error("Failed to publish {} for orderId={}",
                                    NexusTopics.ORDER_CREATED, order.getId(), error));
                })
                .subscribeOn(Schedulers.boundedElastic())
                .then();
    }
}
