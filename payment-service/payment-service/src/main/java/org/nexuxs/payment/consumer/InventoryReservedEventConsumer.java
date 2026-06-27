package org.nexuxs.payment.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.InventoryReservedEvent;
import org.nexuxs.payment.service.PaymentService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class InventoryReservedEventConsumer {

    private final PaymentService paymentService;

    @KafkaListener(topics = NexusTopics.INVENTORY_RESERVED, groupId = "payment-service-group")
    public void onInventoryReserved(InventoryReservedEvent event) {
        log.info("Saga Orchestration: Inventory confirmed for OrderId: {}. Delegating to PaymentService...", event.orderId());

        paymentService.processPayment(event).subscribe(
                null,
                error -> log.error("Saga Error: Critical failure during payment processing for OrderId: {}", event.orderId(), error)
        );
    }
}