package org.nexuxs.inventory.data.repository;

import org.nexuxs.inventory.data.model.Inventory;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface InventoryRepository extends ReactiveCrudRepository<Inventory, Long> {

    Mono<Inventory> findBySkuCode(String skuCode);

    /**
     * Atomically decrements stock for a SKU only if sufficient quantity is available.
     * Returns the updated row if the decrement succeeded, or empty if insufficient stock.
     * This eliminates the TOCTOU race condition of read-modify-write.
     */
    @Modifying
    @Query("UPDATE t_inventory SET quantity = quantity - :qty WHERE sku_code = :sku AND quantity >= :qty RETURNING *")
    Mono<Inventory> decrementStock(String sku, int qty);
}
