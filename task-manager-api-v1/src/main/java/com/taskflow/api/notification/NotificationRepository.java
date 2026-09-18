package com.taskflow.api.notification;

import com.taskflow.api.task.Task;
import com.taskflow.api.task.TaskStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Comme pour les tâches (INV-07), toute lecture ou écriture d'un utilisateur est scopée
 * par propriétaire. Seul le générateur parcourt les tâches de tous les utilisateurs, et
 * rattache chaque notification au propriétaire de la tâche.
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = "task")
    Page<Notification> findByUserId(Long userId, Pageable pageable);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndReadAtIsNull(Long userId);

    /** Mise à jour groupée hors du cache d'Hibernate : il est vidé pour ne pas relire l'ancien état. */
    @Modifying(clearAutomatically = true)
    @Query("update Notification n set n.readAt = :now where n.user.id = :userId and n.readAt is null")
    int markAllRead(@Param("userId") Long userId, @Param("now") Instant now);

    /** Tâches non terminées dont l'échéance tombe dans ]from, to], tous utilisateurs confondus. */
    @Query("select t from Task t where t.status <> :done and t.dueDate > :from and t.dueDate <= :to")
    List<Task> findOpenTasksDueBetween(@Param("done") TaskStatus done, @Param("from") Instant from,
                                       @Param("to") Instant to);

    /** Parmi ces clés, celles qui existent déjà : une seule requête pour tout un passage. */
    @Query("select n.dedupKey from Notification n where n.dedupKey in :keys")
    Set<String> findExistingKeys(@Param("keys") Collection<String> keys);

    /** Rappels d'échéance devenus faux : l'échéance de la tâche a changé ou a été retirée. */
    @Modifying
    @Query("delete from Notification n where n.task.id = :taskId and n.type in :types "
            + "and (:dueDate is null or n.subjectAt <> :dueDate)")
    int deleteStale(@Param("taskId") Long taskId, @Param("types") Collection<NotificationType> types,
                    @Param("dueDate") Instant dueDate);

    /** Une tâche terminée n'a plus rien d'urgent : ses notifications non lues disparaissent. */
    @Modifying
    @Query("delete from Notification n where n.task.id = :taskId and n.readAt is null")
    int deleteUnreadForTask(@Param("taskId") Long taskId);
}
