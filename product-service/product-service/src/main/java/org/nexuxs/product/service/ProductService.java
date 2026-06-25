package org.nexuxs.product.service;

import lombok.RequiredArgsConstructor;
import org.nexuxs.product.data.dto.ProductResponse;
import org.nexuxs.product.data.model.Product;
import org.nexuxs.product.data.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public Flux<ProductResponse> findAll() {
        return productRepository.findAll()
                .map(this::toResponse);
    }

    public Mono<ProductResponse> findById(Long id) {
        return productRepository.findById(id)
                .map(this::toResponse)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found: " + id)));
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getSkuCode(),
                product.getName(),
                product.getDescription(),
                product.getPrice()
        );
    }
}
