package com.taskflow.api.common.exception;

public class ConflictException extends ApiException {

    public ConflictException(ErrorCode code, String messageKey) {
        super(code, messageKey);
    }
}
