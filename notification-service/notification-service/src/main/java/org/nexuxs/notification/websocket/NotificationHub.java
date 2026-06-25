package org.nexuxs.notification.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;

import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class NotificationHub {

    private final CopyOnWriteArrayList<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    public void addSession(WebSocketSession session) {
        sessions.add(session);
        log.info("WebSocket session connected: {} (total={})", session.getId(), sessions.size());
    }

    public void removeSession(WebSocketSession session) {
        sessions.remove(session);
        log.info("WebSocket session disconnected: {} (total={})", session.getId(), sessions.size());
    }

    public void broadcast(String jsonMessage) {
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                session.send(Mono.just(session.textMessage(jsonMessage)))
                        .subscribe(
                                null,
                                error -> log.warn("Failed to send to session {}: {}", session.getId(), error.getMessage())
                        );
            }
        }
    }
}
