package org.nexuxs.messaging.contracts.event;

import java.time.Instant;

public record InventoryReservedEvent(
        String skuCode,
        int reservedQuantity,
        int remainingQuantity,
        Instant reservedAt
) {
}
