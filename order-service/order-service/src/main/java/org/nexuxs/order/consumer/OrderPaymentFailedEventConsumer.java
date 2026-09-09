package org.nexuxs.order.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.PaymentFailedEvent;
import org.nexuxs.order.service.OrderService;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import reactor.core.scheduler.Schedulers;

/**
 * Saga compensation listener: a payment failure cancels the order. The stock reserved
 * earlier is released independently by inventory-service, which consumes the same
 * {@code payment.failed} event.
 *
 * <p>The reactive chain is subscribed on {@code boundedElastic} to avoid blocking
 * Kafka's listener thread — never call {@code block()} inside a {@code @KafkaListener}.
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
                .subscribeOn(Schedulers.boundedElastic())
                .doOnNext(order -> log.info("[order] saga applied | orderId={} -> {}", order.getId(), order.getStatus()))
                .doOnError(e -> log.error("[order] failed to cancel order for orderId={}", event.orderId(), e))
                .subscribe();
    }
}
