package org.nexuxs.messaging.contracts.event;

import java.math.BigDecimal;
import java.time.Instant;

public record InventoryReservedEvent(
        Long orderId,
        String userId,
        String skuCode,
        int reservedQuantity,
        int remainingQuantity,
        BigDecimal totalPrice,
        Instant reservedAt
) {
}
