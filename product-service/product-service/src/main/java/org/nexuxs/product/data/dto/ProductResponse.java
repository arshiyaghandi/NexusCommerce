package org.nexuxs.product.data.dto;

import java.math.BigDecimal;

public record ProductResponse(Long id, String skuCode, String name, String description, BigDecimal price) {
}
