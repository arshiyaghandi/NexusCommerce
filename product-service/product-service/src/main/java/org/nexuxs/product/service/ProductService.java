package org.nexuxs.product.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.product.data.dto.ProductRequest;
import org.nexuxs.product.data.dto.ProductResponse;
import org.nexuxs.product.data.model.Product;
import org.nexuxs.product.data.repository.CategoryRepository;
import org.nexuxs.product.data.repository.ProductRepository;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private static final String CACHE_KEY_PREFIX = "product:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ReactiveStringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public Flux<ProductResponse> findAll(String search, Long categoryId) {
        Flux<Product> products;

        if (categoryId != null) {
            products = productRepository.findByCategoryId(categoryId);
        } else if (search != null && !search.isBlank()) {
            products = productRepository.findByNameContainingIgnoreCase(search);
        } else {
            products = productRepository.findAll();
        }

        return products.flatMap(this::toResponse);
    }

    public Mono<ProductResponse> findById(Long id) {
        String cacheKey = CACHE_KEY_PREFIX + id;
        return redisTemplate.opsForValue().get(cacheKey)
                .flatMap(json -> {
                    try {
                        return Mono.just(objectMapper.readValue(json, ProductResponse.class));
                    } catch (Exception e) {
                        return Mono.error(e);
                    }
                })
                .switchIfEmpty(productRepository.findById(id)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Product not found: " + id)))
                        .flatMap(this::toResponse)
                        .flatMap(response -> {
                            try {
                                String json = objectMapper.writeValueAsString(response);
                                return redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL)
                                        .thenReturn(response);
                            } catch (Exception e) {
                                return Mono.just(response);
                            }
                        }));
    }

    public Mono<ProductResponse> createProduct(ProductRequest request) {
        return validateCategory(request.categoryId())
                .then(Mono.defer(() -> {
                    Product product = Product.builder()
                            .skuCode(request.skuCode())
                            .name(request.name())
                            .description(request.description())
                            .price(request.price())
                            .categoryId(request.categoryId())
                            .build();
                    return productRepository.save(product);
                }))
                .flatMap(this::toResponse);
    }

    public Mono<ProductResponse> updateProduct(Long id, ProductRequest request) {
        return productRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found: " + id)))
                .flatMap(product -> validateCategory(request.categoryId()).thenReturn(product))
                .flatMap(product -> {
                    product.setSkuCode(request.skuCode());
                    product.setName(request.name());
                    product.setDescription(request.description());
                    product.setPrice(request.price());
                    product.setCategoryId(request.categoryId());
                    return productRepository.save(product);
                })
                .flatMap(this::toResponse)
                .flatMap(response -> invalidateCache(id).thenReturn(response));
    }

    public Mono<Void> deleteProduct(Long id) {
        return productRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found: " + id)))
                .flatMap(product -> productRepository.delete(product)
                        .then(invalidateCache(id)));
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Mono<Void> invalidateCache(Long id) {
        return redisTemplate.delete(CACHE_KEY_PREFIX + id).then();
    }

    private Mono<Void> validateCategory(Long categoryId) {
        if (categoryId == null) return Mono.empty();
        return categoryRepository.findById(categoryId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Category not found: " + categoryId)))
                .then();
    }

    /**
     * Enriches a product with its category name by doing a reactive lookup.
     */
    private Mono<ProductResponse> toResponse(Product product) {
        if (product.getCategoryId() == null) {
            return Mono.just(new ProductResponse(
                    product.getId(), product.getSkuCode(), product.getName(),
                    product.getDescription(), product.getPrice(), null, null));
        }
        return categoryRepository.findById(product.getCategoryId())
                .map(cat -> new ProductResponse(
                        product.getId(), product.getSkuCode(), product.getName(),
                        product.getDescription(), product.getPrice(),
                        cat.getId(), cat.getName()))
                .defaultIfEmpty(new ProductResponse(
                        product.getId(), product.getSkuCode(), product.getName(),
                        product.getDescription(), product.getPrice(),
                        product.getCategoryId(), null));
    }
}
