package org.nexuxs.order.data.dto;

import org.nexuxs.order.data.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderResponse(
        Long id,
        String userId,
        Long productId,
        Integer quantity,
        BigDecimal totalPrice,
        OrderStatus status,
        LocalDateTime createdAt
) {
}
