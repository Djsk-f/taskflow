package com.taskflow.api.common.exception;

import lombok.Getter;

/**
 * Exception métier portant son code d'erreur (le statut HTTP en découle) et la clé de son
 * message : le texte est résolu dans la langue de la requête par le GlobalExceptionHandler.
 */
@Getter
public class ApiException extends RuntimeException {

    private final ErrorCode code;
    private final String messageKey;
    private final transient Object[] args;

    public ApiException(ErrorCode code, String messageKey, Object... args) {
        super(messageKey);
        this.code = code;
        this.messageKey = messageKey;
        this.args = args;
    }
}
