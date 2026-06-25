package org.nexuxs.order.data.repository;

import org.nexuxs.order.data.model.Order;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends ReactiveCrudRepository<Order, Long> {

    reactor.core.publisher.Flux<Order> findByUserId(String userId);
}