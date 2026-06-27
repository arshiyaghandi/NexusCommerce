package org.nexuxs.inventory.api;

import lombok.RequiredArgsConstructor;
import org.nexuxs.inventory.data.dto.InventoryResponse;
import org.nexuxs.inventory.data.dto.ReserveRequest;
import org.nexuxs.inventory.service.InventoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryAPI {

    private final InventoryService inventoryService;

    @GetMapping("/{skuCode}")
    public Mono<InventoryResponse> getStock(@PathVariable String skuCode) {
        return inventoryService.getStock(skuCode);
    }

    
}
