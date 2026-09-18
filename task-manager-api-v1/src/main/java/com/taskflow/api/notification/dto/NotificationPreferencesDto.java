package com.taskflow.api.notification.dto;

import com.taskflow.api.notification.NotificationPreferences;
import jakarta.validation.constraints.NotNull;

/** Préférences de notification, en lecture comme en écriture (PUT complet : tout est requis). */
public record NotificationPreferencesDto(
        @NotNull(message = "{validation.preference.required}") Boolean dueIn24h,
        @NotNull(message = "{validation.preference.required}") Boolean dueIn1h,
        @NotNull(message = "{validation.preference.required}") Boolean overdue,
        @NotNull(message = "{validation.preference.required}") Boolean dailyTimeReminder) {

    public static NotificationPreferencesDto from(NotificationPreferences preferences) {
        return new NotificationPreferencesDto(preferences.isDueIn24h(), preferences.isDueIn1h(),
                preferences.isOverdue(), preferences.isDailyTimeReminder());
    }

    public NotificationPreferences toPreferences() {
        return new NotificationPreferences(dueIn24h, dueIn1h, overdue, dailyTimeReminder);
    }
}
