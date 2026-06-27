package org.nexuxs.payment.api;

import lombok.RequiredArgsConstructor;
import org.nexuxs.payment.data.dto.PaymentRequest;
import org.nexuxs.payment.data.model.Payment;
import org.nexuxs.payment.service.PaymentService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentAPI {


}
