package org.nexuxs.messaging.contracts;

/**
 * Central registry of Kafka topic names for NexusCommerce.
 */
public final class NexusTopics {

    public static final String ORDER_CREATED = "nexus.order.created";
    public static final String INVENTORY_RESERVED = "nexus.inventory.reserved";
    public static final String INVENTORY_FAILED = "inventory.failed.topic";
    public static final String PAYMENT_COMPLETED = "nexus.payment.completed";
    public static final String PAYMENT_FAILED = "payment.failed.topic";

    private NexusTopics() {
    }
}
