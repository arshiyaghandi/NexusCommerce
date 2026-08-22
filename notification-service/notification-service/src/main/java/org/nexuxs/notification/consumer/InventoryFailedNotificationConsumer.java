package org.nexuxs.notification.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.InventoryFailedEvent;
import org.nexuxs.notification.websocket.NotificationHub;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class InventoryFailedNotificationConsumer {

    private final NotificationHub notificationHub;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = NexusTopics.INVENTORY_FAILED,
            groupId = "notification-service",
            containerFactory = "inventoryFailedListenerFactory"
    )
    public void consume(InventoryFailedEvent event) {
        try {
            Map<String, Object> notification = Map.of(
                    "type", "INVENTORY_FAILED",
                    "orderId", event.orderId(),
                    "status", "REJECTED",
                    "message", "Order #" + event.orderId() + " rejected: insufficient stock"
            );
            String payload = objectMapper.writeValueAsString(notification);
            log.info("[notification] broadcasting INVENTORY_FAILED for orderId={}", event.orderId());
            notificationHub.broadcast(payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize INVENTORY_FAILED event", e);
        }
    }
}
