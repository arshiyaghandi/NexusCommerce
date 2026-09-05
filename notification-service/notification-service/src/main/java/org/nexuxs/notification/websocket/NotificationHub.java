package org.nexuxs.notification.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class NotificationHub {

    private final Map<String, CopyOnWriteArrayList<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    public void addSession(String userId, WebSocketSession session) {
        userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(session);
        log.info("WebSocket connected: userId={}, sessionId={}, totalUsers={}",
                userId, session.getId(), userSessions.size());
    }

    public void removeSession(String userId, WebSocketSession session) {
        CopyOnWriteArrayList<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
            }
        }
        log.info("WebSocket disconnected: userId={}, sessionId={}", userId, session.getId());
    }

    public void sendToUser(String userId, String jsonMessage) {
        CopyOnWriteArrayList<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            log.debug("No active sessions for userId={}, skipping notification", userId);
            return;
        }
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

    public void broadcast(String jsonMessage) {
        userSessions.values().forEach(sessions -> {
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.send(Mono.just(session.textMessage(jsonMessage)))
                            .subscribe(
                                    null,
                                    error -> log.warn("Failed to send to session {}: {}", session.getId(), error.getMessage())
                            );
                }
            }
        });
    }
}
