package com.taskflow.api.common.exception;

import lombok.Getter;

/** Exception métier portant son code d'erreur : le statut HTTP en découle (ErrorCode). */
@Getter
public class ApiException extends RuntimeException {

    private final ErrorCode code;

    public ApiException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }
}
