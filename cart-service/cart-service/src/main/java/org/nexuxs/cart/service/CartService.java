package org.nexuxs.cart.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.nexuxs.cart.data.dto.AddCartItemRequest;
import org.nexuxs.cart.data.model.CartItem;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private static final String CART_KEY_PREFIX = "cart:";

    private final ReactiveStringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public Mono<List<CartItem>> getCart() {
        return currentUserId()
                .flatMap(this::loadCart);
    }

    public Mono<List<CartItem>> addItem(AddCartItemRequest request) {
        return currentUserId()
                .flatMap(userId -> loadCart(userId)
                        .flatMap(items -> {
                            List<CartItem> updated = mergeItem(items, request);
                            return saveCart(userId, updated).thenReturn(updated);
                        }));
    }

    public Mono<List<CartItem>> removeItem(Long productId) {
        return currentUserId()
                .flatMap(userId -> loadCart(userId)
                        .flatMap(items -> {
                            List<CartItem> updated = items.stream()
                                    .filter(item -> !item.productId().equals(productId))
                                    .toList();
                            return saveCart(userId, updated).thenReturn(updated);
                        }));
    }

    public Mono<Void> clearCart() {
        return currentUserId()
                .flatMap(userId -> redisTemplate.delete(cartKey(userId)).then());
    }

    private List<CartItem> mergeItem(List<CartItem> items, AddCartItemRequest request) {
        List<CartItem> updated = new ArrayList<>(items);
        for (int i = 0; i < updated.size(); i++) {
            CartItem existing = updated.get(i);
            if (existing.productId().equals(request.productId())) {
                updated.set(i, new CartItem(
                        request.productId(),
                        request.productName(),
                        existing.quantity() + request.quantity(),
                        request.unitPrice()
                ));
                return updated;
            }
        }
        updated.add(new CartItem(
                request.productId(),
                request.productName(),
                request.quantity(),
                request.unitPrice()
        ));
        return updated;
    }

    private Mono<List<CartItem>> loadCart(String userId) {
        return redisTemplate.opsForValue()
                .get(cartKey(userId))
                .flatMap(json -> {
                    try {
                        return Mono.just(objectMapper.readValue(json, new TypeReference<List<CartItem>>() {}));
                    } catch (Exception e) {
                        return Mono.error(new IllegalStateException("Failed to deserialize cart", e));
                    }
                })
                .defaultIfEmpty(List.of());
    }

    private Mono<Boolean> saveCart(String userId, List<CartItem> items) {
        try {
            String json = objectMapper.writeValueAsString(items);
            return redisTemplate.opsForValue().set(cartKey(userId), json);
        } catch (Exception e) {
            return Mono.error(new IllegalStateException("Failed to serialize cart", e));
        }
    }

    private String cartKey(String userId) {
        return CART_KEY_PREFIX + userId;
    }

    private Mono<String> currentUserId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> context.getAuthentication())
                .cast(JwtAuthenticationToken.class)
                .map(auth -> auth.getToken().getSubject())
                .switchIfEmpty(Mono.error(new IllegalStateException("Missing authentication for cart operation")));
    }
}
