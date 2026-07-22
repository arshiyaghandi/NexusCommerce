package org.nexuxs.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.event.InventoryReservedEvent;
import org.nexuxs.messaging.contracts.event.OrderLineRecord;
import org.nexuxs.messaging.contracts.event.PaymentCompletedEvent;
import org.nexuxs.messaging.contracts.event.PaymentFailedEvent;
import org.nexuxs.payment.data.model.Payment;
import org.nexuxs.payment.data.model.PaymentStatus;
import org.nexuxs.payment.data.repository.PaymentRepository;
import org.nexuxs.payment.messaging.PaymentEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ObjectProvider<PaymentEventPublisher> publisherProvider;

    /**
     * Authorization threshold: a payment whose amount is strictly greater than this is
     * declined. Defaults high so normal orders succeed; lower it (config) to exercise the
     * payment-failure Saga branch end-to-end. A real funds/balance check would replace this.
     */
    @Value("${nexus.payment.decline-above:100000}")
    private BigDecimal declineAbove;

    public Mono<Void> processPayment(InventoryReservedEvent event) {
        log.info("Saga Execution: Processing payment for Order: {}, User: {}, Amount: {}",
                event.orderId(), event.userId(), event.totalPrice());

        boolean hasSufficientFunds = event.totalPrice() != null
                && event.totalPrice().compareTo(declineAbove) <= 0;

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

        List<OrderLineRecord> items = event.items() != null
                ? event.items().stream()
                    .map(rl -> new OrderLineRecord(rl.productId(), rl.quantity(), null))
                    .toList()
                : List.of();

        PaymentFailedEvent failedEvent = new PaymentFailedEvent(
                event.orderId(),
                items.isEmpty() ? null : items.get(0).productId(),
                event.quantity(),
                items,
                reason,
                Instant.now()
        );
        return publisher.publishFailedEvent(failedEvent);
    }
}
