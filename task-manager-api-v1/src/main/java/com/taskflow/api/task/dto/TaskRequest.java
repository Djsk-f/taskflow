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
        @NotBlank(message = "{validation.title.required}")
        @Size(max = 150, message = "{validation.title.size}")
        String title,

        @Size(max = 2000, message = "{validation.description.size}")
        String description,

        TaskStatus status,

        TaskPriority priority,

        Instant dueDate) {
}
