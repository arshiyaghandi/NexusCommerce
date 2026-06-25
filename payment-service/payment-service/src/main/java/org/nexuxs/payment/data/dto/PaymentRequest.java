package org.nexuxs.payment.data.dto;

import java.math.BigDecimal;

public record PaymentRequest(
        Long orderId,
        BigDecimal amount
) {
}
