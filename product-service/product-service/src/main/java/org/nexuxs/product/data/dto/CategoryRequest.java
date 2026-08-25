package org.nexuxs.product.data.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Category name is required")
        @Size(max = 255, message = "Category name must not exceed 255 characters")
        String name,

        String description,

        Long parentId          // null = root category
) {
}
