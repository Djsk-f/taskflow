package com.taskflow.api.task;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

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
}
