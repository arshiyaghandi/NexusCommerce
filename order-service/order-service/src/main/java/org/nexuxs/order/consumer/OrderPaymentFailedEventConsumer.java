package org.nexuxs.order.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.PaymentFailedEvent;
import org.nexuxs.order.service.OrderService;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Saga compensation listener: a payment failure cancels the order. The stock reserved
 * earlier is released independently by inventory-service, which consumes the same
 * {@code payment.failed} event.
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class OrderPaymentFailedEventConsumer {

    private final OrderService orderService;

    @KafkaListener(
            topics = NexusTopics.PAYMENT_FAILED,
            groupId = "order-service",
            containerFactory = "paymentFailedListenerFactory"
    )
    public void consume(PaymentFailedEvent event) {
        log.info("[order] payment.failed | orderId={} productId={} quantity={} reason={}",
                event.orderId(), event.productId(), event.quantity(), event.reason());

        orderService.applyPaymentOutcome(event.orderId(), false)
                .subscribe(
                        order -> log.info("[order] saga applied | orderId={} -> {}",
                                order.getId(), order.getStatus()),
                        error -> log.error("[order] failed to cancel order for orderId={}",
                                event.orderId(), error)
                );
    }
}
