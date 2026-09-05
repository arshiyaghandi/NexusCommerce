package org.nexuxs.product.data.dto;

import java.util.List;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        Long parentId,
        List<CategoryResponse> children   // populated only for root categories
) {}
