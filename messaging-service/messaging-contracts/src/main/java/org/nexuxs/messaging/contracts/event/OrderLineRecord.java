package org.nexuxs.messaging.contracts.event;

import java.math.BigDecimal;

/**
 * A single line item within an order. Carried inside Saga events so downstream
 * services (inventory, payment) can iterate per-product operations.
 */
public record OrderLineRecord(
        Long productId,
        int quantity,
        BigDecimal unitPrice
) {
}
