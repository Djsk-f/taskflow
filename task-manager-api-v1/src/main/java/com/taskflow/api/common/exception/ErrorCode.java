package com.taskflow.api.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Catalogue unique des erreurs de l'API : chaque code porte son statut HTTP, ce qui
 * garantit qu'un même code ne soit jamais renvoyé avec deux statuts différents
 * (voir .brain/05-CONTRAT-API.md).
 */
@Getter
public enum ErrorCode {

    VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
    FORBIDDEN(HttpStatus.FORBIDDEN),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    EMAIL_ALREADY_USED(HttpStatus.CONFLICT),
    TASK_COMPLETED(HttpStatus.CONFLICT),
    TOO_MANY_REQUESTS(HttpStatus.TOO_MANY_REQUESTS),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }
}
