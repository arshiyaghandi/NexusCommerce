package org.nexuxs.payment.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.PaymentCompletedEvent;
import org.nexuxs.payment.data.model.Payment;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nexus.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)
public class PaymentEventPublisher {

    private final KafkaTemplate<String, PaymentCompletedEvent> kafkaTemplate;

    public Mono<Void> publish(Payment payment) {
        return Mono.fromRunnable(() -> {
            PaymentCompletedEvent event = new PaymentCompletedEvent(
                    payment.getId(),
                    payment.getOrderId(),
                    payment.getUserId(),
                    payment.getAmount(),
                    payment.getStatus().name(),
                    Instant.now()
            );
            String key = payment.getId() != null ? payment.getId().toString() : payment.getOrderId().toString();
            kafkaTemplate.send(NexusTopics.PAYMENT_COMPLETED, key, event);
            log.info("Published {} for paymentId={}", NexusTopics.PAYMENT_COMPLETED, payment.getId());
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }
}
