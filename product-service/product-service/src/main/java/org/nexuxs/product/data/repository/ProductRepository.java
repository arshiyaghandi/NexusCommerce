package org.nexuxs.product.data.repository;

import org.nexuxs.product.data.model.Product;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import reactor.core.publisher.Flux;

public interface ProductRepository extends ReactiveCrudRepository<Product, Long> {
    Flux<Product> findByNameContainingIgnoreCase(String name);
}
