package com.taskflow.api.task;

import static org.assertj.core.api.Assertions.assertThat;

import com.taskflow.api.task.dto.TaskFilter;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Test le plus important du projet (risque R-04) : vérifie au niveau de la persistance
 * qu'un utilisateur ne peut ni voir, ni atteindre, ni supprimer les tâches d'un autre.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TaskRepositoryIsolationTest {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private User alice;
    private User bob;
    private Task aliceTask;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
        userRepository.deleteAll();
        alice = userRepository.save(User.builder().fullName("Alice").email("alice@test.local").password("hash").build());
        bob = userRepository.save(User.builder().fullName("Bob").email("bob@test.local").password("hash").build());
        aliceTask = taskRepository.save(Task.builder()
                .user(alice).title("Secret d'Alice").status(TaskStatus.TODO).priority(TaskPriority.HIGH).build());
        taskRepository.save(Task.builder()
                .user(bob).title("Tâche de Bob").status(TaskStatus.DONE).priority(TaskPriority.LOW).build());
    }

    @Test
    @DisplayName("le propriétaire retrouve sa tâche")
    void ownerFindsOwnTask() {
        assertThat(taskRepository.findByIdAndUserId(aliceTask.getId(), alice.getId()))
                .isPresent()
                .get()
                .extracting(Task::getTitle)
                .isEqualTo("Secret d'Alice");
    }

    @Test
    @DisplayName("un autre utilisateur ne retrouve pas la tâche : Optional vide, donc 404 côté API")
    void otherUserCannotReachTask() {
        assertThat(taskRepository.findByIdAndUserId(aliceTask.getId(), bob.getId())).isEmpty();
        assertThat(taskRepository.existsByIdAndUserId(aliceTask.getId(), bob.getId())).isFalse();
    }

    @Test
    @DisplayName("une suppression par un autre utilisateur ne supprime rien")
    void otherUserCannotDeleteTask() {
        long deleted = taskRepository.deleteByIdAndUserId(aliceTask.getId(), bob.getId());

        assertThat(deleted).isZero();
        assertThat(taskRepository.findByIdAndUserId(aliceTask.getId(), alice.getId())).isPresent();
    }

    @Test
    @DisplayName("la recherche filtrée ne renvoie que les tâches du propriétaire")
    void filteredSearchIsScopedToOwner() {
        var page = taskRepository.findAll(
                TaskSpecifications.forFilter(alice.getId(), new TaskFilter(null, null, null)),
                PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent()).extracting(Task::getTitle).containsExactly("Secret d'Alice");
    }

    @Test
    @DisplayName("même une recherche portant sur le contenu d'autrui ne fuit pas")
    void searchOnOtherUsersContentLeaksNothing() {
        var page = taskRepository.findAll(
                TaskSpecifications.forFilter(bob.getId(), new TaskFilter("Secret", null, null)),
                PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("l'audit JPA renseigne les horodatages")
    void auditingFillsTimestamps() {
        assertThat(aliceTask.getCreatedAt()).isNotNull();
        assertThat(aliceTask.getUpdatedAt()).isNotNull();
    }
}
