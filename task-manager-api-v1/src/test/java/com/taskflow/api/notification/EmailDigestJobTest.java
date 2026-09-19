package com.taskflow.api.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.taskflow.api.task.Task;
import com.taskflow.api.task.TaskPriority;
import com.taskflow.api.task.TaskRepository;
import com.taskflow.api.task.TaskStatus;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

/** Récapitulatif quotidien : envoyé une fois, seulement sur demande, seulement s'il y a matière. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = {"app.notifications.email.enabled=true", "app.notifications.email.hour=7"})
class EmailDigestJobTest {

    /** Vendredi 18 septembre 2026, 9 h à Paris (après l'heure d'envoi). */
    private static final Instant MORNING = Instant.parse("2026-09-18T07:00:00Z");

    @MockitoBean
    private JavaMailSender mailSender;

    @Autowired
    private EmailDigestJob job;

    @Autowired
    private EmailDigestRepository emailDigestRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("un seul e-mail par jour, avec les tâches en retard et du jour")
    void sendsOneDigestPerDay() {
        User user = userWithDigest("digest.oui@test.local", true);
        task(user, "Relancer le client", MORNING.minus(Duration.ofDays(1)));
        task(user, "Rendre le dossier", MORNING.plus(Duration.ofHours(6)));
        task(user, "Plus tard", MORNING.plus(Duration.ofDays(4)));

        assertThat(job.sendDue(MORNING)).isEqualTo(1);
        assertThat(job.sendDue(MORNING.plus(Duration.ofHours(2)))).as("déjà servi aujourd'hui").isZero();

        ArgumentCaptor<SimpleMailMessage> sent = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(sent.capture());
        assertThat(sent.getValue().getTo()).containsExactly("digest.oui@test.local");
        assertThat(sent.getValue().getSubject()).isEqualTo("TaskFlow — 2 tâches à surveiller");
        assertThat(sent.getValue().getText())
                .contains("Relancer le client")
                .contains("Rendre le dossier")
                .doesNotContain("Plus tard");
        assertThat(emailDigestRepository.existsByUserIdAndDigestDate(user.getId(), MORNING.atZone(
                java.time.ZoneId.of("Europe/Paris")).toLocalDate())).isTrue();
    }

    @Test
    @DisplayName("rien avant l'heure, rien sans la préférence, rien sans tâche à signaler")
    void staysSilentWhenNothingToSay() {
        User optedOut = userWithDigest("digest.non@test.local", false);
        task(optedOut, "En retard mais pas demandé", MORNING.minus(Duration.ofHours(3)));
        User empty = userWithDigest("digest.vide@test.local", true);
        task(empty, "Dans dix jours", MORNING.plus(Duration.ofDays(10)));

        assertThat(job.sendDue(Instant.parse("2026-09-18T03:00:00Z"))).as("avant 7 h à Paris").isZero();
        assertThat(job.sendDue(MORNING)).isZero();
        verifyNoInteractions(mailSender);
    }

    private User userWithDigest(String email, boolean wanted) {
        User user = User.builder().fullName("Testeur").email(email).password("hash").build();
        user.getNotificationPreferences().setEmailDigest(wanted);
        return userRepository.saveAndFlush(user);
    }

    private Task task(User user, String title, Instant dueDate) {
        return taskRepository.saveAndFlush(Task.builder().user(user).title(title).status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM).dueDate(dueDate).build());
    }

    @Test
    @DisplayName("une panne du serveur de messagerie n'interrompt pas le traitement")
    void mailFailureIsContained() {
        User user = userWithDigest("digest.panne@test.local", true);
        task(user, "Tâche du jour", MORNING.plus(Duration.ofHours(2)));
        org.mockito.Mockito.doThrow(new org.springframework.mail.MailSendException("smtp down"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        assertThat(job.sendDue(MORNING)).isZero();
        verify(mailSender).send(any(SimpleMailMessage.class));
    }
}
