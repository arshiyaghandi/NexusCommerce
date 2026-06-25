package org.nexuxs.finance.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.finance.service.FinanceService;
import org.nexuxs.messaging.contracts.NexusTopics;
import org.nexuxs.messaging.contracts.event.PaymentCompletedEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class PaymentCompletedEventConsumer {

    private final FinanceService financeService;

    @KafkaListener(
            topics = NexusTopics.PAYMENT_COMPLETED,
            groupId = "finance-service",
            containerFactory = "paymentCompletedListenerFactory"
    )
    public void consume(PaymentCompletedEvent event) {
        log.info("[finance] payment.completed | paymentId={} orderId={} user={} amount={}",
                event.paymentId(), event.orderId(), event.userId(), event.amount());
        financeService.savePaymentTransaction(event);
    }
}
