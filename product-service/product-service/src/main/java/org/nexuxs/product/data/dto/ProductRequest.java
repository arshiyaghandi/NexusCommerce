package org.nexuxs.product.data.dto;

import java.math.BigDecimal;

public record ProductRequest(
        String skuCode,
        String name,
        String description,
        BigDecimal price
) {}
