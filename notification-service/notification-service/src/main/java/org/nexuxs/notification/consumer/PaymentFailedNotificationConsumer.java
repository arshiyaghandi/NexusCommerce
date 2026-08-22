package org.nexuxs.notification.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.PaymentFailedEvent;
import org.nexuxs.notification.websocket.NotificationHub;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class PaymentFailedNotificationConsumer {

    private final NotificationHub notificationHub;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = NexusTopics.PAYMENT_FAILED,
            groupId = "notification-service",
            containerFactory = "paymentFailedListenerFactory"
    )
    public void consume(PaymentFailedEvent event) {
        try {
            Map<String, Object> notification = Map.of(
                    "type", "PAYMENT_FAILED",
                    "orderId", event.orderId(),
                    "status", "CANCELLED",
                    "message", "Payment failed for order #" + event.orderId() + ": " + event.reason()
            );
            String payload = objectMapper.writeValueAsString(notification);
            log.info("[notification] broadcasting PAYMENT_FAILED for orderId={}", event.orderId());
            notificationHub.broadcast(payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize PAYMENT_FAILED event", e);
        }
    }
}
