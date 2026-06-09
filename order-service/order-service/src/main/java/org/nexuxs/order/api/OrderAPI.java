package org.nexuxs.order.api;

import lombok.RequiredArgsConstructor;
import org.nexuxs.order.data.dto.OrderRequest;
import org.nexuxs.order.service.OrderService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderAPI {
    private final OrderService orderService;
    @PostMapping
    public Mono<String> placeOrder(@RequestBody OrderRequest orderRequest) {
        return orderService.placeOrder(orderRequest);
    }
}
