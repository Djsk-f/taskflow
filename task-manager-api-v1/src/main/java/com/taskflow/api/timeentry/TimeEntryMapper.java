package com.taskflow.api.timeentry;

import com.taskflow.api.timeentry.dto.TimeEntryRequest;
import com.taskflow.api.timeentry.dto.TimeEntryResponse;

final class TimeEntryMapper {

    private TimeEntryMapper() {
    }

    static void applyTo(TimeEntryRequest request, TimeEntry entry) {
        entry.setWorkDate(request.workDate());
        entry.setDurationMinutes(request.durationMinutes());
        entry.setNote(request.note() == null || request.note().isBlank() ? null : request.note().trim());
    }

    static TimeEntryResponse toResponse(TimeEntry entry) {
        return new TimeEntryResponse(
                entry.getId(),
                entry.getTask().getId(),
                entry.getTask().getTitle(),
                entry.getTask().getStatus(),
                entry.getWorkDate(),
                entry.getDurationMinutes(),
                entry.getNote(),
                entry.getCreatedAt(),
                entry.getUpdatedAt());
    }
}
