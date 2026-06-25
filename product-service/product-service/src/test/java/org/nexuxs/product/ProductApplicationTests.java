package org.nexuxs.product;

import org.junit.jupiter.api.Test;
import org.nexuxs.product.data.repository.ProductRepository;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
class ProductApplicationTests {

	@MockBean
	private ProductRepository productRepository;

	@Test
	void contextLoads() {
	}
}
