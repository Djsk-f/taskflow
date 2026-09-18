package com.taskflow.api.task.dto;

import com.taskflow.api.task.TaskPriority;
import com.taskflow.api.task.TaskStatus;
import java.util.Map;

/**
 * Vue d'ensemble des tâches de l'utilisateur. Chaque statut et chaque priorité est
 * présent, à zéro si besoin : le client n'a pas à deviner les clés manquantes.
 *
 * @param openByPriority tâches non terminées, par priorité
 * @param overdue        tâches non terminées dont l'échéance est passée
 * @param dueThisWeek    tâches non terminées dont l'échéance tombe dans les 7 prochains jours
 */
public record TaskStatsResponse(
        long total,
        Map<TaskStatus, Long> byStatus,
        Map<TaskPriority, Long> openByPriority,
        long overdue,
        long dueThisWeek) {
}
