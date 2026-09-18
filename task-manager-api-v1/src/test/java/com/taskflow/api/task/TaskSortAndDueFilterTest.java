package com.taskflow.api.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.taskflow.api.common.exception.ApiException;
import com.taskflow.api.task.dto.TaskFilter;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Tri métier et filtre d'échéance, exécutés par la vraie requête : priorité et statut sont
 * stockés en texte, un tri naïf serait alphabétique sans qu'aucun test unitaire ne le voie.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TaskSortAndDueFilterTest {

    private static final TaskFilter NO_FILTER = new TaskFilter(null, null, null, null);

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private User owner;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
        userRepository.deleteAll();
        owner = userRepository.save(User.builder().fullName("Sophie").email("sophie@test.local").password("hash").build());
        User other = userRepository.save(User.builder().fullName("Autre").email("autre@test.local").password("hash").build());
        Instant now = Instant.now();
        save(owner, "Sans échéance", TaskStatus.TODO, TaskPriority.HIGH, null);
        save(owner, "Retard terminé", TaskStatus.DONE, TaskPriority.LOW, now.minus(Duration.ofDays(3)));
        save(owner, "En retard", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, now.minus(Duration.ofDays(1)));
        save(owner, "Dans deux jours", TaskStatus.IN_REVIEW, TaskPriority.LOW, now.plus(Duration.ofDays(2)));
        save(owner, "Dans un mois", TaskStatus.TODO, TaskPriority.MEDIUM, now.plus(Duration.ofDays(30)));
        save(other, "Retard d'autrui", TaskStatus.TODO, TaskPriority.HIGH, now.minus(Duration.ofDays(1)));
    }

    @Test
    @DisplayName("priorité décroissante : Haute, Moyenne, Basse (et non l'ordre alphabétique)")
    void priorityFollowsBusinessOrder() {
        assertThat(priorities(search(NO_FILTER, "priority,desc")))
                .containsExactly(TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.MEDIUM,
                        TaskPriority.LOW, TaskPriority.LOW);
        assertThat(titles(search(NO_FILTER, "priority,desc")))
                .as("à priorité égale, l'échéance la plus proche d'abord")
                .containsSubsequence("En retard", "Dans un mois");
    }

    @Test
    @DisplayName("statut croissant : À faire, En cours, En revue, Terminé")
    void statusFollowsWorkflow() {
        assertThat(search(NO_FILTER, "status,asc").getContent()).extracting(Task::getStatus)
                .containsExactly(TaskStatus.TODO, TaskStatus.TODO, TaskStatus.IN_PROGRESS,
                        TaskStatus.IN_REVIEW, TaskStatus.DONE);
    }

    @Test
    @DisplayName("échéance : sans échéance puis terminées en dernier, dans les deux sens")
    void tasksWithoutDueDateAndDoneTasksComeLast() {
        assertThat(titles(search(NO_FILTER, "dueDate,asc")))
                .containsExactly("En retard", "Dans deux jours", "Dans un mois", "Sans échéance", "Retard terminé");
        assertThat(titles(search(NO_FILTER, "dueDate,desc")))
                .containsExactly("Dans un mois", "Dans deux jours", "En retard", "Sans échéance", "Retard terminé");
    }

    @Test
    @DisplayName("le tri reste stable d'une page à l'autre : chaque tâche apparaît une fois")
    void paginationNeverRepeatsOrSkips() {
        List<String> firstPage = titles(search(NO_FILTER, "priority,desc", PageRequest.of(0, 2)));
        List<String> secondPage = titles(search(NO_FILTER, "priority,desc", PageRequest.of(1, 2)));
        List<String> lastPage = titles(search(NO_FILTER, "priority,desc", PageRequest.of(2, 2)));

        assertThat(search(NO_FILTER, "priority,desc", PageRequest.of(0, 2)).getTotalElements()).isEqualTo(5);
        assertThat(firstPage).doesNotContainAnyElementsOf(secondPage).doesNotContainAnyElementsOf(lastPage);
        assertThat(secondPage).doesNotContainAnyElementsOf(lastPage);
        assertThat(firstPage.size() + secondPage.size() + lastPage.size()).isEqualTo(5);
    }

    @Test
    @DisplayName("filtre « en retard » : échéance dépassée, tâches terminées et d'autrui exclues")
    void overdueFilterMatchesDashboard() {
        var overdue = search(new TaskFilter(null, null, null, TaskDueFilter.OVERDUE), "dueDate,asc");

        assertThat(titles(overdue)).containsExactly("En retard");
        assertThat(overdue.getTotalElements())
                .as("même compte que la tuile du tableau de bord")
                .isEqualTo(taskRepository.countByUserIdAndStatusNotAndDueDateBefore(
                        owner.getId(), TaskStatus.DONE, Instant.now()));
    }

    @Test
    @DisplayName("filtre « cette semaine » : échéance dans les 7 prochains jours")
    void thisWeekFilter() {
        assertThat(titles(search(new TaskFilter(null, null, null, TaskDueFilter.THIS_WEEK), "dueDate,asc")))
                .containsExactly("Dans deux jours");
    }

    @Test
    @DisplayName("un champ de tri hors liste blanche est refusé")
    void unknownSortFieldIsRejected() {
        assertThatThrownBy(() -> TaskSort.parse("password,asc")).isInstanceOf(ApiException.class);
        assertThat(TaskSort.parse(null)).isEqualTo(TaskSort.DEFAULT);
        assertThat(TaskSort.parse("dueDate")).isEqualTo(new TaskSort(TaskSort.Field.DUE_DATE, false));
    }

    private Page<Task> search(TaskFilter filter, String sort) {
        return search(filter, sort, PageRequest.of(0, 50));
    }

    private Page<Task> search(TaskFilter filter, String sort, PageRequest page) {
        return taskRepository.findAll(TaskSpecifications.forFilter(owner.getId(), filter)
                .and(TaskSpecifications.orderedBy(TaskSort.parse(sort))), page);
    }

    private static List<String> titles(Page<Task> page) {
        return page.getContent().stream().map(Task::getTitle).toList();
    }

    private static List<TaskPriority> priorities(Page<Task> page) {
        return page.getContent().stream().map(Task::getPriority).toList();
    }

    private void save(User user, String title, TaskStatus status, TaskPriority priority, Instant dueDate) {
        taskRepository.save(Task.builder().user(user).title(title).status(status).priority(priority)
                .dueDate(dueDate).build());
    }
}
