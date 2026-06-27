package org.nexuxs.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.event.InventoryReservedEvent;
import org.nexuxs.messaging.contracts.event.PaymentCompletedEvent;
import org.nexuxs.messaging.contracts.event.PaymentFailedEvent;
import org.nexuxs.payment.data.model.Payment;
import org.nexuxs.payment.data.model.PaymentStatus;
import org.nexuxs.payment.data.repository.PaymentRepository;
import org.nexuxs.payment.messaging.PaymentEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ObjectProvider<PaymentEventPublisher> publisherProvider;

    public Mono<Void> processPayment(InventoryReservedEvent event) {
        log.info("Saga Execution: Processing payment for Order: {}, User: {}, Amount: {}",
                event.orderId(), event.userId(), event.totalPrice());

        boolean hasSufficientFunds = true;

        if (hasSufficientFunds) {
            Payment payment = Payment.builder()
                    .orderId(event.orderId())
                    .userId(event.userId())
                    .amount(event.totalPrice())
                    .status(PaymentStatus.COMPLETED)
                    .build();

            return paymentRepository.save(payment)
                    .flatMap(this::publishSuccess)
                    .then();
        } else {
            log.warn("Payment failed for Order: {}. Insufficient funds.", event.orderId());
            return publishFailure(event, "INSUFFICIENT_FUNDS");
        }
    }

    private Mono<Void> publishSuccess(Payment payment) {
        PaymentEventPublisher publisher = publisherProvider.getIfAvailable();
        if (publisher == null) return Mono.empty();

        PaymentCompletedEvent completedEvent = new PaymentCompletedEvent(
                payment.getId(),
                payment.getOrderId(),
                payment.getUserId(),
                payment.getAmount(),
                payment.getStatus().name(),
                Instant.now()
        );
        return publisher.publishSuccessEvent(completedEvent);
    }

    private Mono<Void> publishFailure(InventoryReservedEvent event, String reason) {
        PaymentEventPublisher publisher = publisherProvider.getIfAvailable();
        if (publisher == null) return Mono.empty();

        Long productId = Long.parseLong(event.skuCode().replace("SKU", ""));

        PaymentFailedEvent failedEvent = new PaymentFailedEvent(
                event.orderId(),
                productId,
                event.reservedQuantity(),
                reason,
                Instant.now()
        );
        return publisher.publishFailedEvent(failedEvent);
    }
}