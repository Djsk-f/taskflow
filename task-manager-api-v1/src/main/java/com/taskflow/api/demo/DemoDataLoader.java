package com.taskflow.api.demo;

import com.taskflow.api.task.Task;
import com.taskflow.api.task.TaskRepository;
import com.taskflow.api.task.TaskStatus;
import com.taskflow.api.timeentry.TimeEntry;
import com.taskflow.api.timeentry.TimeEntryRepository;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserRepository;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Compte de démonstration créé au démarrage (APP_DEMO_DATA=true) : un évaluateur voit
 * tout de suite un Kanban, des feuilles de temps et un tableau de bord remplis.
 * Idempotent : si le compte existe, rien n'est touché. Désactivé par défaut et en test.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class DemoDataLoader implements ApplicationRunner {

    private static final int[] DURATIONS = {30, 45, 60, 90, 120, 150, 180};

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final PasswordEncoder passwordEncoder;
    /** Mot de passe du compte de démo : configuration (APP_DEMO_PASSWORD), jamais dans le code. */
    private final String demoPassword;

    public DemoDataLoader(UserRepository userRepository, TaskRepository taskRepository,
                          TimeEntryRepository timeEntryRepository, PasswordEncoder passwordEncoder,
                          @Value("${app.demo-data.password}") String demoPassword) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.timeEntryRepository = timeEntryRepository;
        this.passwordEncoder = passwordEncoder;
        this.demoPassword = demoPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(DemoDataset.EMAIL)) {
            log.info("Données de démonstration déjà présentes : rien à faire.");
            return;
        }
        User user = userRepository.save(User.builder()
                .fullName(DemoDataset.FULL_NAME)
                .email(DemoDataset.EMAIL)
                .password(passwordEncoder.encode(demoPassword))
                .build());

        Instant fourPm = Instant.now().truncatedTo(ChronoUnit.DAYS).plus(Duration.ofHours(16));
        List<Task> tasks = DemoDataset.TASKS.stream()
                .map(demo -> Task.builder()
                        .user(user)
                        .title(demo.title())
                        .description(demo.description())
                        .status(demo.status())
                        .priority(demo.priority())
                        .dueDate(demo.dueInDays() == null ? null : fourPm.plus(Duration.ofDays(demo.dueInDays())))
                        .build())
                .toList();
        taskRepository.saveAll(tasks);

        int entries = seedTimeEntries(user, tasks.stream().filter(task -> task.getStatus() != TaskStatus.TODO).toList());
        log.info("Compte de démonstration créé : {} ({} tâches, {} saisies de temps).",
                DemoDataset.EMAIL, tasks.size(), entries);
    }

    /**
     * Deux semaines de saisies (jours ouvrés jusqu'à aujourd'hui), réparties de façon
     * déterministe sur les tâches commencées : la démo est identique à chaque installation.
     */
    private int seedTimeEntries(User user, List<Task> startedTasks) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).minusWeeks(1);
        int count = 0;
        for (LocalDate day = start; !day.isAfter(today); day = day.plusDays(1)) {
            if (day.getDayOfWeek() == DayOfWeek.SATURDAY || day.getDayOfWeek() == DayOfWeek.SUNDAY) {
                continue;
            }
            int perDay = 2 + day.getDayOfMonth() % 3;
            for (int slot = 0; slot < perDay; slot++) {
                int seed = day.getDayOfYear() * 7 + slot * 13;
                timeEntryRepository.save(TimeEntry.builder()
                        .user(user)
                        .task(startedTasks.get(seed % startedTasks.size()))
                        .workDate(day)
                        .durationMinutes(DURATIONS[seed % DURATIONS.length])
                        .note(DemoDataset.NOTES.get(seed % DemoDataset.NOTES.size()))
                        .build());
                count++;
            }
        }
        return count;
    }
}
