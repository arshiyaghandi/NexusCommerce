package org.nexuxs.messaging.contracts.event;

import java.time.Instant;

public record InventoryFailedEvent(
        Long orderId,
        String skuCode,
        String reason,
        Instant failedAt
) {
}
