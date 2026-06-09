package org.nexuxs.order.service;

import lombok.RequiredArgsConstructor;
import org.nexuxs.order.client.InventoryClient;
import org.nexuxs.order.data.dto.OrderRequest;
import org.nexuxs.order.data.model.Order;
import org.nexuxs.order.data.repository.OrderRepository;
import org.nexuxs.order.messaging.OrderEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final ObjectProvider<OrderEventPublisher> orderEventPublisherProvider;

    public Mono<String> placeOrder(OrderRequest orderRequest) {
        return inventoryClient.reserveStock(orderRequest.skuCode(), orderRequest.quantity())
                .then(saveOrder(orderRequest));
    }

    private Mono<String> saveOrder(OrderRequest orderRequest) {
        Order order = Order.builder()
                .orderNumber(UUID.randomUUID().toString())
                .skuCode(orderRequest.skuCode())
                .price(orderRequest.price())
                .quantity(orderRequest.quantity())
                .build();
        return orderRepository.save(order)
                .flatMap(savedOrder -> {
                    OrderEventPublisher publisher = orderEventPublisherProvider.getIfAvailable();
                    Mono<Void> published = publisher != null ? publisher.publish(savedOrder) : Mono.empty();
                    return published.thenReturn(
                            "Order placed successfully with Order Number: " + savedOrder.getOrderNumber());
                });
    }
}
