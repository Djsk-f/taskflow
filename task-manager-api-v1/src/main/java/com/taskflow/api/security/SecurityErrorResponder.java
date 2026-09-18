package com.taskflow.api.security;

import com.taskflow.api.common.exception.ApiErrorResponse;
import com.taskflow.api.common.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Écriture des erreurs produites par la chaîne de sécurité (401 et 403), qui surviennent
 * avant les contrôleurs et échappent donc au GlobalExceptionHandler. Un seul écrivain
 * pour les deux cas : le format d'erreur de l'API reste unique (INV-13, INV-21).
 */
@Component
@RequiredArgsConstructor
public class SecurityErrorResponder {

    private final ObjectMapper objectMapper;

    public void write(HttpServletRequest request, HttpServletResponse response,
                      ErrorCode code, String message) throws IOException {
        response.setStatus(code.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(),
                ApiErrorResponse.of(code, message, request.getRequestURI()));
    }
}
