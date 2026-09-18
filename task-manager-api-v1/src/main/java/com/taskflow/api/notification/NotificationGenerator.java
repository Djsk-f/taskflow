package com.taskflow.api.notification;

import com.taskflow.api.task.Task;
import com.taskflow.api.task.TaskStatus;
import java.time.Duration;
import java.time.Instant;
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
 *   OVERDUE      ]maintenant − 7 j, maintenant]
 *   DUE_IN_1H    ]maintenant, maintenant + 1 h]
 *   DUE_IN_24H   ]maintenant + 1 h, maintenant + 24 h]
 * </pre>
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

    @Transactional
    public int generate(Instant now) {
        List<Notification> candidates = new ArrayList<>();
        collectDue(candidates, NotificationType.OVERDUE, now.minus(OVERDUE_LOOKBACK), now, now);
        collectDue(candidates, NotificationType.DUE_IN_1H, now, now.plus(HOUR), now);
        collectDue(candidates, NotificationType.DUE_IN_24H, now.plus(HOUR), now.plus(DAY), now);
        return saveNew(candidates);
    }

    private void collectDue(List<Notification> candidates, NotificationType type, Instant from, Instant to,
                            Instant now) {
        for (Task task : notificationRepository.findOpenTasksDueBetween(TaskStatus.DONE, from, to)) {
            candidates.add(forTask(task, type, task.getDueDate(), now));
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
