package org.nexuxs.order.data.dto;

import java.math.BigDecimal;

/**
 * Mirror of cart-service's CartItem for deserialization via WebClient.
 */
public record CartItemDto(
        Long productId,
        String productName,
        int quantity,
        BigDecimal unitPrice
) {
}
