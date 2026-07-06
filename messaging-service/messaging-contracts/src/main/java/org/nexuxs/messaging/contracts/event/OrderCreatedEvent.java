package org.nexuxs.messaging.contracts.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderCreatedEvent(
        Long orderId,
        String userId,
        Long productId,
        int quantity,
        List<OrderLineRecord> items,
        BigDecimal totalPrice,
        String status,
        Instant createdAt
) {
}
