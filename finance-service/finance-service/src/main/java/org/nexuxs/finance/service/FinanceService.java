package org.nexuxs.finance.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nexuxs.finance.data.dto.FinanceSummaryResponse;
import org.nexuxs.finance.data.model.ProcessedPayment;
import org.nexuxs.finance.data.model.Transaction;
import org.nexuxs.finance.data.model.TransactionType;
import org.nexuxs.finance.data.repository.TransactionRepository;
import org.nexuxs.messaging.contracts.event.PaymentCompletedEvent;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinanceService {

    private final TransactionRepository transactionRepository;
    private final R2dbcEntityTemplate entityTemplate;

    /**
     * Records exactly one ledger transaction per order, even under Kafka at-least-once
     * delivery. A {@link ProcessedPayment} marker is inserted first; because
     * {@code order_id} is its primary key, a redelivered event collides on insert and
     * short-circuits before the transaction is written. A backstop UNIQUE constraint on
     * {@code transactions.order_id} provides the same guarantee for the ledger row itself.
     *
     * <p>If the transaction save fails after the marker was inserted, the marker is
     * removed so the next Kafka redelivery can retry recording the transaction.
     */
    public Mono<Void> savePaymentTransaction(PaymentCompletedEvent event) {
        ProcessedPayment marker = ProcessedPayment.builder()
                .orderId(event.orderId())
                .processedAt(LocalDateTime.now())
                .build();

        return entityTemplate.insert(ProcessedPayment.class).using(marker)
                .then(Mono.defer(() -> {
                    Transaction transaction = Transaction.builder()
                            .orderId(event.orderId())
                            .userId(event.userId())
                            .amount(event.amount())
                            .type(TransactionType.PAYMENT)
                            .build();
                    return transactionRepository.save(transaction)
                            .doOnSuccess(t -> log.info("Ledger updated: transaction recorded for orderId={}", event.orderId()));
                }))
                .then()
                .onErrorResume(this::isDuplicate, error -> {
                    log.info("Skipping duplicate payment transaction for orderId={} (already processed)", event.orderId());
                    return Mono.empty();
                })
                .onErrorResume(error -> {
                    // Transaction save failed after marker was inserted — remove the marker
                    // so the next Kafka redelivery can retry recording the transaction.
                    log.warn("Transaction save failed for orderId={}, removing idempotency marker for retry: {}",
                            event.orderId(), error.getMessage());
                    Query deleteQuery = Query.query(Criteria.where("orderId").is(event.orderId()));
                    return entityTemplate.delete(ProcessedPayment.class)
                            .matching(deleteQuery)
                            .all()
                            .then(Mono.error(error));
                });
    }

    private boolean isDuplicate(Throwable error) {
        return error instanceof DuplicateKeyException
                || error instanceof DataIntegrityViolationException;
    }

    public Flux<Transaction> getCurrentUserTransactions() {
        return currentUserId()
                .flatMapMany(transactionRepository::findByUserIdOrderByCreatedAtDesc);
    }

    public Mono<FinanceSummaryResponse> getCurrentUserSummary() {
        return currentUserId()
                .flatMap(userId -> transactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                        .map(Transaction::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .zipWith(transactionRepository.countByUserId(userId))
                        .map(tuple -> new FinanceSummaryResponse(userId, tuple.getT1(), tuple.getT2())));
    }

    private Mono<String> currentUserId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> context.getAuthentication())
                .cast(JwtAuthenticationToken.class)
                .map(auth -> auth.getToken().getSubject())
                .switchIfEmpty(Mono.error(new IllegalStateException("Missing authentication")));
    }
}