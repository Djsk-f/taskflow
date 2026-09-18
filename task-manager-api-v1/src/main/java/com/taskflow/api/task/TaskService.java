package com.taskflow.api.task;

import com.taskflow.api.common.dto.PageResponse;
import com.taskflow.api.common.exception.ResourceNotFoundException;
import com.taskflow.api.task.dto.TaskFilter;
import com.taskflow.api.task.dto.TaskRequest;
import com.taskflow.api.task.dto.TaskResponse;
import com.taskflow.api.task.dto.TaskStatusRequest;
import com.taskflow.api.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Règles métier des tâches. Chaque opération est bornée au propriétaire : aucune méthode
 * de ce service n'accepte une tâche sans son utilisateur (INV-07).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public PageResponse<TaskResponse> search(Long userId, TaskFilter filter, TaskSort sort, Pageable pageable) {
        return PageResponse.from(
                taskRepository.findAll(
                        TaskSpecifications.forFilter(userId, filter).and(TaskSpecifications.orderedBy(sort)),
                        pageable),
                TaskMapper::toResponse);
    }

    public TaskResponse findById(Long taskId, Long userId) {
        return TaskMapper.toResponse(requireOwnedTask(taskId, userId));
    }

    @Transactional
    public TaskResponse create(Long userId, TaskRequest request) {
        // Référence paresseuse : rattacher le propriétaire ne nécessite pas de le charger,
        // et la clé étrangère garantit l'intégrité.
        Task task = TaskMapper.toEntity(request, userRepository.getReferenceById(userId));
        Task saved = taskRepository.save(task);
        log.info("Tâche créée : id={} utilisateur={}", saved.getId(), userId);
        return TaskMapper.toResponse(saved);
    }

    @Transactional
    public TaskResponse update(Long taskId, Long userId, TaskRequest request) {
        Task task = requireOwnedTask(taskId, userId);
        TaskMapper.applyTo(request, task);
        // saveAndFlush et non save : l'horodatage d'audit est écrit par Hibernate au flush.
        // Sans flush explicite, la réponse renverrait l'updatedAt d'avant la modification.
        return TaskMapper.toResponse(taskRepository.saveAndFlush(task));
    }

    /** Changement de statut seul (glisser-déposer du Kanban) : les autres champs sont intacts. */
    @Transactional
    public TaskResponse updateStatus(Long taskId, Long userId, TaskStatusRequest request) {
        Task task = requireOwnedTask(taskId, userId);
        task.setStatus(request.status());
        return TaskMapper.toResponse(taskRepository.saveAndFlush(task));
    }

    @Transactional
    public void delete(Long taskId, Long userId) {
        if (taskRepository.deleteByIdAndUserId(taskId, userId) == 0) {
            throw taskNotFound();
        }
        log.info("Tâche supprimée : id={} utilisateur={}", taskId, userId);
    }

    /** Unique chemin d'accès à une tâche : lecture, modification et suppression le partagent. */
    private Task requireOwnedTask(Long taskId, Long userId) {
        return taskRepository.findByIdAndUserId(taskId, userId).orElseThrow(TaskService::taskNotFound);
    }

    /**
     * Tâche inexistante et tâche appartenant à autrui donnent la même réponse : 404, et
     * non 403, pour ne rien révéler de l'existence des données d'un autre (INV-08).
     */
    private static ResourceNotFoundException taskNotFound() {
        return new ResourceNotFoundException("error.task.notFound");
    }
}
