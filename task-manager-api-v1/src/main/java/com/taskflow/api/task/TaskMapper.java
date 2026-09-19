package com.taskflow.api.task;

import com.taskflow.api.task.dto.TaskRequest;
import com.taskflow.api.task.dto.TaskResponse;
import com.taskflow.api.user.User;

/**
 * Conversions entité <-> DTO de la feature tâches, et **unique** définition des valeurs
 * par défaut. La création et la modification partagent applyTo : les champs éditables
 * ne sont recopiés qu'à un seul endroit (INV-21).
 */
public final class TaskMapper {

    private static final TaskStatus DEFAULT_STATUS = TaskStatus.TODO;
    private static final TaskPriority DEFAULT_PRIORITY = TaskPriority.MEDIUM;

    private TaskMapper() {
    }

    public static Task toEntity(TaskRequest request, User owner) {
        Task task = Task.builder().user(owner).build();
        applyTo(request, task);
        return task;
    }

    /** PUT est une mise à jour complète : un champ absent revient à sa valeur par défaut. */
    public static void applyTo(TaskRequest request, Task task) {
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setStatus(request.status() != null ? request.status() : DEFAULT_STATUS);
        task.setPriority(request.priority() != null ? request.priority() : DEFAULT_PRIORITY);
        task.setDueDate(request.dueDate());
        task.setReminderAt(request.reminderAt());
    }

    public static TaskResponse toResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getReminderAt(),
                task.getTimerStartedAt(),
                task.getCreatedAt(),
                task.getUpdatedAt(),
                task.getTimeSpentMinutes() == null ? 0 : task.getTimeSpentMinutes());
    }
}
