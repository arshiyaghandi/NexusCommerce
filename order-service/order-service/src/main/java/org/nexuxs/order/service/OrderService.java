package org.nexuxs.order.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.order.client.CartClient;
import org.nexuxs.order.client.ProductClient;
import org.nexuxs.order.data.dto.CartItemDto;
import org.nexuxs.order.data.dto.OrderLineResponse;
import org.nexuxs.order.data.dto.OrderResponse;
import org.nexuxs.order.data.model.Order;
import org.nexuxs.order.data.model.OrderLine;
import org.nexuxs.order.data.model.OrderStatus;
import org.nexuxs.order.data.repository.OrderLineRepository;
import org.nexuxs.order.data.repository.OrderRepository;
import org.nexuxs.order.messaging.OrderEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderLineRepository orderLineRepository;
    private final CartClient cartClient;
    private final ProductClient productClient;
    private final ObjectProvider<OrderEventPublisher> orderEventPublisherProvider;

    public Flux<OrderResponse> myOrders() {
        return currentUserId()
                .flatMapMany(userId -> orderRepository.findByUserId(userId)
                        .flatMap(order -> loadOrderLines(order)
                                .map(lines -> toResponse(order, lines))));
    }

    public Mono<OrderResponse> getOrder(Long orderId) {
        return currentUserId()
                .flatMap(userId -> orderRepository.findById(orderId)
                        .filter(order -> userId.equals(order.getUserId()))
                        .flatMap(order -> loadOrderLines(order)
                                .map(lines -> toResponse(order, lines)))
                        .switchIfEmpty(Mono.error(new IllegalStateException("Order not found"))));
    }

    /**
     * Checkout flow: reads the authenticated user's cart, validates prices against
     * product-service (source-of-truth), persists Order + OrderLines, publishes
     * {@code OrderCreatedEvent} to kick off the Saga, and clears the cart.
     */
    public Mono<String> placeOrder() {
        return currentUserId()
                .flatMap(userId -> cartClient.getCart()
                        .flatMap(cartItems -> {
                            if (cartItems.isEmpty()) {
                                return Mono.error(new IllegalStateException("Cart is empty"));
                            }
                            return validateAndBuildOrder(userId, cartItems);
                        })
                        .flatMap(savedOrder -> {
                            OrderEventPublisher publisher = orderEventPublisherProvider.getIfAvailable();
                            Mono<Void> published = publisher != null
                                    ? publisher.publish(savedOrder) : Mono.empty();
                            return published.thenReturn(
                                    "Order placed successfully with Order Id: " + savedOrder.getId());
                        })
                        .flatMap(message -> cartClient.clearCart().thenReturn(message)));
    }

    private Mono<Order> validateAndBuildOrder(String userId, List<CartItemDto> cartItems) {
        // Validate each product exists and compute server-side total
        return Flux.fromIterable(cartItems)
                .flatMap(cartItem -> productClient.getProduct(cartItem.productId())
                        .map(product -> {
                            log.info("Price check: cart productId={} cartPrice={}, serverPrice={}",
                                    cartItem.productId(), cartItem.unitPrice(), product.price());
                            return new ValidatedItem(
                                    cartItem.productId(),
                                    cartItem.quantity(),
                                    product.price());
                        }))
                .collectList()
                .flatMap(validatedItems -> {
                    BigDecimal totalPrice = validatedItems.stream()
                            .map(vi -> vi.unitPrice().multiply(BigDecimal.valueOf(vi.quantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Order order = Order.builder()
                            .userId(userId)
                            .totalPrice(totalPrice)
                            .status(OrderStatus.PENDING)
                            .build();

                    return orderRepository.save(order)
                            .flatMap(savedOrder -> saveOrderLines(savedOrder.getId(), validatedItems)
                                    .then()
                                    .thenReturn(savedOrder));
                });
    }

    private Flux<OrderLine> saveOrderLines(Long orderId, List<ValidatedItem> items) {
        return Flux.fromIterable(items)
                .map(vi -> OrderLine.builder()
                        .orderId(orderId)
                        .productId(vi.productId())
                        .quantity(vi.quantity())
                        .unitPrice(vi.unitPrice())
                        .build())
                .flatMap(orderLineRepository::save);
    }

    private Mono<List<OrderLineResponse>> loadOrderLines(Order order) {
        return orderLineRepository.findByOrderId(order.getId())
                .map(line -> new OrderLineResponse(line.getProductId(), line.getQuantity(), line.getUnitPrice()))
                .collectList();
    }

    /**
     * Saga: applies the outcome of the payment step. Success completes the order,
     * failure cancels it (the reserved stock is compensated independently by
     * inventory-service reacting to the same {@code payment.failed} event).
     */
    public Mono<Order> applyPaymentOutcome(Long orderId, boolean paymentSucceeded) {
        return transitionTo(orderId, paymentSucceeded ? OrderStatus.COMPLETED : OrderStatus.CANCELLED);
    }

    /**
     * Saga: rejects an order whose inventory reservation failed. No stock was ever
     * decremented, so there is nothing to compensate — the order simply never qualified.
     */
    public Mono<Order> applyInventoryFailure(Long orderId) {
        return transitionTo(orderId, OrderStatus.REJECTED);
    }

    /**
     * Idempotent terminal-state transition. Orders that already reached a terminal
     * status are left untouched, so redelivered Saga events (Kafka at-least-once) are
     * safe no-ops.
     */
    private Mono<Order> transitionTo(Long orderId, OrderStatus target) {
        return orderRepository.findById(orderId)
                .switchIfEmpty(Mono.error(new IllegalStateException(
                        "Cannot transition order: not found, orderId=" + orderId)))
                .flatMap(order -> {
                    if (isTerminal(order.getStatus())) {
                        log.info("Skipping transition to {} for orderId={}, already terminal status={}",
                                target, orderId, order.getStatus());
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

    private OrderResponse toResponse(Order order, List<OrderLineResponse> lines) {
        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getTotalPrice(),
                order.getStatus(),
                order.getCreatedAt(),
                lines
        );
    }

    private record ValidatedItem(Long productId, int quantity, BigDecimal unitPrice) {
    }
}
