package com.taskflow.api.common.exception;

import java.time.Instant;
import java.util.List;

/**
 * Corps de réponse unique de toutes les erreurs de l'API. Les fabriques statiques sont
 * le seul point de construction : le gestionnaire d'exceptions et les points d'entrée
 * de sécurité les partagent, ce qui interdit deux formats divergents.
 */
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        List<FieldError> fieldErrors) {

    public record FieldError(String field, String message) {}

    public static ApiErrorResponse of(ErrorCode code, String message, String path) {
        return new ApiErrorResponse(Instant.now(), code.getStatus().value(), code.name(), message, path, null);
    }

    /**
     * Variante où le statut HTTP est imposé par Spring MVC (méthode non autorisée, type
     * de média refusé…) : le champ `status` du corps reflète toujours le statut réel de
     * la réponse, jamais celui déduit du code.
     */
    public static ApiErrorResponse withStatus(int status, ErrorCode code, String message, String path) {
        return new ApiErrorResponse(Instant.now(), status, code.name(), message, path, null);
    }

    public static ApiErrorResponse withFieldErrors(ErrorCode code, String message, String path,
                                                   List<FieldError> fieldErrors) {
        return new ApiErrorResponse(Instant.now(), code.getStatus().value(), code.name(), message, path, fieldErrors);
    }
}
