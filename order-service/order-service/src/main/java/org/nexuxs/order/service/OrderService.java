package org.nexuxs.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.nexuxs.order.exception.AuthenticationMissingException;
import org.nexuxs.order.exception.EmptyCartException;
import org.nexuxs.order.exception.KafkaUnavailableException;
import org.nexuxs.order.exception.OrderNotFoundException;
import org.nexuxs.order.messaging.OrderEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private static final String CACHE_KEY_PREFIX = "order:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(2);

    private final OrderRepository orderRepository;
    private final OrderLineRepository orderLineRepository;
    private final CartClient cartClient;
    private final ProductClient productClient;
    private final ObjectProvider<OrderEventPublisher> orderEventPublisherProvider;
    private final ReactiveStringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public Flux<OrderResponse> myOrders() {
        return currentUserId()
                .flatMapMany(userId -> orderRepository.findByUserId(userId)
                        .flatMap(order -> loadOrderLines(order)
                                .map(lines -> toResponse(order, lines))));
    }

    public Flux<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .flatMap(order -> loadOrderLines(order)
                        .map(lines -> toResponse(order, lines)));
    }

    public Mono<OrderResponse> getOrder(Long orderId) {
        String cacheKey = CACHE_KEY_PREFIX + orderId;
        return currentUserId()
                .flatMap(userId -> redisTemplate.opsForValue().get(cacheKey)
                        .flatMap(json -> deserializeOrder(json, orderId)
                                .filter(cached -> userId.equals(cached.userId())))
                        .switchIfEmpty(orderRepository.findById(orderId)
                                .filter(order -> userId.equals(order.getUserId()))
                                .flatMap(order -> loadOrderLines(order)
                                        .map(lines -> toResponse(order, lines)))
                                .flatMap(response -> serializeToCache(cacheKey, response)
                                        .thenReturn(response)))
                        .switchIfEmpty(Mono.error(new OrderNotFoundException(orderId))));
    }

    /**
     * Checkout flow: reads the authenticated user's cart, validates prices against
     * product-service (source-of-truth), persists Order + OrderLines, publishes
     * {@code OrderCreatedEvent} to kick off the Saga, and clears the cart.
     *
     * <p>Note: cart is cleared <em>after</em> the event is published. If cart.clear()
     * fails, the saga still proceeds — this is an acceptable UX trade-off until an
     * Outbox Pattern is implemented.
     */
    public Mono<String> placeOrder() {
        return currentUserId()
                .flatMap(userId -> cartClient.getCart()
                        .flatMap(cartItems -> {
                            if (cartItems.isEmpty()) {
                                return Mono.error(new EmptyCartException());
                            }
                            return validateAndBuildOrder(userId, cartItems);
                        })
                        .flatMap(savedOrder -> {
                            OrderEventPublisher publisher = orderEventPublisherProvider.getIfAvailable();
                            if (publisher == null) {
                                return Mono.error(new KafkaUnavailableException());
                            }
                            return publisher.publish(savedOrder)
                                    .thenReturn("Order placed successfully with Order Id: " + savedOrder.getId());
                        })
                        .flatMap(message -> cartClient.clearCart().thenReturn(message)));
    }

    private Mono<Order> validateAndBuildOrder(String userId, List<CartItemDto> cartItems) {
        return Flux.fromIterable(cartItems)
                .concatMap(cartItem -> productClient.getProduct(cartItem.productId())
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

    public Mono<Order> applyPaymentOutcome(Long orderId, boolean paymentSucceeded) {
        return transitionTo(orderId, paymentSucceeded ? OrderStatus.COMPLETED : OrderStatus.CANCELLED);
    }

    public Mono<Order> applyInventoryFailure(Long orderId) {
        return transitionTo(orderId, OrderStatus.REJECTED);
    }

    private Mono<Order> transitionTo(Long orderId, OrderStatus target) {
        return orderRepository.findById(orderId)
                .switchIfEmpty(Mono.error(new OrderNotFoundException(orderId)))
                .flatMap(order -> {
                    if (isTerminal(order.getStatus())) {
                        log.info("Skipping transition to {} for orderId={}, already terminal status={}",
                                target, orderId, order.getStatus());
                        return Mono.just(order);
                    }
                    order.setStatus(target);
                    return orderRepository.save(order)
                            .doOnNext(saved -> log.info("Order {} transitioned to {}", orderId, target));
                })
                .flatMap(saved -> redisTemplate.delete(CACHE_KEY_PREFIX + orderId).thenReturn(saved));
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
                .switchIfEmpty(Mono.error(new AuthenticationMissingException()));
    }

    // ── Reactive helpers ──────────────────────────────────────────────────────

    /**
     * Deserializes a cached JSON string into an {@link OrderResponse}.
     * Returns {@link Mono#empty()} on any deserialization error (cache miss semantics).
     */
    private Mono<OrderResponse> deserializeOrder(String json, Long orderId) {
        return Mono.fromCallable(() -> objectMapper.readValue(json, OrderResponse.class))
                .onErrorResume(e -> {
                    log.warn("Failed to deserialize order from cache for orderId={}", orderId, e);
                    return Mono.empty();
                });
    }

    /**
     * Serializes an {@link OrderResponse} and writes it to Redis.
     * Swallows serialization errors so a cache write failure never disrupts the response.
     */
    private Mono<Boolean> serializeToCache(String cacheKey, OrderResponse response) {
        return Mono.fromCallable(() -> objectMapper.writeValueAsString(response))
                .flatMap(json -> redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL))
                .onErrorResume(e -> {
                    log.warn("Failed to serialize order to cache for key={}", cacheKey, e);
                    return Mono.just(Boolean.FALSE);
                });
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
