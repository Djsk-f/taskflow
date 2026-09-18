package com.taskflow.api.task.dto;

import com.taskflow.api.task.TaskStatus;
import jakarta.validation.constraints.NotNull;

/** Changement de statut seul : c'est l'action du glisser-déposer du tableau Kanban. */
public record TaskStatusRequest(
        @NotNull(message = "Le statut est obligatoire.")
        TaskStatus status) {
}
