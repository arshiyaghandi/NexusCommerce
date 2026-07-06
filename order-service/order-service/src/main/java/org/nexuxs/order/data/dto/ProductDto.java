package org.nexuxs.order.data.dto;

import java.math.BigDecimal;

/**
 * Mirror of product-service's ProductResponse for deserialization via WebClient.
 */
public record ProductDto(
        Long id,
        String skuCode,
        String name,
        String description,
        BigDecimal price
) {
}
