package org.nexuxs.payment.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.PaymentCompletedEvent;
import org.nexuxs.messaging.contracts.event.PaymentFailedEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nexus.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)
public class PaymentEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public Mono<Void> publishSuccessEvent(PaymentCompletedEvent event) {
        return Mono.fromRunnable(() -> {
            kafkaTemplate.send(NexusTopics.PAYMENT_COMPLETED, String.valueOf(event.orderId()), event);
            log.info("Published {} for orderId={}", NexusTopics.PAYMENT_COMPLETED, event.orderId());
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }

    public Mono<Void> publishFailedEvent(PaymentFailedEvent event) {
        return Mono.fromRunnable(() -> {
            kafkaTemplate.send(NexusTopics.PAYMENT_FAILED, String.valueOf(event.orderId()), event);
            log.error("Published {} for orderId={} due to: {}", NexusTopics.PAYMENT_FAILED, event.orderId(), event.reason());
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }
}