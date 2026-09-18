package com.taskflow.api.common.exception;

import com.taskflow.api.common.i18n.Messages;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.jspecify.annotations.Nullable;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Traduction unique des exceptions en réponses HTTP (INV-13). Aucun endpoint ne peut
 * répondre en dehors du format de .brain/05-CONTRAT-API.md.
 *
 * <p>La classe étend ResponseEntityExceptionHandler pour une raison précise : Spring MVC
 * lève ses propres exceptions (méthode non autorisée, type de média refusé, route
 * inconnue) avec des statuts déjà corrects. En héritant, on conserve ces statuts et on ne
 * réécrit que le corps ; un simple @ExceptionHandler(Exception.class) les aurait toutes
 * transformées en 500.
 *
 * <p>Les messages sont résolus dans la langue de la requête (Accept-Language) par
 * {@link Messages} : les exceptions ne portent que des clés.
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private final Messages messages;

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException exception,
                                                              HttpServletRequest request) {
        log.warn("{} sur {} : {}", exception.getCode(), request.getRequestURI(), exception.getMessageKey());
        String message = messages.get(exception.getMessageKey(), exception.getArgs());
        ResponseEntity.BodyBuilder response = ResponseEntity.status(exception.getCode().getStatus());
        if (exception instanceof TooManyAttemptsException tooMany) {
            response.header(HttpHeaders.RETRY_AFTER, String.valueOf(tooMany.getRetryAfterSeconds()));
        }
        return response.body(ApiErrorResponse.of(exception.getCode(), message, request.getRequestURI()));
    }

    /**
     * Valeur de paramètre incompatible avec son type, typiquement ?status=FOO.
     * Plus spécifique que le handleTypeMismatch hérité : il gagne, et il peut nommer
     * les valeurs acceptées.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException exception,
                                                               HttpServletRequest request) {
        String message = allowedValues(exception)
                .map(values -> messages.get("error.param.allowed", exception.getName(), exception.getValue(), values))
                .orElseGet(() -> messages.get("error.param.invalid", exception.getName(), exception.getValue()));
        return ResponseEntity
                .status(ErrorCode.VALIDATION_ERROR.getStatus())
                .body(ApiErrorResponse.withFieldErrors(ErrorCode.VALIDATION_ERROR, message, request.getRequestURI(),
                        List.of(new ApiErrorResponse.FieldError(exception.getName(), message))));
    }

    /** Dernier filet : toute exception non prévue devient un 500 neutre côté client. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        // Le détail reste dans les journaux du serveur : le client ne reçoit ni classe
        // d'exception, ni message technique, ni trace (INV-13).
        log.error("Erreur inattendue sur {} {}", request.getMethod(), request.getRequestURI(), exception);
        return ResponseEntity
                .status(ErrorCode.INTERNAL_ERROR.getStatus())
                .body(ApiErrorResponse.of(ErrorCode.INTERNAL_ERROR,
                        messages.get(messageKeyFor(ErrorCode.INTERNAL_ERROR)), request.getRequestURI()));
    }

    /** Erreurs de validation des corps de requête : un message par champ fautif. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException exception,
                                                                  HttpHeaders headers,
                                                                  HttpStatusCode status,
                                                                  WebRequest request) {
        List<ApiErrorResponse.FieldError> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new ApiErrorResponse.FieldError(error.getField(), error.getDefaultMessage()))
                .sorted(Comparator.comparing(ApiErrorResponse.FieldError::field))
                .toList();
        return ResponseEntity
                .status(ErrorCode.VALIDATION_ERROR.getStatus())
                .body(ApiErrorResponse.withFieldErrors(ErrorCode.VALIDATION_ERROR,
                        messages.get("error.validation"), path(request), fieldErrors));
    }

    /**
     * Point de passage de toutes les exceptions standard de Spring MVC : le statut
     * calculé par le framework est conservé, seul le corps est remplacé par le nôtre.
     */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception exception,
                                                             @Nullable Object body,
                                                             @Nullable HttpHeaders headers,
                                                             HttpStatusCode statusCode,
                                                             WebRequest request) {
        ErrorCode code = codeFor(statusCode);
        log.warn("{} sur {} : {}", statusCode, path(request), exception.getMessage());
        return ResponseEntity
                .status(statusCode)
                .body(ApiErrorResponse.withStatus(statusCode.value(), code, messages.get(messageKeyFor(code)),
                        path(request)));
    }

    private static ErrorCode codeFor(HttpStatusCode status) {
        return switch (HttpStatus.valueOf(status.value())) {
            case BAD_REQUEST -> ErrorCode.VALIDATION_ERROR;
            case UNAUTHORIZED -> ErrorCode.UNAUTHORIZED;
            case FORBIDDEN -> ErrorCode.FORBIDDEN;
            case NOT_FOUND -> ErrorCode.RESOURCE_NOT_FOUND;
            case METHOD_NOT_ALLOWED -> ErrorCode.METHOD_NOT_ALLOWED;
            case UNSUPPORTED_MEDIA_TYPE -> ErrorCode.UNSUPPORTED_MEDIA_TYPE;
            default -> status.is4xxClientError() ? ErrorCode.VALIDATION_ERROR : ErrorCode.INTERNAL_ERROR;
        };
    }

    /** Message générique d'un code d'erreur, partagé avec la chaîne de sécurité. */
    public static String messageKeyFor(ErrorCode code) {
        return "error.code." + code.name();
    }

    private static String path(WebRequest request) {
        return request instanceof ServletWebRequest servletRequest
                ? servletRequest.getRequest().getRequestURI()
                : request.getDescription(false);
    }

    private static Optional<String> allowedValues(MethodArgumentTypeMismatchException exception) {
        Class<?> required = exception.getRequiredType();
        if (required == null || !required.isEnum()) {
            return Optional.empty();
        }
        return Optional.of(Arrays.stream(required.getEnumConstants()).map(String::valueOf).collect(Collectors.joining(", ")));
    }
}
