package org.nexuxs.product.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.product.data.dto.CategoryRequest;
import org.nexuxs.product.data.dto.CategoryResponse;
import org.nexuxs.product.data.model.Category;
import org.nexuxs.product.data.repository.CategoryRepository;
import org.nexuxs.product.data.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    /**
     * Returns all root categories, each populated with their direct children.
     */
    public Flux<CategoryResponse> findAll() {
        return categoryRepository.findByParentIdIsNull()
                .flatMap(root ->
                        categoryRepository.findByParentId(root.getId())
                                .map(child -> toResponse(child, List.of()))
                                .collectList()
                                .map(children -> toResponse(root, children))
                );
    }

    /**
     * Returns a single category by ID (without children list).
     */
    public Mono<CategoryResponse> findById(Long id) {
        return categoryRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Category not found: " + id)))
                .flatMap(cat ->
                        categoryRepository.findByParentId(cat.getId())
                                .map(child -> toResponse(child, List.of()))
                                .collectList()
                                .map(children -> toResponse(cat, children))
                );
    }

    public Mono<CategoryResponse> createCategory(CategoryRequest request) {
        return validateParent(request.parentId())
                .then(Mono.defer(() -> {
                    Category category = Category.builder()
                            .name(request.name())
                            .description(request.description())
                            .parentId(request.parentId())
                            .build();
                    return categoryRepository.save(category);
                }))
                .map(cat -> toResponse(cat, List.of()));
    }

    public Mono<CategoryResponse> updateCategory(Long id, CategoryRequest request) {
        return categoryRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Category not found: " + id)))
                .flatMap(cat -> validateParent(request.parentId()).thenReturn(cat))
                .flatMap(cat -> {
                    cat.setName(request.name());
                    cat.setDescription(request.description());
                    cat.setParentId(request.parentId());
                    return categoryRepository.save(cat);
                })
                .map(cat -> toResponse(cat, List.of()));
    }

    public Mono<Void> deleteCategory(Long id) {
        return categoryRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Category not found: " + id)))
                .flatMap(cat ->
                        productRepository.countByCategoryId(id)
                                .flatMap(count -> {
                                    if (count > 0) {
                                        return Mono.error(new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Cannot delete category: " + count + " product(s) are still assigned to it."));
                                    }
                                    // also prevent delete if it has children
                                    return categoryRepository.findByParentId(id).count();
                                })
                                .flatMap(childCount -> {
                                    if (childCount > 0) {
                                        return Mono.error(new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Cannot delete category: it has " + childCount + " subcategory(ies)."));
                                    }
                                    return categoryRepository.delete(cat);
                                })
                );
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Mono<Void> validateParent(Long parentId) {
        if (parentId == null) return Mono.empty();
        return categoryRepository.findById(parentId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Parent category not found: " + parentId)))
                .then();
    }

    private CategoryResponse toResponse(Category cat, List<CategoryResponse> children) {
        return new CategoryResponse(
                cat.getId(),
                cat.getName(),
                cat.getDescription(),
                cat.getParentId(),
                children
        );
    }
}
