package org.nexuxs.messaging.consumer;

import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.OrderCreatedEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!test")
public class OrderCreatedEventConsumer {

    @KafkaListener(
            topics = NexusTopics.ORDER_CREATED,
            groupId = "messaging-service",
            containerFactory = "orderCreatedListenerFactory"
    )
    public void consume(OrderCreatedEvent event) {
        log.info("[messaging-broker] order.created | orderId={} user={} items={} total={} status={}",
                event.orderId(), event.userId(), event.items().size(),
                event.totalPrice(), event.status());
    }
}
