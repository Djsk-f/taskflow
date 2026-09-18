package com.taskflow.api.task;

import com.taskflow.api.common.exception.ApiException;
import com.taskflow.api.common.exception.ErrorCode;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Construction de la pagination des tâches : plafond de taille, tri par défaut et liste
 * blanche des champs triables au même endroit (EX-11, INV-21). Un tri libre exposerait
 * des colonnes internes et permettrait des requêtes coûteuses.
 */
public final class TaskPageRequests {

    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "dueDate", "title", "priority", "status");
    private static final int MAX_SIZE = 50;
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");

    private TaskPageRequests() {
    }

    public static Pageable of(int page, int size, String sort) {
        if (page < 0) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Le numéro de page ne peut pas être négatif.");
        }
        if (size < 1) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "La taille de page doit être au moins 1.");
        }
        return PageRequest.of(page, Math.min(size, MAX_SIZE), parseSort(sort));
    }

    private static Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return DEFAULT_SORT;
        }
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        if (!SORTABLE_FIELDS.contains(field)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR,
                    "Tri impossible sur « %s ». Champs autorisés : %s."
                            .formatted(field, String.join(", ", SORTABLE_FIELDS)));
        }
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return Sort.by(direction, field);
    }
}
