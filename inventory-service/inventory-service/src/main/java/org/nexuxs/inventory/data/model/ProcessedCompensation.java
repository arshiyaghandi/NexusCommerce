package org.nexuxs.inventory.data.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

/**
 * Idempotency ledger row marking that the Saga compensation for an order+product has
 * already been processed. Persisted via {@code R2dbcEntityTemplate.insert(...)} so a
 * redelivered payment.failed event collides on the composite (order_id, product_id)
 * primary key instead of silently updating.
 */
@Table("processed_compensations")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProcessedCompensation {

    @Id
    private Long orderId;

    private Long productId;

    private LocalDateTime processedAt;
}
