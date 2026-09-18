package com.taskflow.api.timeentry.dto;

import com.taskflow.api.task.TaskStatus;
import java.time.Instant;
import java.time.LocalDate;

public record TimeEntryResponse(
        Long id,
        Long taskId,
        String taskTitle,
        TaskStatus taskStatus,
        LocalDate workDate,
        int durationMinutes,
        String note,
        Instant createdAt,
        Instant updatedAt) {
}
