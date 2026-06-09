package org.nexuxs.inventory;

import org.junit.jupiter.api.Test;
import org.nexuxs.inventory.data.repository.InventoryRepository;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
class InventoryApplicationTests {

	@MockBean
	private InventoryRepository inventoryRepository;

	@Test
	void contextLoads() {
	}
}
