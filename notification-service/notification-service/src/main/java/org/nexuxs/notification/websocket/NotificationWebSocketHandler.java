package org.nexuxs.notification.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class NotificationWebSocketHandler implements WebSocketHandler {

    private final NotificationHub notificationHub;

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        notificationHub.addSession(session);
        return session.receive()
                .doFinally(signal -> notificationHub.removeSession(session))
                .then();
    }
}
