package org.nexuxs.messaging.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@Profile("!test")
public class KafkaTopicConfig {

    @Bean
    public NewTopic orderCreatedTopic() {
        return TopicBuilder.name(NexusTopics.ORDER_CREATED)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic inventoryReservedTopic() {
        return TopicBuilder.name(NexusTopics.INVENTORY_RESERVED)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
