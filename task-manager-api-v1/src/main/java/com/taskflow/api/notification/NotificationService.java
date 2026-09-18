package com.taskflow.api.notification;

import com.taskflow.api.common.dto.PageResponse;
import com.taskflow.api.common.exception.ResourceNotFoundException;
import com.taskflow.api.notification.dto.NotificationPreferencesDto;
import com.taskflow.api.notification.dto.NotificationResponse;
import com.taskflow.api.task.Task;
import com.taskflow.api.task.TaskPageRequests;
import com.taskflow.api.task.TaskStatus;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserRepository;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Notifications de l'utilisateur, ses préférences, et nettoyage quand une tâche change. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private static final Set<NotificationType> DUE_TYPES =
            EnumSet.of(NotificationType.DUE_IN_24H, NotificationType.DUE_IN_1H, NotificationType.OVERDUE);
    private static final Set<NotificationType> REMINDER_TYPES = EnumSet.of(NotificationType.REMINDER);
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public PageResponse<NotificationResponse> list(Long userId, int page, int size) {
        // Mêmes bornes que la liste des tâches (page ≥ 0, taille 1 à 50).
        Pageable bounds = TaskPageRequests.of(page, size);
        return PageResponse.from(
                notificationRepository.findByUserId(userId,
                        PageRequest.of(bounds.getPageNumber(), bounds.getPageSize(), NEWEST_FIRST)),
                NotificationResponse::from);
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.notification.notFound"));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllRead(userId, Instant.now());
    }

    public NotificationPreferencesDto preferences(Long userId) {
        return NotificationPreferencesDto.from(requireUser(userId).getNotificationPreferences());
    }

    @Transactional
    public NotificationPreferencesDto updatePreferences(Long userId, NotificationPreferencesDto request) {
        User user = requireUser(userId);
        user.setNotificationPreferences(request.toPreferences());
        return NotificationPreferencesDto.from(user.getNotificationPreferences());
    }

    /**
     * Appelé après chaque modification d'une tâche : un rappel qui annonce une échéance
     * (ou un rappel choisi) déplacée ou retirée serait faux, et une tâche terminée n'a plus
     * rien d'urgent.
     * Les nouveaux rappels éventuels viendront du prochain passage du générateur.
     */
    @Transactional
    public void discardObsolete(Task task) {
        notificationRepository.deleteStale(task.getId(), DUE_TYPES, task.getDueDate());
        notificationRepository.deleteStale(task.getId(), REMINDER_TYPES, task.getReminderAt());
        if (task.getStatus() == TaskStatus.DONE) {
            notificationRepository.deleteUnreadForTask(task.getId());
        }
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.notFound"));
    }
}
