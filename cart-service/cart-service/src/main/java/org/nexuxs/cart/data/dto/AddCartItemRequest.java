package org.nexuxs.cart.data.dto;

import java.math.BigDecimal;

public record AddCartItemRequest(
        Long productId,
        String productName,
        int quantity,
        BigDecimal unitPrice
) {
}
