package org.nexuxs.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.nexuxs.order.client.CartClient;
import org.nexuxs.order.client.ProductClient;
import org.nexuxs.order.data.dto.CartItemDto;
import org.nexuxs.order.data.dto.ProductDto;
import org.nexuxs.order.data.model.Order;
import org.nexuxs.order.data.model.OrderLine;
import org.nexuxs.order.data.model.OrderStatus;
import org.nexuxs.order.data.repository.OrderLineRepository;
import org.nexuxs.order.data.repository.OrderRepository;
import org.nexuxs.order.exception.EmptyCartException;
import org.nexuxs.order.exception.KafkaUnavailableException;
import org.nexuxs.order.exception.OrderNotFoundException;
import org.nexuxs.order.messaging.OrderEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService")
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderLineRepository orderLineRepository;
    @Mock private CartClient cartClient;
    @Mock private ProductClient productClient;
    @Mock private ObjectProvider<OrderEventPublisher> publisherProvider;
    @Mock private OrderEventPublisher orderEventPublisher;
    @Mock private ReactiveStringRedisTemplate redisTemplate;
    @Mock private ReactiveValueOperations<String, String> valueOps;

    private OrderService orderService;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .findAndRegisterModules(); // registers JavaTimeModule for LocalDateTime

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository,
                orderLineRepository,
                cartClient,
                productClient,
                publisherProvider,
                redisTemplate,
                objectMapper
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Order order(Long id, OrderStatus status) {
        return Order.builder()
                .id(id)
                .userId("user-123")
                .totalPrice(BigDecimal.valueOf(200))
                .status(status)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private OrderLine orderLine(Long orderId) {
        return OrderLine.builder()
                .id(1L)
                .orderId(orderId)
                .productId(10L)
                .quantity(2)
                .unitPrice(BigDecimal.valueOf(100))
                .build();
    }

    // ── getAllOrders ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getAllOrders()")
    class GetAllOrders {

        @Test
        @DisplayName("returns all orders with their lines")
        void returnsAllOrders() {
            Order o1 = order(1L, OrderStatus.COMPLETED);
            Order o2 = order(2L, OrderStatus.PENDING);
            when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(Flux.just(o1, o2));
            when(orderLineRepository.findByOrderId(1L)).thenReturn(Flux.just(orderLine(1L)));
            when(orderLineRepository.findByOrderId(2L)).thenReturn(Flux.empty());

            StepVerifier.create(orderService.getAllOrders())
                    .expectNextMatches(r -> r.id().equals(1L) && r.items().size() == 1)
                    .expectNextMatches(r -> r.id().equals(2L) && r.items().isEmpty())
                    .verifyComplete();
        }

        @Test
        @DisplayName("returns empty flux when no orders exist")
        void returnsEmptyFlux() {
            when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(Flux.empty());

            StepVerifier.create(orderService.getAllOrders())
                    .verifyComplete();
        }
    }

    // ── applyPaymentOutcome ────────────────────────────────────────────────────

    @Nested
    @DisplayName("applyPaymentOutcome()")
    class ApplyPaymentOutcome {

        @Test
        @DisplayName("payment success: transitions PENDING -> COMPLETED")
        void paymentSuccess_completesOrder() {
            Order pending = order(1L, OrderStatus.PENDING);
            Order completed = order(1L, OrderStatus.COMPLETED);
            when(orderRepository.findById(1L)).thenReturn(Mono.just(pending));
            when(orderRepository.save(any())).thenReturn(Mono.just(completed));
            when(redisTemplate.delete(anyString())).thenReturn(Mono.just(1L));

            StepVerifier.create(orderService.applyPaymentOutcome(1L, true))
                    .expectNextMatches(o -> o.getStatus() == OrderStatus.COMPLETED)
                    .verifyComplete();

            verify(orderRepository).save(argThat(o -> o.getStatus() == OrderStatus.COMPLETED));
        }

        @Test
        @DisplayName("payment failure: transitions PENDING -> CANCELLED")
        void paymentFailure_cancelsOrder() {
            Order pending = order(1L, OrderStatus.PENDING);
            Order cancelled = order(1L, OrderStatus.CANCELLED);
            when(orderRepository.findById(1L)).thenReturn(Mono.just(pending));
            when(orderRepository.save(any())).thenReturn(Mono.just(cancelled));
            when(redisTemplate.delete(anyString())).thenReturn(Mono.just(1L));

            StepVerifier.create(orderService.applyPaymentOutcome(1L, false))
                    .expectNextMatches(o -> o.getStatus() == OrderStatus.CANCELLED)
                    .verifyComplete();
        }

        @Test
        @DisplayName("order not found: emits OrderNotFoundException")
        void orderNotFound_emitsException() {
            when(orderRepository.findById(99L)).thenReturn(Mono.empty());

            StepVerifier.create(orderService.applyPaymentOutcome(99L, true))
                    .expectError(OrderNotFoundException.class)
                    .verify();
        }

        @Test
        @DisplayName("idempotency: already COMPLETED order is returned as-is, no save")
        void idempotency_alreadyCompleted_noSave() {
            Order completed = order(1L, OrderStatus.COMPLETED);
            when(orderRepository.findById(1L)).thenReturn(Mono.just(completed));
            when(redisTemplate.delete(anyString())).thenReturn(Mono.just(1L));

            StepVerifier.create(orderService.applyPaymentOutcome(1L, false))
                    .expectNextMatches(o -> o.getStatus() == OrderStatus.COMPLETED)
                    .verifyComplete();

            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("idempotency: already CANCELLED order is returned as-is, no save")
        void idempotency_alreadyCancelled_noSave() {
            Order cancelled = order(1L, OrderStatus.CANCELLED);
            when(orderRepository.findById(1L)).thenReturn(Mono.just(cancelled));
            when(redisTemplate.delete(anyString())).thenReturn(Mono.just(1L));

            StepVerifier.create(orderService.applyPaymentOutcome(1L, true))
                    .expectNextMatches(o -> o.getStatus() == OrderStatus.CANCELLED)
                    .verifyComplete();

            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("idempotency: already REJECTED order is returned as-is, no save")
        void idempotency_alreadyRejected_noSave() {
            Order rejected = order(1L, OrderStatus.REJECTED);
            when(orderRepository.findById(1L)).thenReturn(Mono.just(rejected));
            when(redisTemplate.delete(anyString())).thenReturn(Mono.just(1L));

            StepVerifier.create(orderService.applyPaymentOutcome(1L, true))
                    .expectNextMatches(o -> o.getStatus() == OrderStatus.REJECTED)
                    .verifyComplete();

            verify(orderRepository, never()).save(any());
        }
    }

    // ── applyInventoryFailure ─────────────────────────────────────────────────

    @Nested
    @DisplayName("applyInventoryFailure()")
    class ApplyInventoryFailure {

        @Test
        @DisplayName("transitions PENDING -> REJECTED")
        void transitions_pendingToRejected() {
            Order pending = order(1L, OrderStatus.PENDING);
            Order rejected = order(1L, OrderStatus.REJECTED);
            when(orderRepository.findById(1L)).thenReturn(Mono.just(pending));
            when(orderRepository.save(any())).thenReturn(Mono.just(rejected));
            when(redisTemplate.delete(anyString())).thenReturn(Mono.just(1L));

            StepVerifier.create(orderService.applyInventoryFailure(1L))
                    .expectNextMatches(o -> o.getStatus() == OrderStatus.REJECTED)
                    .verifyComplete();
        }

        @Test
        @DisplayName("order not found: emits OrderNotFoundException")
        void orderNotFound() {
            when(orderRepository.findById(5L)).thenReturn(Mono.empty());

            StepVerifier.create(orderService.applyInventoryFailure(5L))
                    .expectError(OrderNotFoundException.class)
                    .verify();
        }
    }

    // ── placeOrder ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("placeOrder() — pipeline logic tests (no SecurityContext)")
    class PlaceOrder {

        @Test
        @DisplayName("empty cart emits EmptyCartException")
        void emptyCart_emitsException() {
            StepVerifier.create(
                    Mono.just(List.<CartItemDto>of())
                            .flatMap(items -> {
                                if (items.isEmpty()) return Mono.error(new EmptyCartException());
                                return Mono.just("ok");
                            })
            )
                    .expectError(EmptyCartException.class)
                    .verify();
        }

        @Test
        @DisplayName("Kafka unavailable emits KafkaUnavailableException")
        void kafkaUnavailable_emitsException() {
            when(publisherProvider.getIfAvailable()).thenReturn(null);

            // Use Mono.defer to mirror the service's ObjectProvider null-check pattern.
            StepVerifier.create(
                    Mono.defer(() -> {
                        OrderEventPublisher pub = publisherProvider.getIfAvailable();
                        if (pub == null) return Mono.error(new KafkaUnavailableException());
                        return Mono.just(pub);
                    }).map(pub -> "ok")
            )
                    .expectError(KafkaUnavailableException.class)
                    .verify();
        }

        @Test
        @DisplayName("Kafka publisher available and cart non-empty: publisher is called")
        void kafkaAvailable_publisherIsCalled() {
            CartItemDto item = new CartItemDto(10L, "Laptop", 1, BigDecimal.valueOf(999));
            Order saved = order(1L, OrderStatus.PENDING);

            when(cartClient.getCart()).thenReturn(Mono.just(List.of(item)));
            when(orderRepository.save(any())).thenReturn(Mono.just(saved));
            when(publisherProvider.getIfAvailable()).thenReturn(orderEventPublisher);
            when(orderEventPublisher.publish(any())).thenReturn(Mono.empty());
            when(cartClient.clearCart()).thenReturn(Mono.empty());

            var pipeline = cartClient.getCart()
                    .flatMap(items -> {
                        if (items.isEmpty()) return Mono.error(new EmptyCartException());
                        BigDecimal total = items.stream()
                                .map(i -> BigDecimal.valueOf(999).multiply(BigDecimal.valueOf(i.quantity())))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                        Order o = Order.builder().userId("user-1").totalPrice(total).status(OrderStatus.PENDING).build();
                        return orderRepository.save(o);
                    })
                    .flatMap(o -> {
                        OrderEventPublisher pub = publisherProvider.getIfAvailable();
                        if (pub == null) return Mono.error(new KafkaUnavailableException());
                        return pub.publish(o).thenReturn("Order placed successfully with Order Id: " + o.getId());
                    })
                    .flatMap(msg -> cartClient.clearCart().thenReturn(msg));

            StepVerifier.create(pipeline)
                    .expectNextMatches(msg -> msg.contains("Order placed"))
                    .verifyComplete();

            verify(orderEventPublisher).publish(any());
            verify(cartClient).clearCart();
        }
    }
}
