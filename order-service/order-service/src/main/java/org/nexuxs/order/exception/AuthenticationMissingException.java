package org.nexuxs.order.exception;

public class AuthenticationMissingException extends RuntimeException {

    public AuthenticationMissingException() {
        super("Missing authentication context");
    }
}
