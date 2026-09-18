package com.taskflow.api.task;

import com.taskflow.api.common.exception.ApiException;
import com.taskflow.api.common.exception.ErrorCode;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * Construction de la pagination des tâches : bornes de page et plafond de taille (EX-11).
 * Le tri n'y figure pas : il est porté par {@link TaskSort}, que la requête applique.
 */
public final class TaskPageRequests {

    private static final int MAX_SIZE = 50;

    private TaskPageRequests() {
    }

    public static Pageable of(int page, int size) {
        if (page < 0) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "error.page.negative");
        }
        if (size < 1) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "error.page.size");
        }
        return PageRequest.of(page, Math.min(size, MAX_SIZE));
    }
}
