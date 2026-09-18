package com.taskflow.api.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taskflow.api.common.exception.ResourceNotFoundException;
import com.taskflow.api.task.dto.TaskRequest;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    private static final Long OWNER_ID = 7L;
    private static final Long INTRUDER_ID = 42L;
    private static final Long TASK_ID = 3L;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    @DisplayName("la tâche créée est rattachée à l'utilisateur du jeton, titre trimé et défauts appliqués")
    void createAttachesTaskToAuthenticatedUser() {
        when(userRepository.getReferenceById(OWNER_ID)).thenReturn(User.builder().id(OWNER_ID).build());
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        taskService.create(OWNER_ID, new TaskRequest("  Nouvelle tâche  ", null, null, null, null));

        ArgumentCaptor<Task> saved = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(saved.capture());
        assertThat(saved.getValue().getUser().getId()).isEqualTo(OWNER_ID);
        assertThat(saved.getValue().getTitle()).isEqualTo("Nouvelle tâche");
        assertThat(saved.getValue().getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(saved.getValue().getPriority()).isEqualTo(TaskPriority.MEDIUM);
    }

    @Test
    @DisplayName("lire la tâche d'autrui lève une introuvable, pas un accès refusé")
    void findForeignTaskThrowsNotFound() {
        when(taskRepository.findByIdAndUserId(TASK_ID, INTRUDER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.findById(TASK_ID, INTRUDER_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Tâche introuvable.");
    }

    @Test
    @DisplayName("modifier la tâche d'autrui n'écrit rien")
    void updateForeignTaskWritesNothing() {
        when(taskRepository.findByIdAndUserId(TASK_ID, INTRUDER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.update(TASK_ID, INTRUDER_ID,
                new TaskRequest("Piraté", null, null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(taskRepository, never()).saveAndFlush(any(Task.class));
    }

    @Test
    @DisplayName("supprimer la tâche d'autrui lève une introuvable quand aucune ligne n'est touchée")
    void deleteForeignTaskThrowsNotFound() {
        when(taskRepository.deleteByIdAndUserId(TASK_ID, INTRUDER_ID)).thenReturn(0L);

        assertThatThrownBy(() -> taskService.delete(TASK_ID, INTRUDER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
