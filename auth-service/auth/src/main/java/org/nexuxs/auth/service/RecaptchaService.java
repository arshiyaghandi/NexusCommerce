package org.nexuxs.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class RecaptchaService {

    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
    private static final double MIN_SCORE = 0.5;

    @Value("${recaptcha.secret-key:REPLACE_WITH_YOUR_SECRET_KEY}")
    private String secretKey;

    private final WebClient webClient = WebClient.builder().build();

    public Mono<Boolean> verify(String token, String action) {
        if (secretKey.startsWith("REPLACE_WITH")) {
            log.warn("reCAPTCHA secret key not configured, skipping verification");
            return Mono.just(true);
        }

        return webClient.post()
                .uri(VERIFY_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue("secret=" + secretKey + "&response=" + token)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    Boolean success = (Boolean) response.get("success");
                    Double score = (Double) response.get("score");
                    String responseAction = (String) response.get("action");

                    log.info("reCAPTCHA verification: success={}, score={}, action={}", success, score, responseAction);

                    if (success == null || !success) {
                        log.warn("reCAPTCHA verification failed");
                        return false;
                    }
                    if (score != null && score < MIN_SCORE) {
                        log.warn("reCAPTCHA score too low: {}", score);
                        return false;
                    }
                    if (action != null && !action.equals(responseAction)) {
                        log.warn("reCAPTCHA action mismatch: expected={}, got={}", action, responseAction);
                        return false;
                    }
                    return true;
                })
                .onErrorResume(error -> {
                    log.error("reCAPTCHA verification error: {}", error.getMessage());
                    return Mono.just(false);
                });
    }
}
