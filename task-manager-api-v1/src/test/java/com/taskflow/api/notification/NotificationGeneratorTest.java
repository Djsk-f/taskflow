package com.taskflow.api.notification;

import static org.assertj.core.api.Assertions.assertThat;

import com.taskflow.api.task.Task;
import com.taskflow.api.task.TaskPriority;
import com.taskflow.api.task.TaskRepository;
import com.taskflow.api.task.TaskStatus;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

/** Génération des rappels à un instant choisi : fenêtres, unicité, propriétaire, nettoyage. */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({NotificationGenerator.class, NotificationService.class})
class NotificationGeneratorTest {

    private static final Instant NOW = Instant.parse("2026-09-18T10:00:00Z");

    @Autowired
    private NotificationGenerator generator;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        taskRepository.deleteAll();
        userRepository.deleteAll();
        alice = userRepository.save(User.builder().fullName("Alice").email("alice@test.local").password("hash").build());
        bob = userRepository.save(User.builder().fullName("Bob").email("bob@test.local").password("hash").build());
    }

    @Test
    @DisplayName("chaque échéance tombe dans une seule fenêtre : retard, sous 1 h, sous 24 h")
    void windowsAreDisjoint() {
        Task overdue = task(alice, "En retard", TaskStatus.TODO, NOW.minus(Duration.ofHours(2)));
        Task soon = task(alice, "Dans 30 min", TaskStatus.IN_PROGRESS, NOW.plus(Duration.ofMinutes(30)));
        Task tomorrow = task(alice, "Dans 5 h", TaskStatus.TODO, NOW.plus(Duration.ofHours(5)));
        task(alice, "Dans 3 jours", TaskStatus.TODO, NOW.plus(Duration.ofDays(3)));
        task(alice, "Retard ancien", TaskStatus.TODO, NOW.minus(Duration.ofDays(10)));
        task(alice, "Sans échéance", TaskStatus.TODO, null);

        assertThat(generator.generate(NOW)).isEqualTo(3);

        assertThat(notificationRepository.findAll())
                .extracting(n -> n.getTask().getId(), Notification::getType)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple(overdue.getId(), NotificationType.OVERDUE),
                        org.assertj.core.groups.Tuple.tuple(soon.getId(), NotificationType.DUE_IN_1H),
                        org.assertj.core.groups.Tuple.tuple(tomorrow.getId(), NotificationType.DUE_IN_24H));
    }

    @Test
    @DisplayName("repasser ne crée aucun doublon ; le passage à « sous 1 h » crée un second rappel")
    void generationIsIdempotent() {
        task(alice, "Dans 2 h", TaskStatus.TODO, NOW.plus(Duration.ofHours(2)));

        assertThat(generator.generate(NOW)).isEqualTo(1);
        assertThat(generator.generate(NOW.plus(Duration.ofMinutes(1)))).isZero();
        assertThat(generator.generate(NOW.plus(Duration.ofMinutes(61))))
                .as("l'échéance entre dans la dernière heure")
                .isEqualTo(1);
        assertThat(generator.generate(NOW.plus(Duration.ofHours(3))))
                .as("puis elle est dépassée")
                .isEqualTo(1);
        assertThat(notificationRepository.count()).isEqualTo(3);
    }

    @Test
    @DisplayName("une tâche terminée ne notifie pas ; chaque rappel va au propriétaire de la tâche")
    void doneTasksAreSkippedAndOwnerIsTheTaskOwner() {
        task(alice, "Terminée", TaskStatus.DONE, NOW.minus(Duration.ofHours(1)));
        task(bob, "Tâche de Bob", TaskStatus.TODO, NOW.plus(Duration.ofMinutes(20)));

        generator.generate(NOW);

        assertThat(notificationService.unreadCount(alice.getId())).isZero();
        assertThat(notificationService.unreadCount(bob.getId())).isEqualTo(1);
        assertThat(notificationService.list(alice.getId(), 0, 10).content()).isEmpty();
    }

    @Test
    @DisplayName("échéance déplacée : l'ancien rappel disparaît ; tâche terminée : ses non lues aussi")
    void staleNotificationsAreDiscarded() {
        Task moved = task(alice, "Déplacée", TaskStatus.TODO, NOW.plus(Duration.ofMinutes(30)));
        Task finished = task(alice, "Finie", TaskStatus.TODO, NOW.minus(Duration.ofHours(1)));
        generator.generate(NOW);
        assertThat(notificationService.unreadCount(alice.getId())).isEqualTo(2);

        moved.setDueDate(NOW.plus(Duration.ofDays(10)).truncatedTo(ChronoUnit.SECONDS));
        notificationService.discardObsolete(taskRepository.saveAndFlush(moved));
        finished.setStatus(TaskStatus.DONE);
        notificationService.discardObsolete(taskRepository.saveAndFlush(finished));

        assertThat(notificationService.unreadCount(alice.getId())).isZero();
    }

    @Test
    @DisplayName("lu, tout lu, et liste paginée des plus récentes d'abord")
    void readStateAndOrdering() {
        task(alice, "Un", TaskStatus.TODO, NOW.plus(Duration.ofMinutes(10)));
        generator.generate(NOW);
        task(alice, "Deux", TaskStatus.TODO, NOW.plus(Duration.ofMinutes(40)));
        generator.generate(NOW.plus(Duration.ofMinutes(5)));

        var page = notificationService.list(alice.getId(), 0, 10);
        assertThat(page.content()).extracting("taskTitle").containsExactly("Deux", "Un");

        notificationService.markRead(page.content().get(0).id(), alice.getId());
        assertThat(notificationService.unreadCount(alice.getId())).isEqualTo(1);
        notificationService.markAllRead(alice.getId());
        assertThat(notificationService.unreadCount(alice.getId())).isZero();
        assertThat(notificationRepository.findByUserId(alice.getId(), PageRequest.of(0, 10)))
                .allSatisfy(n -> assertThat(n.getReadAt()).isNotNull());
    }

    private Task task(User owner, String title, TaskStatus status, Instant dueDate) {
        return taskRepository.save(Task.builder().user(owner).title(title).status(status)
                .priority(TaskPriority.MEDIUM).dueDate(dueDate).build());
    }
}
