package com.taskflow.api.notification;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Passage périodique : génération des rappels puis récapitulatifs par e-mail (30 s par
 * défaut). Désactivé dans les tests, qui appellent ces traitements avec un instant choisi. Une seule instance d'API est prévue :
 * à plusieurs, la contrainte d'unicité empêcherait tout de même les doublons.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.notifications.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationScheduler {

    private final NotificationGenerator notificationGenerator;
    private final EmailDigestJob emailDigestJob;

    @Scheduled(initialDelayString = "${app.notifications.initial-delay-ms:5000}",
            fixedDelayString = "${app.notifications.scan-interval-ms:30000}")
    public void run() {
        Instant now = Instant.now();
        notificationGenerator.generate(now);
        emailDigestJob.sendDue(now);
    }
}
