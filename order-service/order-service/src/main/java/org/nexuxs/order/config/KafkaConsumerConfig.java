package org.nexuxs.order.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.nexuxs.messaging.contracts.event.InventoryFailedEvent;
import org.nexuxs.messaging.contracts.event.PaymentCompletedEvent;
import org.nexuxs.messaging.contracts.event.PaymentFailedEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.util.backoff.ExponentialBackOff;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka consumer infrastructure for the order-service Saga listeners.
 *
 * <p>The order-service reacts to three downstream Saga events:
 * <ul>
 *     <li>{@code nexus.payment.completed} – closes the order (COMPLETED / CANCELLED)</li>
 *     <li>{@code inventory.failed.topic} – rejects the order (stock never reserved)</li>
 *     <li>{@code payment.failed.topic} – cancels the order (stock was reserved, then released)</li>
 * </ul>
 *
 * <p>Each event gets a dedicated typed {@link ConcurrentKafkaListenerContainerFactory}
 * built from the shared {@link #buildConsumerFactory(Class)} helper, which pins the
 * deserialization target explicitly. This is required because producers across the
 * platform disable type headers ({@code spring.json.add.type.headers=false}), so the
 * consumer cannot infer the payload type from the record.
 */
@Configuration
@Profile("!test")
public class KafkaConsumerConfig {

    private static final String GROUP_ID = "order-service";
    private static final String CONTRACTS_PACKAGE = "org.nexuxs.messaging.contracts.event";

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentCompletedEvent> paymentCompletedListenerFactory(KafkaTemplate<String, Object> kafkaTemplate) {
        return listenerFactory(PaymentCompletedEvent.class, kafkaTemplate);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, InventoryFailedEvent> inventoryFailedListenerFactory(KafkaTemplate<String, Object> kafkaTemplate) {
        return listenerFactory(InventoryFailedEvent.class, kafkaTemplate);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentFailedEvent> paymentFailedListenerFactory(KafkaTemplate<String, Object> kafkaTemplate) {
        return listenerFactory(PaymentFailedEvent.class, kafkaTemplate);
    }

    private <T> ConcurrentKafkaListenerContainerFactory<String, T> listenerFactory(Class<T> eventType, KafkaTemplate<String, Object> kafkaTemplate) {
        ConcurrentKafkaListenerContainerFactory<String, T> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(buildConsumerFactory(eventType));

        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
                new DeadLetterPublishingRecoverer(kafkaTemplate),
                new ExponentialBackOff(1000L, 2.0)
        );
        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }

    private <T> ConsumerFactory<String, T> buildConsumerFactory(Class<T> eventType) {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, GROUP_ID);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

        JsonDeserializer<T> jsonDeserializer = new JsonDeserializer<>(eventType, false);
        jsonDeserializer.addTrustedPackages(CONTRACTS_PACKAGE);

        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), jsonDeserializer);
    }
}
