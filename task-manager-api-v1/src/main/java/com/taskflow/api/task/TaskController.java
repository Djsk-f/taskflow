package com.taskflow.api.task;

import com.taskflow.api.common.dto.PageResponse;
import com.taskflow.api.security.CurrentUser;
import com.taskflow.api.task.dto.TaskFilter;
import com.taskflow.api.task.dto.TaskRequest;
import com.taskflow.api.task.dto.TaskResponse;
import com.taskflow.api.task.dto.TaskStatsResponse;
import com.taskflow.api.task.dto.TaskStatusRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Tâches")
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final TaskInsightService taskInsightService;

    @Operation(summary = "Lister, rechercher, filtrer et paginer mes tâches", description = "`search` porte sur le titre et la description (insensible à la casse) ; `due` = `OVERDUE` (en retard) ou `THIS_WEEK` (à rendre sous 7 jours), tâches terminées exclues ; `size` est plafonné à 50. `sort` = `createdAt`, `dueDate`, `title`, `priority` ou `status`, suivi de `,asc` ou `,desc` (défaut `createdAt,desc`) : priorité et statut suivent leur ordre métier, les tâches sans échéance viennent toujours en dernier (et, triées par échéance, les terminées aussi).")
    @ApiResponse(responseCode = "400", description = "Paramètre invalide : statut, priorité, échéance, page ou tri inconnus (VALIDATION_ERROR).")
    @GetMapping
    public PageResponse<TaskResponse> search(
            @CurrentUser Long userId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) TaskDueFilter due,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return taskService.search(userId, new TaskFilter(search, status, priority, due),
                TaskSort.parse(sort), TaskPageRequests.of(page, size));
    }

    @Operation(summary = "Statistiques du tableau de bord", description = "Totaux par statut, tâches ouvertes par priorité, en retard et à rendre sous 7 jours.")
    @GetMapping("/stats")
    public TaskStatsResponse stats(@CurrentUser Long userId) {
        return taskInsightService.stats(userId);
    }

    @Operation(summary = "Échéances à surveiller", description = "Tâches non terminées en retard ou à échéance dans la fenêtre `withinHours` (1 à 720), 20 au plus, les plus urgentes d'abord.")
    @GetMapping("/due")
    public List<TaskResponse> due(@CurrentUser Long userId,
                                  @RequestParam(defaultValue = "24") int withinHours) {
        return taskInsightService.due(userId, withinHours);
    }

    @Operation(summary = "Lire une tâche")
    @GetMapping("/{taskId}")
    public TaskResponse findById(@CurrentUser Long userId, @PathVariable Long taskId) {
        return taskService.findById(taskId, userId);
    }

    @Operation(summary = "Créer une tâche", description = "Rattachée d'office à l'utilisateur du jeton. Statut `TODO` et priorité `MEDIUM` par défaut.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@CurrentUser Long userId, @Valid @RequestBody TaskRequest request) {
        return taskService.create(userId, request);
    }

    @Operation(summary = "Modifier une tâche", description = "Remplace tous les champs modifiables.")
    @PutMapping("/{taskId}")
    public TaskResponse update(@CurrentUser Long userId, @PathVariable Long taskId,
                               @Valid @RequestBody TaskRequest request) {
        return taskService.update(taskId, userId, request);
    }

    @Operation(summary = "Changer le statut", description = "Ne modifie que le statut : c'est l'action du glisser-déposer du Kanban.")
    @PatchMapping("/{taskId}/status")
    public TaskResponse updateStatus(@CurrentUser Long userId, @PathVariable Long taskId,
                                     @Valid @RequestBody TaskStatusRequest request) {
        return taskService.updateStatus(taskId, userId, request);
    }

    @Operation(summary = "Supprimer une tâche", description = "Supprime aussi ses saisies de temps.")
    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUser Long userId, @PathVariable Long taskId) {
        taskService.delete(taskId, userId);
    }
}
