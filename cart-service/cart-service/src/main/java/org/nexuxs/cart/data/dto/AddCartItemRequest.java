package org.nexuxs.cart.data.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record AddCartItemRequest(
        @NotNull(message = "Product ID is required")
        Long productId,

        @NotBlank(message = "Product name is required")
        String productName,

        @Positive(message = "Quantity must be positive")
        int quantity,

        @NotNull(message = "Unit price is required")
        @DecimalMin(value = "0.01", message = "Unit price must be at least 0.01")
        BigDecimal unitPrice
) {
}
