package org.nexuxs.notification.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationWebSocketHandler implements WebSocketHandler {

    private final NotificationHub notificationHub;

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        String userId = extractUserId(session);
        if (userId == null || userId.isBlank()) {
            log.warn("WebSocket connection rejected: missing userId query param");
            return session.close();
        }

        notificationHub.addSession(userId, session);

        return session.receive()
                .doFinally(signal -> notificationHub.removeSession(userId, session))
                .then();
    }

    private String extractUserId(WebSocketSession session) {
        if (session.getHandshakeInfo().getUri().getQuery() == null) {
            return null;
        }
        return UriComponentsBuilder.fromUri(session.getHandshakeInfo().getUri())
                .build()
                .getQueryParams()
                .getFirst("userId");
    }
}
