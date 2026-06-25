package org.nexuxs.cart.api;

import lombok.RequiredArgsConstructor;
import org.nexuxs.cart.data.dto.AddCartItemRequest;
import org.nexuxs.cart.data.model.CartItem;
import org.nexuxs.cart.service.CartService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartAPI {

    private final CartService cartService;

    @GetMapping
    public Mono<List<CartItem>> getCart() {
        return cartService.getCart();
    }

    @PostMapping("/items")
    public Mono<List<CartItem>> addItem(@RequestBody AddCartItemRequest request) {
        return cartService.addItem(request);
    }

    @DeleteMapping("/items/{productId}")
    public Mono<List<CartItem>> removeItem(@PathVariable Long productId) {
        return cartService.removeItem(productId);
    }

    @DeleteMapping
    public Mono<Void> clearCart() {
        return cartService.clearCart();
    }
}
