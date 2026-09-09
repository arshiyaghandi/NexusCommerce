package org.nexuxs.order.exception;

public class EmptyCartException extends RuntimeException {

    public EmptyCartException() {
        super("Cannot place order: cart is empty");
    }
}
