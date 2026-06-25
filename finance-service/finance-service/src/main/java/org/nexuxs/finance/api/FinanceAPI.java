package org.nexuxs.finance.api;

import lombok.RequiredArgsConstructor;
import org.nexuxs.finance.data.dto.FinanceSummaryResponse;
import org.nexuxs.finance.data.model.Transaction;
import org.nexuxs.finance.service.FinanceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceAPI {

    private final FinanceService financeService;

    @GetMapping("/transactions")
    public Flux<Transaction> getTransactions() {
        return financeService.getCurrentUserTransactions();
    }

    @GetMapping("/summary")
    public Mono<FinanceSummaryResponse> getSummary() {
        return financeService.getCurrentUserSummary();
    }
}
