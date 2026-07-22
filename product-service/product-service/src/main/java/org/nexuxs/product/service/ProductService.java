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

    public Flux<ProductResponse> findAll(String search) {
        Flux<Product> products;
        if (search != null && !search.isBlank()) {
            products = productRepository.findByNameContainingIgnoreCase(search);
        } else {
            products = productRepository.findAll();
        }
        return products.map(this::toResponse);
    }

    public Mono<ProductResponse> findById(Long id) {
        return productRepository.findById(id)
                .map(this::toResponse)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found: " + id)));
    }

    public Mono<ProductResponse> createProduct(org.nexuxs.product.data.dto.ProductRequest request) {
        Product product = Product.builder()
                .skuCode(request.skuCode())
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .build();
        return productRepository.save(product).map(this::toResponse);
    }

    public Mono<ProductResponse> updateProduct(Long id, org.nexuxs.product.data.dto.ProductRequest request) {
        return productRepository.findById(id)
                .flatMap(product -> {
                    product.setSkuCode(request.skuCode());
                    product.setName(request.name());
                    product.setDescription(request.description());
                    product.setPrice(request.price());
                    return productRepository.save(product);
                })
                .map(this::toResponse)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found: " + id)));
    }

    public Mono<Void> deleteProduct(Long id) {
        return productRepository.findById(id)
                .flatMap(productRepository::delete)
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
