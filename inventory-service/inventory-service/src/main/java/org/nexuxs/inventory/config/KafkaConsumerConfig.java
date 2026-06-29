package org.nexuxs.inventory.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.nexuxs.messaging.contracts.event.PaymentFailedEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.Map;

/**
 * Kafka consumer infrastructure for inventory-service Saga compensation.
 *
 * <p>inventory-service listens to {@code payment.failed.topic} to release stock that was
 * reserved before payment failed. The deserialization target is pinned explicitly because
 * producers disable type headers ({@code spring.json.add.type.headers=false}); the
 * service's {@code application.yml} therefore needs no consumer block.
 */
@Configuration
@Profile("!test")
public class KafkaConsumerConfig {

    private static final String GROUP_ID = "inventory-service";
    private static final String CONTRACTS_PACKAGE = "org.nexuxs.messaging.contracts.event";

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentFailedEvent> paymentFailedListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PaymentFailedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(buildConsumerFactory(PaymentFailedEvent.class));
        return factory;
    }

    private <T> ConsumerFactory<String, T> buildConsumerFactory(Class<T> eventType) {
        Map<String, Object> props = Map.of(
                ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers,
                ConsumerConfig.GROUP_ID_CONFIG, GROUP_ID,
                ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest",
                ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class
        );

        JsonDeserializer<T> jsonDeserializer = new JsonDeserializer<>(eventType, false);
        jsonDeserializer.addTrustedPackages(CONTRACTS_PACKAGE);

        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), jsonDeserializer);
    }
}
