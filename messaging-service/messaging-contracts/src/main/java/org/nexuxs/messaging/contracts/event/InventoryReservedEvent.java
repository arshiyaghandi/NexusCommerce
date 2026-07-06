package org.nexuxs.messaging.contracts.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;


public record InventoryReservedEvent(
        Long orderId,
        String userId,
        String skuCode,
        int quantity,
        int remainingQuantity,
        List<ReservedLineRecord> items,
        BigDecimal totalPrice,
        Instant reservedAt
) {
}
