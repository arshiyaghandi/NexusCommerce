package org.nexuxs.inventory.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.nexuxs.messaging.contracts.event.OrderCreatedEvent;
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
 * Kafka consumer infrastructure for inventory-service's role in the Saga.
 *
 * <p>inventory-service listens to two events:
 * <ul>
 *     <li>{@code nexus.order.created} – the first Saga hop: reserve stock and publish
 *         {@code nexus.inventory.reserved} (or {@code inventory.failed.topic}).</li>
 *     <li>{@code payment.failed.topic} – Saga compensation: release stock that was reserved
 *         before payment failed.</li>
 * </ul>
 * The deserialization target is pinned explicitly for each event because producers disable
 * type headers ({@code spring.json.add.type.headers=false}); the service's
 * {@code application.yml} therefore needs no consumer block.
 */
@Configuration
@Profile("!test")
public class KafkaConsumerConfig {

    private static final String GROUP_ID = "inventory-service";
    private static final String CONTRACTS_PACKAGE = "org.nexuxs.messaging.contracts.event";

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderCreatedEvent> orderCreatedListenerFactory() {
        return listenerFactory(OrderCreatedEvent.class);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentFailedEvent> paymentFailedListenerFactory() {
        return listenerFactory(PaymentFailedEvent.class);
    }

    private <T> ConcurrentKafkaListenerContainerFactory<String, T> listenerFactory(Class<T> eventType) {
        ConcurrentKafkaListenerContainerFactory<String, T> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(buildConsumerFactory(eventType));
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
