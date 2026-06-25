package org.nexuxs.messaging.contracts;

/**
 * Central registry of Kafka topic names for NexusCommerce.
 */
public final class NexusTopics {

    public static final String ORDER_CREATED = "nexus.order.created";
    public static final String INVENTORY_RESERVED = "nexus.inventory.reserved";
    public static final String PAYMENT_COMPLETED = "nexus.payment.completed";

    private NexusTopics() {
    }
}
