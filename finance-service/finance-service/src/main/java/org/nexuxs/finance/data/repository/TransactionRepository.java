package org.nexuxs.finance.data.repository;

import org.nexuxs.finance.data.model.Transaction;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface TransactionRepository extends ReactiveCrudRepository<Transaction, Long> {

    Flux<Transaction> findByUserIdOrderByCreatedAtDesc(String userId);

    Mono<Long> countByUserId(String userId);
}
