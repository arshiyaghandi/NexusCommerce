package org.nexuxs.notification.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.OrderCreatedEvent;
import org.nexuxs.notification.websocket.NotificationHub;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class OrderCreatedNotificationConsumer {

    private final NotificationHub notificationHub;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = NexusTopics.ORDER_CREATED,
            groupId = "notification-service",
            containerFactory = "orderCreatedListenerFactory"
    )
    public void consume(OrderCreatedEvent event) {
        try {
            Map<String, Object> notification = Map.of(
                    "type", "ORDER_CREATED",
                    "orderId", event.orderId(),
                    "status", "PENDING",
                    "message", "Your order #" + event.orderId() + " has been placed successfully"
            );
            String payload = objectMapper.writeValueAsString(notification);
            log.info("[notification] sending ORDER_CREATED to userId={}", event.userId());
            notificationHub.sendToUser(event.userId(), payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize ORDER_CREATED event", e);
        }
    }
}
