package org.nexuxs.payment;

import org.junit.jupiter.api.Test;
import org.nexuxs.payment.data.repository.PaymentRepository;
import org.nexuxs.payment.messaging.PaymentEventPublisher;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
class PaymentApplicationTests {

    @MockBean
    private PaymentRepository paymentRepository;

    @MockBean
    private PaymentEventPublisher paymentEventPublisher;

    @Test
    void contextLoads() {
    }
}
