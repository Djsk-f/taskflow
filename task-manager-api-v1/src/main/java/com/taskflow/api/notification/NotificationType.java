package com.taskflow.api.notification;

/**
 * Événements notifiés. Une application personnelle n'a pas d'événements d'équipe
 * (« on vous a assigné… ») : tout part des échéances de l'utilisateur.
 */
public enum NotificationType {
    /** Échéance dans moins de 24 h (et plus d'une heure). */
    DUE_IN_24H,
    /** Échéance dans moins d'une heure. */
    DUE_IN_1H,
    /** Échéance dépassée, tâche non terminée. */
    OVERDUE,
    /** Rappel choisi par l'utilisateur sur la tâche (« me le rappeler le… »). */
    REMINDER,
    /** Jour ouvré, en fin de journée, sans aucun temps saisi (réglage facultatif). */
    NO_TIME_LOGGED
}
