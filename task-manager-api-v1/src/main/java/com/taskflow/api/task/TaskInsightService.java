package com.taskflow.api.task;

import com.taskflow.api.task.dto.TaskResponse;
import com.taskflow.api.task.dto.TaskStatsResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lectures agrégées des tâches : statistiques du tableau de bord et échéances à surveiller.
 * Séparé de {@link TaskService}, qui porte les écritures et le CRUD.
 * Une tâche terminée n'est jamais « en retard » ni « à échéance ».
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskInsightService {

    static final int MAX_DUE_WINDOW_HOURS = 720;
    private static final Duration WEEK = Duration.ofDays(7);

    private final TaskRepository taskRepository;

    public TaskStatsResponse stats(Long userId) {
        Instant now = Instant.now();

        Map<TaskStatus, Long> byStatus = new EnumMap<>(TaskStatus.class);
        for (TaskStatus status : TaskStatus.values()) {
            byStatus.put(status, 0L);
        }
        taskRepository.countByStatus(userId).forEach(row -> byStatus.put(row.getStatus(), row.getTotal()));

        Map<TaskPriority, Long> openByPriority = new EnumMap<>(TaskPriority.class);
        for (TaskPriority priority : TaskPriority.values()) {
            openByPriority.put(priority, 0L);
        }
        taskRepository.countByPriorityExcludingStatus(userId, TaskStatus.DONE)
                .forEach(row -> openByPriority.put(row.getPriority(), row.getTotal()));

        long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
        long overdue = taskRepository.countByUserIdAndStatusNotAndDueDateBefore(userId, TaskStatus.DONE, now);
        long dueThisWeek = taskRepository.countByUserIdAndStatusNotAndDueDateBetween(
                userId, TaskStatus.DONE, now, now.plus(WEEK));

        return new TaskStatsResponse(total, byStatus, openByPriority, overdue, dueThisWeek);
    }

    /**
     * Tâches non terminées en retard ou arrivant à échéance dans la fenêtre donnée
     * (bornée entre 1 h et 30 jours), 20 au plus, les plus urgentes d'abord.
     */
    public List<TaskResponse> due(Long userId, int withinHours) {
        int hours = Math.clamp(withinHours, 1, MAX_DUE_WINDOW_HOURS);
        Instant limit = Instant.now().plus(Duration.ofHours(hours));
        return taskRepository
                .findTop20ByUserIdAndStatusNotAndDueDateLessThanEqualOrderByDueDateAsc(userId, TaskStatus.DONE, limit)
                .stream()
                .map(TaskMapper::toResponse)
                .toList();
    }
}
