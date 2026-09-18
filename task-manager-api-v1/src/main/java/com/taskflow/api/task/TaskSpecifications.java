package com.taskflow.api.task;

import com.taskflow.api.task.dto.TaskFilter;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
        return Stream.of(matches(filter.search()), hasStatus(filter.status()), hasPriority(filter.priority()),
                        hasDue(filter.due(), Instant.now()))
                .filter(Objects::nonNull)
                .reduce(ownedBy(userId), Specification::and);
    }

    public static Specification<Task> ownedBy(Long userId) {
        return (root, query, builder) -> builder.equal(root.get("user").get("id"), userId);
    }

    /**
     * Ordre métier de la liste, avec des critères secondaires pour que deux tâches égales
     * gardent toujours le même ordre : sans cela, une tâche pourrait apparaître sur deux
     * pages, ou sur aucune. Ne filtre rien.
     */
    public static Specification<Task> orderedBy(TaskSort sort) {
        return (root, query, builder) -> {
            // La requête de comptage de la pagination n'a pas d'ordre.
            if (query != null && !Long.class.equals(query.getResultType())) {
                query.orderBy(orders(sort, root, builder));
            }
            return builder.conjunction();
        };
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

    /** Mêmes définitions que les compteurs du tableau de bord ({@link TaskInsightService#stats}). */
    private static Specification<Task> hasDue(TaskDueFilter due, Instant now) {
        if (due == null) {
            return null;
        }
        return (root, query, builder) -> {
            Path<Instant> dueDate = root.get("dueDate");
            var open = builder.notEqual(root.get("status"), TaskStatus.DONE);
            return switch (due) {
                case OVERDUE -> builder.and(open, builder.lessThan(dueDate, now));
                case THIS_WEEK -> builder.and(open, builder.between(dueDate, now, now.plus(TaskDueFilter.WEEK)));
            };
        };
    }

    private static List<Order> orders(TaskSort sort, Root<Task> root, CriteriaBuilder builder) {
        List<Order> orders = new ArrayList<>();
        switch (sort.field()) {
            case DUE_DATE -> {
                // Trier par échéance, c'est chercher ce qui presse : une tâche terminée ne
                // presse plus, même si son échéance est passée.
                orders.add(builder.asc(builder.<Integer>selectCase()
                        .when(builder.equal(root.get("status"), TaskStatus.DONE), 1).otherwise(0)));
                addDueDate(orders, root, builder, sort.ascending());
                orders.add(builder.desc(rank(builder, root.get("priority"), TaskPriority.values())));
            }
            case PRIORITY -> {
                orders.add(direction(builder, rank(builder, root.get("priority"), TaskPriority.values()), sort.ascending()));
                addDueDate(orders, root, builder, true);
            }
            case STATUS -> {
                orders.add(direction(builder, rank(builder, root.get("status"), TaskStatus.values()), sort.ascending()));
                addDueDate(orders, root, builder, true);
            }
            case TITLE -> orders.add(direction(builder, builder.lower(root.get("title")), sort.ascending()));
            case CREATED_AT -> orders.add(direction(builder, root.get("createdAt"), sort.ascending()));
        }
        orders.add(builder.desc(root.get("createdAt")));
        orders.add(builder.desc(root.get("id")));
        return orders;
    }

    /** Les tâches sans échéance viennent en dernier, quel que soit le sens du tri. */
    private static void addDueDate(List<Order> orders, Root<Task> root, CriteriaBuilder builder, boolean ascending) {
        Path<Instant> dueDate = root.get("dueDate");
        orders.add(builder.asc(builder.<Integer>selectCase().when(builder.isNull(dueDate), 1).otherwise(0)));
        orders.add(direction(builder, dueDate, ascending));
    }

    /**
     * Rang d'une valeur d'enum stockée en texte, selon son ordre de déclaration :
     * LOW &lt; MEDIUM &lt; HIGH, et TODO → IN_PROGRESS → IN_REVIEW → DONE.
     */
    private static <E extends Enum<E>> Expression<Integer> rank(CriteriaBuilder builder, Path<E> path, E[] values) {
        CriteriaBuilder.SimpleCase<E, Integer> rank = builder.selectCase(path);
        for (E value : values) {
            rank.when(value, value.ordinal());
        }
        return rank.otherwise(values.length);
    }

    private static Order direction(CriteriaBuilder builder, Expression<?> expression, boolean ascending) {
        return ascending ? builder.asc(expression) : builder.desc(expression);
    }
}
