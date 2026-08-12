package org.nexuxs.product.data.dto;

public record CategoryRequest(
        String name,
        String description,
        Long parentId          // null = root category
) {}
