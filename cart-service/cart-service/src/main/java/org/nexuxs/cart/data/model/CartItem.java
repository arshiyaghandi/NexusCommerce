package org.nexuxs.cart.data.model;

import java.math.BigDecimal;

public record CartItem(
        Long productId,
        String productName,
        int quantity,
        BigDecimal unitPrice
) {
}
