package com.taskflow.api.task;

import com.taskflow.api.common.exception.ConflictException;
import com.taskflow.api.common.exception.ErrorCode;
import com.taskflow.api.common.i18n.Messages;
import com.taskflow.api.notification.NotificationProperties;
import com.taskflow.api.timeentry.TimeEntry;
import com.taskflow.api.timeentry.TimeEntryRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Règles d'un changement de statut :
 * - « En cours » lance un chrono ; en sortir enregistre le temps écoulé dans la feuille ;
 * - « Terminé » est définitif, sauf annulation juste après (toast « Annuler »).
 */
@Component
@RequiredArgsConstructor
public class TaskLifecycle {

    /** Le toast d'annulation dure 8 s ; marge pour le réseau. */
    static final Duration UNDO_WINDOW = Duration.ofSeconds(15);
    /** Plafond d'une saisie de temps (contrainte de la table time_entries). */
    static final int MAX_MINUTES = 1440;

    private final TimeEntryRepository timeEntryRepository;
    private final NotificationProperties notificationProperties;
    private final Messages messages;

    /** À appeler une fois le nouveau statut posé sur la tâche ; `previous` est null à la création. */
    public void apply(Task task, TaskStatus previous, Instant now) {
        TaskStatus next = task.getStatus();
        if (previous == next) {
            return;
        }
        if (previous == TaskStatus.DONE && !undoable(task, now)) {
            throw new ConflictException(ErrorCode.TASK_COMPLETED, "error.task.completed");
        }
        if (previous == TaskStatus.IN_PROGRESS) {
            recordTimer(task, now);
        }
        task.setTimerStartedAt(next == TaskStatus.IN_PROGRESS ? now : null);
        task.setCompletedAt(next == TaskStatus.DONE ? now : null);
    }

    private static boolean undoable(Task task, Instant now) {
        return task.getCompletedAt() != null && !now.isAfter(task.getCompletedAt().plus(UNDO_WINDOW));
    }

    private void recordTimer(Task task, Instant now) {
        if (task.getTimerStartedAt() == null) {
            return;
        }
        long minutes = Math.round(Duration.between(task.getTimerStartedAt(), now).toSeconds() / 60.0);
        if (minutes < 1) {
            return;
        }
        int recorded = (int) Math.min(minutes, MAX_MINUTES);
        timeEntryRepository.save(TimeEntry.builder()
                .user(task.getUser())
                .task(task)
                .workDate(LocalDate.ofInstant(now, notificationProperties.zone()))
                .durationMinutes(recorded)
                .note(messages.get("time.auto.note"))
                .build());
        // Total calculé par la base à la lecture : on l'ajuste pour la réponse en cours.
        int spent = task.getTimeSpentMinutes() == null ? 0 : task.getTimeSpentMinutes();
        task.setTimeSpentMinutes(spent + recorded);
    }
}
