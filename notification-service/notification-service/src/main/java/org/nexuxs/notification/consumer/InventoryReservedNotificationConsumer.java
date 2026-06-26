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
        broadcast(NexusTopics.INVENTORY_RESERVED, event);
    }

    private void broadcast(String topic, Object event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            log.info("[notification] broadcasting {} event", topic);
            notificationHub.broadcast(payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event from topic {}", topic, e);
        }
    }
}
