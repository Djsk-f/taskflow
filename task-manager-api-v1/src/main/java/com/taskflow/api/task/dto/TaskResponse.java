package com.taskflow.api.task.dto;

import com.taskflow.api.task.TaskPriority;
import com.taskflow.api.task.TaskStatus;
import java.time.Instant;

public record TaskResponse(
        Long id,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        Instant dueDate,
        Instant reminderAt,
        Instant createdAt,
        Instant updatedAt,
        int timeSpentMinutes) {
}
