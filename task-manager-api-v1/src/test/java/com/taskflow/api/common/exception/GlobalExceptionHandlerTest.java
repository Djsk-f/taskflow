package com.taskflow.api.common.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.taskflow.api.common.i18n.Messages;
import java.util.Locale;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * Le repli 500 est le seul chemin d'erreur qu'on ne peut pas provoquer depuis l'extérieur
 * en conditions normales : il est donc testé directement, pour garantir qu'il ne divulgue
 * rien du détail technique (INV-13).
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler(new Messages(messageSource()));

    /** Les vrais fichiers messages*.properties, configurés comme dans application.yml. */
    private static ResourceBundleMessageSource messageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("messages");
        source.setDefaultEncoding("UTF-8");
        source.setFallbackToSystemLocale(false);
        return source;
    }

    @AfterEach
    void resetLocale() {
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    @DisplayName("une exception inattendue devient un 500 neutre, sans détail technique")
    void unexpectedExceptionBecomesNeutral500() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/tasks");
        RuntimeException cause = new IllegalStateException("connexion JDBC perdue : jdbc:mysql://prod:3306 user=root");

        LocaleContextHolder.setLocale(Locale.FRENCH);
        ResponseEntity<ApiErrorResponse> response = handler.handleUnexpected(cause, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        ApiErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo(ErrorCode.INTERNAL_ERROR.name());
        assertThat(body.status()).isEqualTo(500);
        assertThat(body.path()).isEqualTo("/api/v1/tasks");
        assertThat(body.fieldErrors()).isNull();
        assertThat(body.message())
                .isEqualTo("Une erreur interne est survenue. Merci de réessayer plus tard.")
                .doesNotContain("JDBC", "jdbc:mysql", "root", "IllegalStateException");
    }

    @Test
    @DisplayName("une exception métier conserve son code et son statut")
    void businessExceptionKeepsItsCode() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/tasks/9");

        ResponseEntity<ApiErrorResponse> response =
                handler.handleApiException(new ResourceNotFoundException("error.task.notFound"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("RESOURCE_NOT_FOUND");
        assertThat(response.getBody().status()).isEqualTo(404);
    }

    @Test
    @DisplayName("le message suit la langue de la requête ; langue inconnue → français")
    void messageFollowsRequestLanguage() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/tasks/9");
        ResourceNotFoundException notFound = new ResourceNotFoundException("error.task.notFound");

        LocaleContextHolder.setLocale(Locale.ENGLISH);
        assertThat(handler.handleApiException(notFound, request).getBody().message()).isEqualTo("Task not found.");
        LocaleContextHolder.setLocale(Locale.FRENCH);
        assertThat(handler.handleApiException(notFound, request).getBody().message()).isEqualTo("Tâche introuvable.");
        LocaleContextHolder.setLocale(Locale.GERMAN);
        assertThat(handler.handleApiException(notFound, request).getBody().message()).isEqualTo("Tâche introuvable.");
    }

    @Test
    @DisplayName("chaque code du catalogue porte un statut cohérent")
    void everyErrorCodeCarriesItsStatus() {
        assertThat(ErrorCode.VALIDATION_ERROR.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ErrorCode.UNAUTHORIZED.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(ErrorCode.INVALID_CREDENTIALS.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(ErrorCode.FORBIDDEN.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(ErrorCode.RESOURCE_NOT_FOUND.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(ErrorCode.METHOD_NOT_ALLOWED.getStatus()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
        assertThat(ErrorCode.UNSUPPORTED_MEDIA_TYPE.getStatus()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        assertThat(ErrorCode.EMAIL_ALREADY_USED.getStatus()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(ErrorCode.INTERNAL_ERROR.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
