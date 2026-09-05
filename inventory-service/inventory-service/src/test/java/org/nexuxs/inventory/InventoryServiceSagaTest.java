package org.nexuxs.inventory;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.nexuxs.inventory.data.model.Inventory;
import org.nexuxs.inventory.data.model.ProcessedCompensation;
import org.nexuxs.inventory.data.repository.InventoryRepository;
import org.nexuxs.inventory.service.InventoryService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.r2dbc.core.ReactiveInsertOperation;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InventoryServiceSagaTest {

    @Mock
    private R2dbcEntityTemplate entityTemplate;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ReactiveStringRedisTemplate redisTemplate;

    @Mock
    private ReactiveInsertOperation.ReactiveInsert<ProcessedCompensation> reactiveInsert;

    @InjectMocks
    private InventoryService inventoryService;

    @Test
    void testCompensateReservation_Success() {
        Long orderId = 100L;
        Long productId = 10L;
        int quantity = 2;
        String skuCode = "SKU010";

        when(entityTemplate.insert(ProcessedCompensation.class)).thenReturn(reactiveInsert);
        when(reactiveInsert.using(any(ProcessedCompensation.class))).thenReturn(Mono.just(new ProcessedCompensation()));

        when(inventoryRepository.incrementStock(skuCode, quantity))
                .thenReturn(Mono.just(new Inventory(1L, skuCode, 10)));
                
        when(redisTemplate.delete(anyString())).thenReturn(Mono.just(1L));

        StepVerifier.create(inventoryService.compensateReservation(orderId, productId, quantity))
                .verifyComplete();

        verify(entityTemplate, times(1)).insert(ProcessedCompensation.class);
        verify(inventoryRepository, times(1)).incrementStock(skuCode, quantity);
        verify(redisTemplate, times(1)).delete(anyString());
    }

    @Test
    void testCompensateReservation_Idempotency_DuplicateEvent() {
        Long orderId = 100L;
        Long productId = 10L;
        int quantity = 2;
        String skuCode = "SKU010";

        when(entityTemplate.insert(ProcessedCompensation.class)).thenReturn(reactiveInsert);
        when(reactiveInsert.using(any(ProcessedCompensation.class)))
                .thenReturn(Mono.error(new DuplicateKeyException("Duplicate PK")));

        StepVerifier.create(inventoryService.compensateReservation(orderId, productId, quantity))
                .verifyComplete();

        // The stock should NOT be incremented since it was a duplicate PK exception
        verify(inventoryRepository, never()).incrementStock(anyString(), anyInt());
    }
}
