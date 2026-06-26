package org.nexuxs.product.api;

import lombok.RequiredArgsConstructor;
import org.nexuxs.product.data.dto.ProductResponse;
import org.nexuxs.product.service.ProductService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductAPI {

    private final ProductService productService;

    @GetMapping
    public Flux<ProductResponse> findAll() {
        return productService.findAll();
    }

    @GetMapping("/{id}")
    public Mono<ProductResponse> findById(@PathVariable Long id) {
        return productService.findById(id);
    }
}
