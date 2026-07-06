package org.nexuxs.messaging.contracts.event;

/**
 * A single reserved inventory line within an {@link InventoryReservedEvent}.
 * Carries the SKU code and remaining stock so downstream services and compensation
 * paths have per-product visibility.
 */
public record ReservedLineRecord(
        Long productId,
        String skuCode,
        int quantity,
        int remainingQuantity
) {
}
