package org.nexuxs.order.service;

import lombok.RequiredArgsConstructor;
import org.nexuxs.order.client.InventoryClient;
import org.nexuxs.order.data.dto.OrderRequest;
import org.nexuxs.order.data.model.Order;
import org.nexuxs.order.data.model.OrderStatus;
import org.nexuxs.order.data.repository.OrderRepository;
import org.nexuxs.order.messaging.OrderEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final ObjectProvider<OrderEventPublisher> orderEventPublisherProvider;

    public Mono<String> placeOrder(OrderRequest orderRequest) {
        return currentUserId()
                .flatMap(userId -> inventoryClient.reserveStock(toSkuCode(orderRequest.productId()), orderRequest.quantity())
                        .then(saveOrder(userId, orderRequest)));
    }

    private Mono<String> saveOrder(String userId, OrderRequest orderRequest) {
        Order order = Order.builder()
                .userId(userId)
                .productId(orderRequest.productId())
                .quantity(orderRequest.quantity())
                .totalPrice(orderRequest.totalPrice())
                .status(OrderStatus.CONFIRMED)
                .build();

        return orderRepository.save(order)
                .flatMap(savedOrder -> {
                    OrderEventPublisher publisher = orderEventPublisherProvider.getIfAvailable();
                    Mono<Void> published = publisher != null ? publisher.publish(savedOrder) : Mono.empty();
                    return published.thenReturn("Order placed successfully with Order Id: " + savedOrder.getId());
                });
    }

    private Mono<String> currentUserId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> context.getAuthentication())
                .cast(JwtAuthenticationToken.class)
                .map(auth -> auth.getToken().getSubject())
                .switchIfEmpty(Mono.error(new IllegalStateException("Missing authentication for order placement")));
    }

    private String toSkuCode(Long productId) {
        return "SKU" + String.format("%03d", productId);
    }
}
