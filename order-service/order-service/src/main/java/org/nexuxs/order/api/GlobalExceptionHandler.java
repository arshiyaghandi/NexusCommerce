package org.nexuxs.order.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleResponseStatus(ResponseStatusException ex) {
        return Mono.just(ResponseEntity.status(ex.getStatusCode())
                .body(buildBody(ex.getStatusCode().value(), ex.getReason())));
    }

    @ExceptionHandler(IllegalStateException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleIllegalState(IllegalStateException ex) {
        if (ex.getMessage() != null && ex.getMessage().contains("Order not found")) {
            return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(buildBody(HttpStatus.NOT_FOUND.value(), ex.getMessage())));
        }
        if (ex.getMessage() != null && ex.getMessage().contains("Missing authentication")) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(buildBody(HttpStatus.FORBIDDEN.value(), ex.getMessage())));
        }
        return Mono.just(ResponseEntity.badRequest()
                .body(buildBody(HttpStatus.BAD_REQUEST.value(), ex.getMessage())));
    }

    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleGeneric(Exception ex) {
        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildBody(HttpStatus.INTERNAL_SERVER_ERROR.value(), "An unexpected error occurred")));
    }

    private Map<String, Object> buildBody(int status, String message) {
        return Map.of("status", status, "message", message);
    }
}
