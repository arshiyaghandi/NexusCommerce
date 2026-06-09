package org.nexuxs.messaging.contracts.event;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderCreatedEvent(
        Long orderId,
        String userId,
        Long productId,
        int quantity,
        BigDecimal totalPrice,
        String status,
        Instant createdAt
) {
}
