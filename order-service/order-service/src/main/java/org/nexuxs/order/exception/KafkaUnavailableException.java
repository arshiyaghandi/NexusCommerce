package org.nexuxs.order.exception;

public class KafkaUnavailableException extends RuntimeException {

    public KafkaUnavailableException() {
        super("OrderEventPublisher is not available (Kafka disabled)");
    }
}
