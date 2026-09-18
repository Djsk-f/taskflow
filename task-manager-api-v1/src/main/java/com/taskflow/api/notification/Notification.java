package com.taskflow.api.notification;

import com.taskflow.api.task.Task;
import com.taskflow.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Notification d'un utilisateur. Pas d'audit automatique : la date de création est
 * l'instant de génération, fourni par le générateur (testable sans horloge réelle).
 */
@Getter
@Setter
@Builder
@Entity
@Table(name = "notifications")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    /** Tâche concernée ; supprimer la tâche supprime ses notifications (comme la migration V3). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Task task;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    /** Instant visé par la notification : l'échéance de la tâche au moment de la génération. */
    @Column(name = "subject_at", nullable = false)
    private Instant subjectAt;

    @Column(name = "dedup_key", nullable = false, length = 120)
    private String dedupKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "read_at")
    private Instant readAt;

    /** Clé d'unicité d'un événement : un même rappel n'existe qu'une fois. */
    static String dedupKey(NotificationType type, Long taskId, Instant subjectAt) {
        return type + ":" + taskId + ":" + subjectAt.getEpochSecond();
    }

    /** Événement sans tâche (rappel de saisie du temps) : unique par utilisateur et par jour. */
    static String userDedupKey(NotificationType type, Long userId, Instant subjectAt) {
        return type + ":u" + userId + ":" + subjectAt.getEpochSecond();
    }
}
