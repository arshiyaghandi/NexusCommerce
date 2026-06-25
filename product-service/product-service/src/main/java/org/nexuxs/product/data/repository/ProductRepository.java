package org.nexuxs.product.data.repository;

import org.nexuxs.product.data.model.Product;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface ProductRepository extends ReactiveCrudRepository<Product, Long> {
}
