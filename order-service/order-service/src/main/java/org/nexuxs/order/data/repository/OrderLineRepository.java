package org.nexuxs.order.data.repository;

import org.nexuxs.order.data.model.OrderLine;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface OrderLineRepository extends ReactiveCrudRepository<OrderLine, Long> {

    Flux<OrderLine> findByOrderId(Long orderId);
}
