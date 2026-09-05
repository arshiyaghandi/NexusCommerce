package org.nexuxs.notification.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.InventoryReservedEvent;
import org.nexuxs.notification.websocket.NotificationHub;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class InventoryReservedNotificationConsumer {

    private final NotificationHub notificationHub;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = NexusTopics.INVENTORY_RESERVED,
            groupId = "notification-service",
            containerFactory = "inventoryReservedListenerFactory"
    )
    public void consume(InventoryReservedEvent event) {
        try {
            Map<String, Object> notification = Map.of(
                    "type", "INVENTORY_RESERVED",
                    "orderId", event.orderId(),
                    "status", "PROCESSING",
                    "message", "Stock reserved for order #" + event.orderId()
            );
            String payload = objectMapper.writeValueAsString(notification);
            log.info("[notification] sending INVENTORY_RESERVED to userId={}", event.userId());
            notificationHub.sendToUser(event.userId(), payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize INVENTORY_RESERVED event", e);
        }
    }
}
