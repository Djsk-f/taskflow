package com.taskflow.api.timeentry.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Saisie ou modification d'un temps passé. La tâche doit appartenir à l'utilisateur. */
public record TimeEntryRequest(
        @NotNull(message = "{validation.time.task.required}")
        Long taskId,

        @NotNull(message = "{validation.time.date.required}")
        LocalDate workDate,

        @NotNull(message = "{validation.time.duration}")
        @Min(value = 1, message = "{validation.time.duration}")
        @Max(value = 1440, message = "{validation.time.duration}")
        Integer durationMinutes,

        @Size(max = 500, message = "{validation.time.note.size}")
        String note) {
}
