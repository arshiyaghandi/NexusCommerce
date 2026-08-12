package org.nexuxs.product.data.repository;

import org.nexuxs.product.data.model.Category;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface CategoryRepository extends ReactiveCrudRepository<Category, Long> {

    /** Returns all root-level categories (those without a parent). */
    Flux<Category> findByParentIdIsNull();

    /** Returns direct children of the given parent category. */
    Flux<Category> findByParentId(Long parentId);
}
