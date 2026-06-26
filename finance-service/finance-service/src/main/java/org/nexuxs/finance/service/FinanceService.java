package org.nexuxs.finance.service;

import lombok.RequiredArgsConstructor;
import org.nexuxs.finance.data.dto.FinanceSummaryResponse;
import org.nexuxs.finance.data.model.Transaction;
import org.nexuxs.finance.data.model.TransactionType;
import org.nexuxs.finance.data.repository.TransactionRepository;
import org.nexuxs.messaging.contracts.event.PaymentCompletedEvent;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private final TransactionRepository transactionRepository;

    public void savePaymentTransaction(PaymentCompletedEvent event) {
        Transaction transaction = Transaction.builder()
                .orderId(event.orderId())
                .userId(event.userId())
                .amount(event.amount())
                .type(TransactionType.PAYMENT)
                .build();
        transactionRepository.save(transaction).block();
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
