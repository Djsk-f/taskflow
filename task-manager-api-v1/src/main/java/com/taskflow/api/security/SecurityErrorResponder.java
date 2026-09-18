package com.taskflow.api.security;

import com.taskflow.api.common.exception.ApiErrorResponse;
import com.taskflow.api.common.exception.ErrorCode;
import com.taskflow.api.common.exception.GlobalExceptionHandler;
import com.taskflow.api.common.i18n.Messages;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.LocaleResolver;
import tools.jackson.databind.ObjectMapper;

/**
 * Écriture des erreurs produites par la chaîne de sécurité (401 et 403), qui surviennent
 * avant les contrôleurs et échappent donc au GlobalExceptionHandler. Un seul écrivain
 * pour les deux cas : le format d'erreur de l'API reste unique (INV-13, INV-21).
 * Hors de Spring MVC, la langue n'est pas encore positionnée : on la résout ici avec le
 * même LocaleResolver que les contrôleurs.
 */
@Component
@RequiredArgsConstructor
public class SecurityErrorResponder {

    private final ObjectMapper objectMapper;
    private final Messages messages;
    private final LocaleResolver localeResolver;

    public void write(HttpServletRequest request, HttpServletResponse response, ErrorCode code) throws IOException {
        String message = messages.get(localeResolver.resolveLocale(request), GlobalExceptionHandler.messageKeyFor(code));
        response.setStatus(code.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(),
                ApiErrorResponse.of(code, message, request.getRequestURI()));
    }
}
