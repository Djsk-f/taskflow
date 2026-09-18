package com.taskflow.api.task;

import com.taskflow.api.common.dto.PageResponse;
import com.taskflow.api.security.CurrentUser;
import com.taskflow.api.task.dto.TaskFilter;
import com.taskflow.api.task.dto.TaskRequest;
import com.taskflow.api.task.dto.TaskResponse;
import com.taskflow.api.task.dto.TaskStatsResponse;
import com.taskflow.api.task.dto.TaskStatusRequest;
import java.util.List;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final TaskInsightService taskInsightService;

    @GetMapping
    public PageResponse<TaskResponse> search(
            @CurrentUser Long userId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return taskService.search(userId, new TaskFilter(search, status, priority),
                TaskPageRequests.of(page, size, sort));
    }

    @GetMapping("/stats")
    public TaskStatsResponse stats(@CurrentUser Long userId) {
        return taskInsightService.stats(userId);
    }

    @GetMapping("/due")
    public List<TaskResponse> due(@CurrentUser Long userId,
                                  @RequestParam(defaultValue = "24") int withinHours) {
        return taskInsightService.due(userId, withinHours);
    }

    @GetMapping("/{taskId}")
    public TaskResponse findById(@CurrentUser Long userId, @PathVariable Long taskId) {
        return taskService.findById(taskId, userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@CurrentUser Long userId, @Valid @RequestBody TaskRequest request) {
        return taskService.create(userId, request);
    }

    @PutMapping("/{taskId}")
    public TaskResponse update(@CurrentUser Long userId, @PathVariable Long taskId,
                               @Valid @RequestBody TaskRequest request) {
        return taskService.update(taskId, userId, request);
    }

    @PatchMapping("/{taskId}/status")
    public TaskResponse updateStatus(@CurrentUser Long userId, @PathVariable Long taskId,
                                     @Valid @RequestBody TaskStatusRequest request) {
        return taskService.updateStatus(taskId, userId, request);
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUser Long userId, @PathVariable Long taskId) {
        taskService.delete(taskId, userId);
    }
}
