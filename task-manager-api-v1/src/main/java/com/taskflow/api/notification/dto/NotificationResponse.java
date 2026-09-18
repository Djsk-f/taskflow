package com.taskflow.api.notification.dto;

import com.taskflow.api.notification.Notification;
import com.taskflow.api.notification.NotificationType;
import java.time.Instant;

/**
 * Notification telle que l'affiche la cloche. Le titre est celui de la tâche aujourd'hui
 * (pas une copie figée) ; le texte du message est construit par l'interface, dans sa langue.
 */
public record NotificationResponse(
        Long id,
        NotificationType type,
        Long taskId,
        String taskTitle,
        Instant subjectAt,
        Instant createdAt,
        boolean read) {

    public static NotificationResponse from(Notification notification) {
        var task = notification.getTask();
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                task == null ? null : task.getId(),
                task == null ? null : task.getTitle(),
                notification.getSubjectAt(),
                notification.getCreatedAt(),
                notification.getReadAt() != null);
    }
}
