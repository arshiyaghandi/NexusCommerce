package org.nexuxs.order.data.dto;

import org.nexuxs.order.data.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String userId,
        BigDecimal totalPrice,
        OrderStatus status,
        LocalDateTime createdAt,
        List<OrderLineResponse> items
) {
}
