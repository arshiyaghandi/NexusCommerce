package org.nexuxs.cart;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;

@SpringBootTest
class CartApplicationTests {

    @MockBean
    private ReactiveStringRedisTemplate reactiveStringRedisTemplate;

    @Test
    void contextLoads() {
    }
}
