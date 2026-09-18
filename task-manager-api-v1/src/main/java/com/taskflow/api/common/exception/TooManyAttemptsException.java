package com.taskflow.api.common.exception;

import lombok.Getter;

/** Trop de tentatives de connexion : 429, avec le délai d'attente (en-tête Retry-After). */
@Getter
public class TooManyAttemptsException extends ApiException {

    private final long retryAfterSeconds;

    public TooManyAttemptsException(long retryAfterSeconds) {
        super(ErrorCode.TOO_MANY_REQUESTS, "error.login.locked", Math.max(1, (retryAfterSeconds + 59) / 60));
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
