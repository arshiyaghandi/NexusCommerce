package org.nexuxs.product.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.product.data.dto.ProductResponse;
import org.nexuxs.product.data.model.Product;
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
    private final ReactiveStringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

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
                        .map(this::toResponse)
                        .flatMap(response -> {
                            try {
                                String json = objectMapper.writeValueAsString(response);
                                return redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL)
                                        .thenReturn(response);
                            } catch (Exception e) {
                                return Mono.just(response);
                            }
                        }))
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
                .flatMap(response -> invalidateCache(id).thenReturn(response))
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found: " + id)));
    }

    public Mono<Void> deleteProduct(Long id) {
        return productRepository.findById(id)
                .flatMap(product -> productRepository.delete(product)
                        .then(invalidateCache(id)))
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found: " + id)));
    }

    private Mono<Void> invalidateCache(Long id) {
        return redisTemplate.delete(CACHE_KEY_PREFIX + id).then();
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
