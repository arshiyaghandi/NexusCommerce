package org.nexuxs.notification.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.PaymentCompletedEvent;
import org.nexuxs.notification.websocket.NotificationHub;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class PaymentCompletedNotificationConsumer {

    private final NotificationHub notificationHub;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = NexusTopics.PAYMENT_COMPLETED,
            groupId = "notification-service",
            containerFactory = "paymentCompletedListenerFactory"
    )
    public void consume(PaymentCompletedEvent event) {
        try {
            Map<String, Object> notification = Map.of(
                    "type", "PAYMENT_COMPLETED",
                    "orderId", event.orderId(),
                    "status", "COMPLETED",
                    "message", "Payment confirmed for order #" + event.orderId()
            );
            String payload = objectMapper.writeValueAsString(notification);
            log.info("[notification] sending PAYMENT_COMPLETED to userId={}", event.userId());
            notificationHub.sendToUser(event.userId(), payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize PAYMENT_COMPLETED event", e);
        }
    }
}
