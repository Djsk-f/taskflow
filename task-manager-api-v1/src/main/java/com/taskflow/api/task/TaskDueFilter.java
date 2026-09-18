package com.taskflow.api.task;

import java.time.Duration;

/**
 * Filtre par échéance, aligné sur les tuiles du tableau de bord : les mêmes définitions
 * servent au comptage et à la liste, sinon « 3 en retard » ouvrirait une liste de 2.
 * Une tâche terminée n'est jamais « en retard » ni « à rendre ».
 */
public enum TaskDueFilter {
    /** Échéance dépassée. */
    OVERDUE,
    /** Échéance dans les sept prochains jours. */
    THIS_WEEK;

    static final Duration WEEK = Duration.ofDays(7);
}
