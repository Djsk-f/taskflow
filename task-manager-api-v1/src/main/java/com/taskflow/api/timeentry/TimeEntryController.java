package com.taskflow.api.timeentry;

import com.taskflow.api.security.CurrentUser;
import com.taskflow.api.timeentry.dto.TimeEntryRequest;
import com.taskflow.api.timeentry.dto.TimeEntryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Feuilles de temps")
@RequiredArgsConstructor
public class TimeEntryController {

    private final TimeEntryService timeEntryService;

    /** Saisies d'une période (feuille de la semaine), du jour le plus ancien au plus récent. */
    @Operation(summary = "Saisies d'une période", description = "Dates `AAAA-MM-JJ`, 62 jours au plus, du plus ancien au plus récent.")
    @ApiResponse(responseCode = "400", description = "Période invalide (VALIDATION_ERROR).")
    @GetMapping("/api/v1/time-entries")
    public List<TimeEntryResponse> findBetween(
            @CurrentUser Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return timeEntryService.findBetween(userId, from, to);
    }

    @Operation(summary = "Saisies d'une tâche", description = "Les plus récentes d'abord.")
    @GetMapping("/api/v1/tasks/{taskId}/time-entries")
    public List<TimeEntryResponse> findForTask(@CurrentUser Long userId, @PathVariable Long taskId) {
        return timeEntryService.findForTask(taskId, userId);
    }

    @Operation(summary = "Saisir du temps", description = "`durationMinutes` de 1 à 1440, `note` de 500 caractères au plus.")
    @ApiResponse(responseCode = "404", description = "Tâche introuvable ou appartenant à un autre utilisateur (RESOURCE_NOT_FOUND).")
    @PostMapping("/api/v1/time-entries")
    @ResponseStatus(HttpStatus.CREATED)
    public TimeEntryResponse create(@CurrentUser Long userId, @Valid @RequestBody TimeEntryRequest request) {
        return timeEntryService.create(userId, request);
    }

    @Operation(summary = "Modifier une saisie")
    @PutMapping("/api/v1/time-entries/{entryId}")
    public TimeEntryResponse update(@CurrentUser Long userId, @PathVariable Long entryId,
                                    @Valid @RequestBody TimeEntryRequest request) {
        return timeEntryService.update(entryId, userId, request);
    }

    @Operation(summary = "Supprimer une saisie")
    @DeleteMapping("/api/v1/time-entries/{entryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUser Long userId, @PathVariable Long entryId) {
        timeEntryService.delete(entryId, userId);
    }
}
