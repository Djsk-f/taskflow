package com.taskflow.api.task;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Toutes les signatures sont scopées par propriétaire (INV-07) : le code métier n'a
 * aucune raison d'accéder à une tâche par son seul identifiant. Les méthodes héritées
 * findById/deleteById existent mais leur usage est proscrit et détecté par
 * scripts/brain-check.sh.
 */
public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    Optional<Task> findByIdAndUserId(Long id, Long userId);

    long deleteByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);

    // --- Agrégats (tableau de bord, notifications) : scopés eux aussi par propriétaire ---

    /** Projection de comptage : le repository ne connaît aucun DTO. */
    interface StatusCount {
        TaskStatus getStatus();

        long getTotal();
    }

    interface PriorityCount {
        TaskPriority getPriority();

        long getTotal();
    }

    @Query("select t.status as status, count(t) as total from Task t "
            + "where t.user.id = :userId group by t.status")
    List<StatusCount> countByStatus(@Param("userId") Long userId);

    @Query("select t.priority as priority, count(t) as total from Task t "
            + "where t.user.id = :userId and t.status <> :excluded group by t.priority")
    List<PriorityCount> countByPriorityExcludingStatus(@Param("userId") Long userId,
                                                       @Param("excluded") TaskStatus excluded);

    long countByUserIdAndStatusNotAndDueDateBefore(Long userId, TaskStatus excluded, Instant instant);

    long countByUserIdAndStatusNotAndDueDateBetween(Long userId, TaskStatus excluded, Instant from, Instant to);

    /** Échéances passées ou imminentes, les plus urgentes d'abord ; sans échéance = exclue. */
    List<Task> findTop20ByUserIdAndStatusNotAndDueDateLessThanEqualOrderByDueDateAsc(
            Long userId, TaskStatus excluded, Instant limit);
}
