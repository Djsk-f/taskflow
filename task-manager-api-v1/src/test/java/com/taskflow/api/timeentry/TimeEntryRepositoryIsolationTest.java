package com.taskflow.api.timeentry;

import static org.assertj.core.api.Assertions.assertThat;

import com.taskflow.api.task.Task;
import com.taskflow.api.task.TaskPriority;
import com.taskflow.api.task.TaskRepository;
import com.taskflow.api.task.TaskStatus;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;

/** Isolation des feuilles de temps au niveau de la persistance, comme pour les tâches (R-04). */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TimeEntryRepositoryIsolationTest {

    private static final LocalDate MONDAY = LocalDate.of(2026, 9, 14);

    @Autowired
    private TimeEntryRepository timeEntryRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    private User alice;
    private User bob;
    private Task aliceTask;
    private TimeEntry aliceEntry;

    @BeforeEach
    void setUp() {
        alice = userRepository.save(User.builder().fullName("Alice").email("alice.time@test.local").password("hash").build());
        bob = userRepository.save(User.builder().fullName("Bob").email("bob.time@test.local").password("hash").build());
        aliceTask = taskRepository.save(Task.builder()
                .user(alice).title("Rapport").status(TaskStatus.IN_PROGRESS).priority(TaskPriority.HIGH).build());
        Task bobTask = taskRepository.save(Task.builder()
                .user(bob).title("Tâche de Bob").status(TaskStatus.TODO).priority(TaskPriority.LOW).build());
        aliceEntry = timeEntryRepository.save(entry(alice, aliceTask, MONDAY, 90));
        timeEntryRepository.save(entry(alice, aliceTask, MONDAY.plusDays(2), 30));
        timeEntryRepository.save(entry(bob, bobTask, MONDAY, 480));
    }

    private static TimeEntry entry(User user, Task task, LocalDate day, int minutes) {
        return TimeEntry.builder().user(user).task(task).workDate(day).durationMinutes(minutes).build();
    }

    @Test
    @DisplayName("la feuille d'une semaine ne contient que les saisies du propriétaire")
    void weekIsScopedToOwner() {
        assertThat(timeEntryRepository.findByUserIdAndWorkDateBetweenOrderByWorkDateAscIdAsc(
                alice.getId(), MONDAY, MONDAY.plusDays(6)))
                .extracting(TimeEntry::getDurationMinutes).containsExactly(90, 30);
        assertThat(timeEntryRepository.findByUserIdAndWorkDateBetweenOrderByWorkDateAscIdAsc(
                bob.getId(), MONDAY, MONDAY.plusDays(6)))
                .extracting(TimeEntry::getDurationMinutes).containsExactly(480);
    }

    @Test
    @DisplayName("Bob ne peut ni lire, ni supprimer une saisie d'Alice, ni lister le temps de sa tâche")
    void otherUserCannotReachEntries() {
        assertThat(timeEntryRepository.findByIdAndUserId(aliceEntry.getId(), bob.getId())).isEmpty();
        assertThat(timeEntryRepository.deleteByIdAndUserId(aliceEntry.getId(), bob.getId())).isZero();
        assertThat(timeEntryRepository.findByTaskIdAndUserIdOrderByWorkDateDescIdDesc(aliceTask.getId(), bob.getId()))
                .isEmpty();
        assertThat(timeEntryRepository.findByIdAndUserId(aliceEntry.getId(), alice.getId())).isPresent();
    }

    @Test
    @DisplayName("le temps total d'une tâche est calculé par la base, et supprimer la tâche supprime ses saisies")
    void taskTotalIsComputedAndDeletionCascades() {
        entityManager.flush();
        entityManager.clear();

        assertThat(taskRepository.findByIdAndUserId(aliceTask.getId(), alice.getId()))
                .get().extracting(Task::getTimeSpentMinutes).isEqualTo(120);

        taskRepository.deleteByIdAndUserId(aliceTask.getId(), alice.getId());
        entityManager.flush();
        entityManager.clear();

        assertThat(timeEntryRepository.findByUserIdAndWorkDateBetweenOrderByWorkDateAscIdAsc(
                alice.getId(), MONDAY, MONDAY.plusDays(6))).isEmpty();
    }
}
