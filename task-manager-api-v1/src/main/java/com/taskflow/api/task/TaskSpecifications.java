package com.taskflow.api.task;

import com.taskflow.api.task.dto.TaskFilter;
import java.util.Objects;
import java.util.stream.Stream;
import org.springframework.data.jpa.domain.Specification;

/**
 * Composition des critères de recherche (ADR-009). Le prédicat de propriété est la
 * valeur initiale de la réduction : il est donc **structurellement impossible** de
 * construire un filtre de tâches qui ne soit pas restreint à son propriétaire (INV-07).
 */
public final class TaskSpecifications {

    private TaskSpecifications() {
    }

    public static Specification<Task> forFilter(Long userId, TaskFilter filter) {
        return Stream.of(matches(filter.search()), hasStatus(filter.status()), hasPriority(filter.priority()))
                .filter(Objects::nonNull)
                .reduce(ownedBy(userId), Specification::and);
    }

    public static Specification<Task> ownedBy(Long userId) {
        return (root, query, builder) -> builder.equal(root.get("user").get("id"), userId);
    }

    /** Recherche insensible à la casse sur le titre et la description (EX-08). */
    private static Specification<Task> matches(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String pattern = "%" + search.trim().toLowerCase() + "%";
        return (root, query, builder) -> builder.or(
                builder.like(builder.lower(root.get("title")), pattern),
                builder.like(builder.lower(root.get("description")), pattern));
    }

    private static Specification<Task> hasStatus(TaskStatus status) {
        return status == null ? null : (root, query, builder) -> builder.equal(root.get("status"), status);
    }

    private static Specification<Task> hasPriority(TaskPriority priority) {
        return priority == null ? null : (root, query, builder) -> builder.equal(root.get("priority"), priority);
    }
}
