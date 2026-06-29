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
 * Idempotency ledger row marking that the Saga compensation for an order has already
 * been processed. Persisted via {@code R2dbcEntityTemplate.insert(...)} so a redelivered
 * event collides on the {@code order_id} primary key instead of silently updating.
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

    private LocalDateTime processedAt;
}
