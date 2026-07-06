package org.nexuxs.messaging.contracts.event;

import java.time.Instant;
import java.util.List;

public record PaymentFailedEvent(
        Long orderId,
        Long productId,
        int quantity,
        List<OrderLineRecord> items,
        String reason,
        Instant failedAt
) {
}
