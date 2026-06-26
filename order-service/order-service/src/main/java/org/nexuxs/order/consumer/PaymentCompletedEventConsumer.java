package org.nexuxs.order.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.PaymentCompletedEvent;
import org.nexuxs.order.service.OrderService;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Saga listener: closes the order lifecycle by reacting to payment outcomes.
 * A {@code COMPLETED} payment completes the order; anything else cancels it.
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class PaymentCompletedEventConsumer {

    private static final String PAYMENT_SUCCESS_STATUS = "COMPLETED";

    private final OrderService orderService;

    @KafkaListener(
            topics = NexusTopics.PAYMENT_COMPLETED,
            groupId = "order-service",
            containerFactory = "paymentCompletedListenerFactory"
    )
    public void consume(PaymentCompletedEvent event) {
        boolean paymentSucceeded = PAYMENT_SUCCESS_STATUS.equalsIgnoreCase(event.status());
        log.info("[order] payment.completed | orderId={} paymentId={} status={} succeeded={}",
                event.orderId(), event.paymentId(), event.status(), paymentSucceeded);

        orderService.applyPaymentOutcome(event.orderId(), paymentSucceeded)
                .subscribe(
                        order -> log.info("[order] saga applied | orderId={} -> {}",
                                order.getId(), order.getStatus()),
                        error -> log.error("[order] failed to apply payment outcome for orderId={}",
                                event.orderId(), error)
                );
    }
}
