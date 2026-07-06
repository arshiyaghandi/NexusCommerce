package org.nexuxs.order.data.dto;

import java.math.BigDecimal;

public record OrderLineResponse(
        Long productId,
        int quantity,
        BigDecimal unitPrice
) {
}
