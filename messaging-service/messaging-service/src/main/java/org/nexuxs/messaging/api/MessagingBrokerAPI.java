package org.nexuxs.messaging.api;

import org.nexuxs.messaging.contracts.NexusTopics;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messaging")
public class MessagingBrokerAPI {

    @GetMapping("/topics")
    public Map<String, Object> topics() {
        return Map.of(
                "broker", "kafka",
                "topics", List.of(
                        NexusTopics.ORDER_CREATED,
                        NexusTopics.INVENTORY_RESERVED,
                        NexusTopics.INVENTORY_FAILED,
                        NexusTopics.PAYMENT_COMPLETED,
                        NexusTopics.PAYMENT_FAILED
                )
        );
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "role", "message-broker-hub");
    }
}
