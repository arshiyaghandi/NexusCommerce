package org.nexuxs.finance.data.dto;

import java.math.BigDecimal;

public record FinanceSummaryResponse(
        String userId,
        BigDecimal totalAmount,
        long transactionCount
) {
}
