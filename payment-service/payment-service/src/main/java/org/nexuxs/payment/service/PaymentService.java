package org.nexuxs.payment.service;

import lombok.RequiredArgsConstructor;
import org.nexuxs.payment.data.dto.PaymentRequest;
import org.nexuxs.payment.data.model.Payment;
import org.nexuxs.payment.data.model.PaymentStatus;
import org.nexuxs.payment.data.repository.PaymentRepository;
import org.nexuxs.payment.messaging.PaymentEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ObjectProvider<PaymentEventPublisher> paymentEventPublisherProvider;

    public Mono<Payment> processPayment(PaymentRequest request) {
        return currentUserId()
                .flatMap(userId -> {
                    Payment payment = Payment.builder()
                            .orderId(request.orderId())
                            .userId(userId)
                            .amount(request.amount())
                            .status(PaymentStatus.COMPLETED)
                            .build();
                    return paymentRepository.save(payment)
                            .flatMap(savedPayment -> {
                                PaymentEventPublisher publisher = paymentEventPublisherProvider.getIfAvailable();
                                Mono<Void> published = publisher != null ? publisher.publish(savedPayment) : Mono.empty();
                                return published.thenReturn(savedPayment);
                            });
                });
    }

    private Mono<String> currentUserId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> context.getAuthentication())
                .cast(JwtAuthenticationToken.class)
                .map(auth -> auth.getToken().getSubject())
                .switchIfEmpty(Mono.error(new IllegalStateException("Missing authentication for payment processing")));
    }
}
