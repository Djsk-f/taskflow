package com.taskflow.api.notification;

import com.taskflow.api.task.Task;
import com.taskflow.api.task.TaskStatus;
import com.taskflow.api.user.User;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.MessageSource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Récapitulatif quotidien par e-mail (sur demande, préférence « emailDigest ») : à partir
 * de l'heure réglée, un seul envoi par personne et par jour, et aucun e-mail s'il n'y a
 * rien à signaler. L'envoi échoue sans faire échouer le reste : une panne du serveur de
 * messagerie ne doit pas arrêter les rappels affichés dans l'application.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailDigestJob {

    /** Au-delà, l'e-mail deviendrait une liste illisible : le lien vers l'application prend le relais. */
    private static final int MAX_LINES = 10;

    private final EmailDigestRepository emailDigestRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final MessageSource messages;
    private final NotificationProperties properties;
    private final AppProperties appProperties;

    @Transactional
    public int sendDue(Instant now) {
        ZonedDateTime local = now.atZone(properties.zone());
        JavaMailSender sender = mailSender.getIfAvailable();
        if (!properties.email().enabled() || sender == null || local.getHour() < properties.email().hour()) {
            return 0;
        }
        LocalDate day = local.toLocalDate();
        int sent = 0;
        for (User user : emailDigestRepository.findUsersToSendOn(day)) {
            if (send(sender, user, local)) {
                sent++;
            }
        }
        return sent;
    }

    private boolean send(JavaMailSender sender, User user, ZonedDateTime local) {
        Instant endOfDay = local.toLocalDate().plusDays(1).atStartOfDay(properties.zone()).toInstant();
        List<Task> tasks = notificationRepository.findOpenTasksDueBefore(user.getId(), TaskStatus.DONE, endOfDay);
        // Trace posée même sans envoi : sinon on réessaierait à chaque passage, toutes les 30 s.
        emailDigestRepository.save(EmailDigest.builder()
                .user(user).digestDate(local.toLocalDate()).sentAt(local.toInstant()).build());
        if (tasks.isEmpty()) {
            return false;
        }
        try {
            sender.send(message(user, tasks, local));
            log.info("Récapitulatif envoyé : utilisateur={} tâches={}", user.getId(), tasks.size());
            return true;
        } catch (RuntimeException failure) {
            log.warn("Récapitulatif non envoyé : utilisateur={} cause={}", user.getId(), failure.getMessage());
            return false;
        }
    }

    private SimpleMailMessage message(User user, List<Task> tasks, ZonedDateTime local) {
        Locale locale = Locale.forLanguageTag(user.getLanguage());
        DateTimeFormatter dates = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.SHORT)
                .withLocale(locale).withZone(properties.zone());
        StringBuilder body = new StringBuilder()
                .append(text("email.digest.greeting", locale, user.getFullName())).append("\n\n")
                .append(text("email.digest.intro", locale)).append("\n\n");
        appendGroup(body, locale, dates, "email.digest.overdue",
                tasks.stream().filter(task -> task.getDueDate().isBefore(local.toInstant())).toList());
        appendGroup(body, locale, dates, "email.digest.today",
                tasks.stream().filter(task -> !task.getDueDate().isBefore(local.toInstant())).toList());
        body.append('\n').append(text("email.digest.footer", locale, appProperties.publicUrl()));

        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(properties.email().from());
        mail.setTo(user.getEmail());
        mail.setSubject(text("email.digest.subject", locale, tasks.size()));
        mail.setText(body.toString());
        return mail;
    }

    private void appendGroup(StringBuilder body, Locale locale, DateTimeFormatter dates, String titleKey,
                             List<Task> tasks) {
        if (tasks.isEmpty()) {
            return;
        }
        body.append(text(titleKey, locale)).append('\n');
        tasks.stream().limit(MAX_LINES).forEach(task ->
                body.append(text("email.digest.line", locale, task.getTitle(), dates.format(task.getDueDate())))
                        .append('\n'));
        body.append('\n');
    }

    private String text(String key, Locale locale, Object... args) {
        return messages.getMessage(key, args, locale);
    }
}
