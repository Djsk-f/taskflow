package com.taskflow.api.demo;

import static org.assertj.core.api.Assertions.assertThat;

import com.taskflow.api.task.TaskRepository;
import com.taskflow.api.task.TaskSpecifications;
import com.taskflow.api.task.dto.TaskFilter;
import com.taskflow.api.timeentry.TimeEntryRepository;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserRepository;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/** Le compte de démonstration est créé une seule fois, complet, avec un mot de passe haché. */
@SpringBootTest(properties = {
        "app.demo-data.enabled=true",
        // Base dédiée : ce contexte ne partage pas ses données avec les autres tests.
        "spring.datasource.url=jdbc:h2:mem:demo;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1"
})
@ActiveProfiles("test")
class DemoDataLoaderTest {

    /** Valeur aléatoire à chaque exécution : aucun mot de passe littéral dans le dépôt. */
    static final String DEMO_PASSWORD = UUID.randomUUID().toString();

    @DynamicPropertySource
    static void demoCredentials(DynamicPropertyRegistry registry) {
        registry.add("app.demo-data.password", () -> DEMO_PASSWORD);
    }

    @Autowired
    private DemoDataLoader loader;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TimeEntryRepository timeEntryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("au démarrage : compte, 35 tâches et deux semaines de temps ; un second passage ne duplique rien")
    void seedsOnceAndOnlyOnce() {
        User demo = userRepository.findByEmail(DemoDataset.EMAIL).orElseThrow();
        assertThat(passwordEncoder.matches(DEMO_PASSWORD, demo.getPassword())).isTrue();
        assertThat(demo.getPassword()).isNotEqualTo(DEMO_PASSWORD);

        long tasks = countTasks(demo);
        int entries = timeEntryRepository.findByUserIdAndWorkDateBetweenOrderByWorkDateAscIdAsc(
                demo.getId(), LocalDate.now().minusWeeks(3), LocalDate.now().plusDays(1)).size();
        assertThat(tasks).isEqualTo(DemoDataset.TASKS.size());
        assertThat(entries).isPositive();

        loader.run(null);

        assertThat(userRepository.count()).isEqualTo(1);
        assertThat(countTasks(demo)).isEqualTo(tasks);
    }

    private long countTasks(User user) {
        return taskRepository.findAll(TaskSpecifications.forFilter(user.getId(), new TaskFilter(null, null, null, null)),
                PageRequest.of(0, 1)).getTotalElements();
    }
}
