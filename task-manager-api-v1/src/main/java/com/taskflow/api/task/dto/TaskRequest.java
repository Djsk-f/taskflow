package com.taskflow.api.task.dto;

import com.taskflow.api.task.TaskPriority;
import com.taskflow.api.task.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/**
 * Corps de création et de modification d'une tâche. Aucun identifiant de propriétaire :
 * il vient du jeton (INV-12). `status` et `priority` absents prennent leurs valeurs par
 * défaut dans TaskMapper, seul endroit où ces défauts sont définis.
 */
public record TaskRequest(
        @NotBlank(message = "Le titre est obligatoire.")
        @Size(max = 150, message = "Le titre ne peut pas dépasser 150 caractères.")
        String title,

        @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères.")
        String description,

        TaskStatus status,

        TaskPriority priority,

        Instant dueDate) {
}
