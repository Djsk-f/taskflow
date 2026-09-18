package com.taskflow.api.notification;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Passage périodique du générateur (30 s par défaut). Désactivé dans les tests, qui
 * appellent le générateur avec un instant choisi. Une seule instance d'API est prévue :
 * à plusieurs, la contrainte d'unicité empêcherait tout de même les doublons.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.notifications.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationScheduler {

    private final NotificationGenerator notificationGenerator;

    @Scheduled(initialDelayString = "${app.notifications.initial-delay-ms:5000}",
            fixedDelayString = "${app.notifications.scan-interval-ms:30000}")
    public void run() {
        notificationGenerator.generate(Instant.now());
    }
}
