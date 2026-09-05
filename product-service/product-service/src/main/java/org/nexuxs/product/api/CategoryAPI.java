package org.nexuxs.product.api;

import lombok.RequiredArgsConstructor;
import org.nexuxs.product.data.dto.CategoryRequest;
import org.nexuxs.product.data.dto.CategoryResponse;
import org.nexuxs.product.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryAPI {

    private final CategoryService categoryService;

    /** Public: list all categories in tree form. */
    @GetMapping
    public Flux<CategoryResponse> findAll() {
        return categoryService.findAll();
    }

    /** Public: get a single category with its children. */
    @GetMapping("/{id}")
    public Mono<CategoryResponse> findById(@PathVariable Long id) {
        return categoryService.findById(id);
    }

    /** ADMIN: create a new category. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return categoryService.createCategory(request);
    }

    /** ADMIN: update an existing category. */
    @PutMapping("/{id}")
    public Mono<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        return categoryService.updateCategory(id, request);
    }

    /** ADMIN: delete a category (fails if products or subcategories exist). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteCategory(@PathVariable Long id) {
        return categoryService.deleteCategory(id);
    }
}
