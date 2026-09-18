package com.taskflow.api.notification;

import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Réglages des notifications (`app.notifications.*`). Le rappel de saisie du temps se
 * déclenche à une heure locale : le fuseau est celui de l'équipe (un seul pour tous),
 * faute de fuseau par utilisateur.
 */
@ConfigurationProperties(prefix = "app.notifications")
public record NotificationProperties(
        @DefaultValue("Europe/Paris") ZoneId zone,
        @DefaultValue("17") int dailyTimeHour) {
}
