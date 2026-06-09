package org.nexuxs.inventory.data.repository;

import org.nexuxs.inventory.data.model.Inventory;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface InventoryRepository extends ReactiveCrudRepository<Inventory, Long> {

    Mono<Inventory> findBySkuCode(String skuCode);
}
