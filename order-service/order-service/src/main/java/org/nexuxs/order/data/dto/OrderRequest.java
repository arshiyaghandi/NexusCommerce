package org.nexuxs.order.data.dto;

import java.math.BigDecimal;

public record OrderRequest(Long productId, Integer quantity, BigDecimal price) {}