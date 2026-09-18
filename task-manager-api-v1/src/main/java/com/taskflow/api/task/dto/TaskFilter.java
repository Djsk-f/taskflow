package com.taskflow.api.task.dto;

import com.taskflow.api.task.TaskDueFilter;
import com.taskflow.api.task.TaskPriority;
import com.taskflow.api.task.TaskStatus;

/** Critères de recherche transmis par le client ; un critère absent ne filtre pas. */
public record TaskFilter(
        String search,
        TaskStatus status,
        TaskPriority priority,
        TaskDueFilter due) {
}
