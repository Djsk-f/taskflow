package com.taskflow.api.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Rappels automatiques voulus par l'utilisateur (colonnes de `users`). Les rappels
 * choisis sur une tâche ne dépendent pas de ces réglages : ils ont été demandés
 * explicitement. Défauts : tous les rappels d'échéance, pas le rappel de saisie du temps.
 */
@Getter
@Setter
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferences {

    @Column(name = "notify_due_24h", nullable = false)
    private boolean dueIn24h = true;

    @Column(name = "notify_due_1h", nullable = false)
    private boolean dueIn1h = true;

    @Column(name = "notify_overdue", nullable = false)
    private boolean overdue = true;

    @Column(name = "notify_daily_time", nullable = false)
    private boolean dailyTimeReminder = false;

    /** Le type d'événement est-il voulu ? Seuls les rappels automatiques sont réglables. */
    public boolean allows(NotificationType type) {
        return switch (type) {
            case DUE_IN_24H -> dueIn24h;
            case DUE_IN_1H -> dueIn1h;
            case OVERDUE -> overdue;
            case NO_TIME_LOGGED -> dailyTimeReminder;
            case REMINDER -> true;
        };
    }
}
