package org.nexuxs.order.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.order.client.InventoryClient;
import org.nexuxs.order.data.dto.OrderRequest;
import org.nexuxs.order.data.dto.OrderResponse;
import org.nexuxs.order.data.model.Order;
import org.nexuxs.order.data.model.OrderStatus;
import org.nexuxs.order.data.repository.OrderRepository;
import org.nexuxs.order.messaging.OrderEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final ObjectProvider<OrderEventPublisher> orderEventPublisherProvider;

    public Flux<OrderResponse> myOrders() {
        return currentUserId()
                .flatMapMany(orderRepository::findByUserId)
                .map(this::toResponse);
    }

    public Mono<OrderResponse> getOrder(Long orderId) {
        return currentUserId()
                .flatMap(userId -> orderRepository.findById(orderId)
                        .filter(order -> userId.equals(order.getUserId()))
                        .map(this::toResponse)
                        .switchIfEmpty(Mono.error(new IllegalStateException("Order not found"))));
    }

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
                .status(OrderStatus.PENDING)
                .build();

        return orderRepository.save(order)
                .flatMap(savedOrder -> {
                    OrderEventPublisher publisher = orderEventPublisherProvider.getIfAvailable();
                    Mono<Void> published = publisher != null ? publisher.publish(savedOrder) : Mono.empty();
                    return published.thenReturn("Order placed successfully with Order Id: " + savedOrder.getId());
                });
    }

    /**
     * Saga step: drives an order to its terminal status in response to a payment outcome.
     * A successful payment completes the order; any other outcome cancels it. The transition
     * is idempotent — orders already in a terminal state are left untouched.
     */
    public Mono<Order> applyPaymentOutcome(Long orderId, boolean paymentSucceeded) {
        OrderStatus target = paymentSucceeded ? OrderStatus.COMPLETED : OrderStatus.CANCELLED;
        return orderRepository.findById(orderId)
                .switchIfEmpty(Mono.error(new IllegalStateException(
                        "Cannot apply payment outcome: order not found, orderId=" + orderId)))
                .flatMap(order -> {
                    if (isTerminal(order.getStatus())) {
                        log.info("Skipping payment outcome for orderId={}, already terminal status={}",
                                orderId, order.getStatus());
                        return Mono.just(order);
                    }
                    order.setStatus(target);
                    return orderRepository.save(order)
                            .doOnNext(saved -> log.info("Order {} transitioned to {}", orderId, target));
                });
    }

    private boolean isTerminal(OrderStatus status) {
        return status == OrderStatus.COMPLETED
                || status == OrderStatus.CANCELLED
                || status == OrderStatus.REJECTED;
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

    private OrderResponse toResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getProductId(),
                order.getQuantity(),
                order.getTotalPrice(),
                order.getStatus(),
                order.getCreatedAt()
        );
    }
}
