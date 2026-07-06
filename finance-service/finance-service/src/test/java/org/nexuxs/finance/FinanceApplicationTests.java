package org.nexuxs.finance;

import org.junit.jupiter.api.Test;
import org.nexuxs.finance.data.repository.TransactionRepository;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;

@SpringBootTest
class FinanceApplicationTests {

    @MockBean
    private TransactionRepository transactionRepository;

    @MockBean
    private R2dbcEntityTemplate entityTemplate;

    @Test
    void contextLoads() {
    }
}
