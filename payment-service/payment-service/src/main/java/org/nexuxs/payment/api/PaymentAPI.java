package org.nexuxs.payment.api;

import lombok.RequiredArgsConstructor;
import org.nexuxs.payment.data.model.Payment;
import org.nexuxs.payment.data.repository.PaymentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentAPI {

    private final PaymentRepository paymentRepository;

    @GetMapping("/order/{orderId}")
    public Mono<Payment> getPaymentByOrderId(@PathVariable Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found for order id: " + orderId)));
    }
}
