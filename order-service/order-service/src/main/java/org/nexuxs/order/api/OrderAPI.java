package org.nexuxs.order.api;

import lombok.RequiredArgsConstructor;
import org.nexuxs.order.data.dto.OrderResponse;
import org.nexuxs.order.service.OrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderAPI {

    private final OrderService orderService;

    @GetMapping
    public Flux<OrderResponse> myOrders() {
        return orderService.myOrders();
    }

    @GetMapping("/{orderId}")
    public Mono<OrderResponse> getOrder(@PathVariable Long orderId) {
        return orderService.getOrder(orderId);
    }

    @PostMapping
    public Mono<String> placeOrder() {
        return orderService.placeOrder();
    }
}
