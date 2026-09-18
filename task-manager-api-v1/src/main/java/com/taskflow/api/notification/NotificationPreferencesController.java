package com.taskflow.api.notification;

import com.taskflow.api.notification.dto.NotificationPreferencesDto;
import com.taskflow.api.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Préférences de l'utilisateur du jeton : aucune route ne vise un autre compte (INV-12). */
@RestController
@Tag(name = "Notifications")
@RequestMapping("/api/v1/users/me/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferencesController {

    private final NotificationService notificationService;

    @Operation(summary = "Mes préférences de notification")
    @GetMapping
    public NotificationPreferencesDto get(@CurrentUser Long userId) {
        return notificationService.preferences(userId);
    }

    @Operation(summary = "Modifier mes préférences de notification",
            description = "Rappels automatiques : sous 24 h, sous 1 h, retard, et saisie du temps (jours ouvrés, 17 h).")
    @PutMapping
    public NotificationPreferencesDto update(@CurrentUser Long userId,
                                             @Valid @RequestBody NotificationPreferencesDto request) {
        return notificationService.updatePreferences(userId, request);
    }
}
