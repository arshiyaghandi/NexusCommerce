package org.nexuxs.order.data.repository;

import org.nexuxs.order.data.model.Order;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface OrderRepository extends ReactiveCrudRepository<Order, Long> {
}
