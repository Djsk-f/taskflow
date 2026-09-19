package com.taskflow.api.notification;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Flux temps réel des notifications (Server-Sent Events) : le serveur prévient, au lieu
 * que le navigateur demande toutes les 30 s. Un utilisateur peut avoir plusieurs onglets
 * ouverts, donc plusieurs flux. L'interrogation régulière reste la solution de repli si
 * le flux tombe : rien n'est perdu si un mandataire coupe la connexion.
 */
@Slf4j
@Component
public class NotificationStream {

    /** Commentaire SSE envoyé régulièrement : il maintient la connexion ouverte. */
    private static final String HEARTBEAT = "ping";

    private final Map<Long, Set<SseEmitter>> byUser = new ConcurrentHashMap<>();
    private final long timeoutMs;

    NotificationStream(@Value("${app.notifications.stream-timeout-ms:300000}") long timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(timeoutMs);
        byUser.computeIfAbsent(userId, key -> ConcurrentHashMap.newKeySet()).add(emitter);
        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(error -> remove(userId, emitter));
        // Premier événement immédiat : le client sait que le flux est vivant (et arrête d'interroger).
        send(userId, emitter, "connected");
        return emitter;
    }

    /** Prévient les onglets ouverts de cet utilisateur qu'il y a du nouveau. */
    public void publish(Long userId) {
        byUser.getOrDefault(userId, Set.of()).forEach(emitter -> send(userId, emitter, "notifications"));
    }

    @Scheduled(fixedDelayString = "${app.notifications.heartbeat-ms:25000}")
    void heartbeat() {
        byUser.forEach((userId, emitters) -> emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().comment(HEARTBEAT));
            } catch (IOException | IllegalStateException closed) {
                remove(userId, emitter);
            }
        }));
    }

    private void send(Long userId, SseEmitter emitter, String event) {
        try {
            emitter.send(SseEmitter.event().name(event).data(event));
        } catch (IOException | IllegalStateException closed) {
            remove(userId, emitter);
        }
    }

    private void remove(Long userId, SseEmitter emitter) {
        byUser.computeIfPresent(userId, (key, emitters) -> {
            emitters.remove(emitter);
            return emitters.isEmpty() ? null : emitters;
        });
    }

    /** Nombre de flux ouverts (diagnostic et tests). */
    public int openStreams() {
        return byUser.values().stream().mapToInt(Set::size).sum();
    }
}
