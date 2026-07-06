package org.nexuxs.payment.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.InventoryReservedEvent;
import org.nexuxs.payment.service.PaymentService;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Saga listener: payment-service reacts to a successful inventory reservation by
 * processing the payment, then publishing {@code nexus.payment.completed} (or
 * {@code payment.failed.topic} on failure). This is the second hop of the choreography.
 *
 * <p>Uses the bare {@code @KafkaListener} style backed by the {@code spring.kafka.consumer}
 * block in {@code application.yml} (matching the pattern used by services without an
 * explicit {@code KafkaConsumerConfig}). Deserialization target is pinned via
 * {@code JsonDeserializer} trusting {@code org.nexuxs.messaging.contracts.event}.
 */
@Component
@Slf4j
@Profile("!test")
@RequiredArgsConstructor
public class InventoryReservedEventConsumer {

    private final PaymentService paymentService;

    @KafkaListener(topics = NexusTopics.INVENTORY_RESERVED, groupId = "payment-service-group")
    public void onInventoryReserved(InventoryReservedEvent event) {
        log.info("[payment] inventory.reserved | orderId={} user={} amount={}",
                event.orderId(), event.userId(), event.totalPrice());

        paymentService.processPayment(event).subscribe(
                null,
                error -> log.error("[payment] failed to process payment for orderId={}",
                        event.orderId(), error)
        );
    }
}