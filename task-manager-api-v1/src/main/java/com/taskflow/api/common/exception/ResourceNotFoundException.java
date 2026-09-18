package com.taskflow.api.common.exception;

public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String messageKey) {
        super(ErrorCode.RESOURCE_NOT_FOUND, messageKey);
    }
}
