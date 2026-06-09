package org.nexuxs.messaging.contracts.event;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderCreatedEvent(
        String orderNumber,
        String skuCode,
        BigDecimal price,
        int quantity,
        Instant createdAt
) {
}
