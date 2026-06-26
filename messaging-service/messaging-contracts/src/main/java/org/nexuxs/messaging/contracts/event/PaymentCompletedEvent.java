package org.nexuxs.messaging.contracts.event;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentCompletedEvent(
        Long paymentId,
        Long orderId,
        String userId,
        BigDecimal amount,
        String status,
        Instant completedAt
) {
}
