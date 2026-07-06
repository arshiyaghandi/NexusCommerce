package org.nexuxs.finance.data.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

/**
 * Idempotency ledger row marking that the payment transaction for an order has already
 * been recorded. Persisted via {@code R2dbcEntityTemplate.insert(...)} so a redelivered
 * {@code PaymentCompletedEvent} collides on the {@code order_id} primary key instead of
 * inserting a second ledger row. Mirrors the {@code processed_compensations} pattern used
 * by inventory-service for Saga compensation dedup.
 */
@Table("processed_payments")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProcessedPayment {

    @Id
    private Long orderId;

    private LocalDateTime processedAt;
}
