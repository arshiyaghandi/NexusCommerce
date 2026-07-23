package org.nexuxs.auth.api;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class CaptchaController {

    private static final String CAPTCHA_KEY_PREFIX = "captcha:";
    private static final Duration CAPTCHA_TTL = Duration.ofMinutes(5);

    private final ReactiveStringRedisTemplate redisTemplate;

    @GetMapping("/captcha")
    public Mono<Map<String, String>> generateCaptcha() {
        int a = ThreadLocalRandom.current().nextInt(1, 20);
        int b = ThreadLocalRandom.current().nextInt(1, 20);
        int answer = a + b;

        String id = UUID.randomUUID().toString();
        String question = "What is " + a + " + " + b + "?";

        return redisTemplate.opsForValue()
                .set(CAPTCHA_KEY_PREFIX + id, String.valueOf(answer), CAPTCHA_TTL)
                .thenReturn(Map.of("id", id, "question", question));
    }
}
