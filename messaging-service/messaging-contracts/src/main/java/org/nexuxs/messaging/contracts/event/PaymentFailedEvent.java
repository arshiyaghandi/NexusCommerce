package org.nexuxs.messaging.contracts.event;

import java.time.Instant;

public record PaymentFailedEvent(
        Long orderId,
        Long productId,
        int quantity,
        String reason,
        Instant failedAt
) {}