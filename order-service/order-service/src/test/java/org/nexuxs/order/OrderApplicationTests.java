package org.nexuxs.order;

import org.junit.jupiter.api.Test;
import org.nexuxs.order.data.repository.OrderLineRepository;
import org.nexuxs.order.data.repository.OrderRepository;
import org.nexuxs.order.messaging.OrderEventPublisher;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
class OrderApplicationTests {

    @MockBean
    private OrderRepository orderRepository;

    @MockBean
    private OrderLineRepository orderLineRepository;

    @MockBean
    private OrderEventPublisher orderEventPublisher;

    @Test
    void contextLoads() {
    }
}
