package com.taskflow.api.timeentry;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Comme pour les tâches (INV-07), toutes les signatures sont scopées par propriétaire.
 * Le titre de la tâche est chargé avec la saisie (EntityGraph) : pas de requête par ligne.
 */
public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {

    @EntityGraph(attributePaths = "task")
    List<TimeEntry> findByUserIdAndWorkDateBetweenOrderByWorkDateAscIdAsc(Long userId, LocalDate from, LocalDate to);

    @EntityGraph(attributePaths = "task")
    List<TimeEntry> findByTaskIdAndUserIdOrderByWorkDateDescIdDesc(Long taskId, Long userId);

    @EntityGraph(attributePaths = "task")
    Optional<TimeEntry> findByIdAndUserId(Long id, Long userId);

    long deleteByIdAndUserId(Long id, Long userId);
}
