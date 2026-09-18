package com.taskflow.api.common.exception;

public class InvalidCredentialsException extends ApiException {

    /**
     * Message volontairement générique : ne pas révéler si c'est l'email ou le mot de
     * passe qui est faux (pas d'énumération de comptes, cf. EX-02).
     */
    public InvalidCredentialsException() {
        super(ErrorCode.INVALID_CREDENTIALS, "error.credentials.invalid");
    }

    public InvalidCredentialsException(String messageKey) {
        super(ErrorCode.INVALID_CREDENTIALS, messageKey);
    }
}
