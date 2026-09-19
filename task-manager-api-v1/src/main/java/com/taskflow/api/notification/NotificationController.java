package com.taskflow.api.notification;

import com.taskflow.api.common.dto.PageResponse;
import com.taskflow.api.notification.dto.NotificationResponse;
import com.taskflow.api.notification.dto.UnreadCountResponse;
import com.taskflow.api.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@Tag(name = "Notifications")
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationStream notificationStream;

    @Operation(summary = "Mes notifications", description = "Les plus récentes d'abord ; `size` de 1 à 50.")
    @GetMapping
    public PageResponse<NotificationResponse> list(@CurrentUser Long userId,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size) {
        return notificationService.list(userId, page, size);
    }

    @Operation(summary = "Flux temps réel des notifications",
            description = "Server-Sent Events : un événement `notifications` dès qu'un rappel est créé. "
                    + "Le jeton passe par l'en-tête `Authorization` (client `fetch`), et l'interrogation "
                    + "régulière reste la solution de repli si le flux se coupe.")
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@CurrentUser Long userId) {
        return notificationStream.subscribe(userId);
    }

    @Operation(summary = "Nombre de notifications non lues", description = "Le badge de la cloche.")
    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@CurrentUser Long userId) {
        return new UnreadCountResponse(notificationService.unreadCount(userId));
    }

    @Operation(summary = "Marquer une notification comme lue")
    @ApiResponse(responseCode = "404", description = "Notification introuvable ou appartenant à un autre utilisateur (RESOURCE_NOT_FOUND).")
    @PatchMapping("/{notificationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@CurrentUser Long userId, @PathVariable Long notificationId) {
        notificationService.markRead(notificationId, userId);
    }

    @Operation(summary = "Tout marquer comme lu")
    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@CurrentUser Long userId) {
        notificationService.markAllRead(userId);
    }
}
