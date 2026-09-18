package com.taskflow.api.notification;

import com.taskflow.api.task.Task;
import com.taskflow.api.task.TaskStatus;
import com.taskflow.api.user.User;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crée les notifications dues à l'instant donné. Idempotent : repasser à la même minute,
 * ou juste après, ne crée rien de plus (clé d'unicité par événement). Les fenêtres sont
 * disjointes, pour qu'une tâche due dans 30 min ne reçoive pas à la fois « sous 24 h »
 * et « sous 1 h » :
 * <pre>
 *   OVERDUE         échéance dans ]maintenant − 7 j, maintenant]
 *   DUE_IN_1H       échéance dans ]maintenant, maintenant + 1 h]
 *   DUE_IN_24H      échéance dans ]maintenant + 1 h, maintenant + 24 h]
 *   REMINDER        rappel choisi dans ]maintenant − 7 j, maintenant]
 *   NO_TIME_LOGGED  jour ouvré, après l'heure réglée, aucun temps saisi ce jour
 * </pre>
 * Les rappels automatiques suivent les préférences du propriétaire de la tâche.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationGenerator {

    static final Duration HOUR = Duration.ofHours(1);
    static final Duration DAY = Duration.ofHours(24);
    /** Un retard plus ancien n'est plus une nouvelle : pas d'avalanche au premier passage. */
    static final Duration OVERDUE_LOOKBACK = Duration.ofDays(7);

    private final NotificationRepository notificationRepository;
    private final NotificationProperties properties;

    @Transactional
    public int generate(Instant now) {
        List<Notification> candidates = new ArrayList<>();
        collectDue(candidates, NotificationType.OVERDUE, now.minus(OVERDUE_LOOKBACK), now, now);
        collectDue(candidates, NotificationType.DUE_IN_1H, now, now.plus(HOUR), now);
        collectDue(candidates, NotificationType.DUE_IN_24H, now.plus(HOUR), now.plus(DAY), now);
        for (Task task : notificationRepository.findOpenTasksRemindedBetween(
                TaskStatus.DONE, now.minus(OVERDUE_LOOKBACK), now)) {
            candidates.add(forTask(task, NotificationType.REMINDER, task.getReminderAt(), now));
        }
        collectMissingTime(candidates, now);
        return saveNew(candidates);
    }

    private void collectDue(List<Notification> candidates, NotificationType type, Instant from, Instant to,
                            Instant now) {
        for (Task task : notificationRepository.findOpenTasksDueBetween(TaskStatus.DONE, from, to)) {
            if (task.getUser().getNotificationPreferences().allows(type)) {
                candidates.add(forTask(task, type, task.getDueDate(), now));
            }
        }
    }

    /** Fin de journée ouvrée sans aucun temps saisi : un rappel, une fois par jour. */
    private void collectMissingTime(List<Notification> candidates, Instant now) {
        ZonedDateTime local = now.atZone(properties.zone());
        boolean weekend = local.getDayOfWeek() == DayOfWeek.SATURDAY || local.getDayOfWeek() == DayOfWeek.SUNDAY;
        if (weekend || local.getHour() < properties.dailyTimeHour()) {
            return;
        }
        Instant subjectAt = local.toLocalDate().atTime(properties.dailyTimeHour(), 0)
                .atZone(properties.zone()).toInstant();
        for (User user : notificationRepository.findUsersWithoutTimeOn(local.toLocalDate())) {
            candidates.add(Notification.builder()
                    .user(user)
                    .type(NotificationType.NO_TIME_LOGGED)
                    .subjectAt(subjectAt)
                    .dedupKey(Notification.userDedupKey(NotificationType.NO_TIME_LOGGED, user.getId(), subjectAt))
                    .createdAt(now)
                    .build());
        }
    }

    static Notification forTask(Task task, NotificationType type, Instant subjectAt, Instant now) {
        return Notification.builder()
                .user(task.getUser())
                .task(task)
                .type(type)
                .subjectAt(subjectAt)
                .dedupKey(Notification.dedupKey(type, task.getId(), subjectAt))
                .createdAt(now)
                .build();
    }

    private int saveNew(List<Notification> candidates) {
        if (candidates.isEmpty()) {
            return 0;
        }
        Set<String> existing = notificationRepository.findExistingKeys(
                candidates.stream().map(Notification::getDedupKey).toList());
        List<Notification> fresh = candidates.stream()
                .filter(candidate -> !existing.contains(candidate.getDedupKey()))
                .toList();
        notificationRepository.saveAll(fresh);
        if (!fresh.isEmpty()) {
            log.info("{} notification(s) créée(s)", fresh.size());
        }
        return fresh.size();
    }
}
