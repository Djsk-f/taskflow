package com.taskflow.api.auth;

import com.taskflow.api.common.exception.TooManyAttemptsException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Protection contre la force brute sur la connexion : après {@code maxAttempts} échecs
 * pour un même email, toute tentative est refusée (429) jusqu'à la fin de la fenêtre,
 * même avec le bon mot de passe — sinon l'attaquant saurait qu'il a trouvé.
 *
 * <p>La clé est l'email et non l'adresse IP : derrière le proxy nginx, tous les
 * utilisateurs partagent la même IP. Contrepartie assumée : un tiers peut bloquer un
 * compte pendant la fenêtre ; l'état est en mémoire (une seule instance d'API).
 */
@Component
public class LoginAttemptGuard {

    private record Attempts(int failures, Instant windowStart) {
    }

    private static final int PURGE_THRESHOLD = 10_000;

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();
    private final int maxAttempts;
    private final Duration window;
    private final Clock clock;

    @Autowired
    public LoginAttemptGuard(@Value("${app.security.login.max-attempts:5}") int maxAttempts,
                             @Value("${app.security.login.lock-minutes:15}") long lockMinutes) {
        this(maxAttempts, Duration.ofMinutes(lockMinutes), Clock.systemUTC());
    }

    LoginAttemptGuard(int maxAttempts, Duration window, Clock clock) {
        this.maxAttempts = maxAttempts;
        this.window = window;
        this.clock = clock;
    }

    /** Refuse la tentative si l'email a épuisé ses essais dans la fenêtre en cours. */
    public void checkAllowed(String email) {
        Attempts current = attempts.get(email);
        if (current == null || current.failures() < maxAttempts) {
            return;
        }
        Duration remaining = Duration.between(clock.instant(), current.windowStart().plus(window));
        if (remaining.isNegative() || remaining.isZero()) {
            attempts.remove(email);
            return;
        }
        throw new TooManyAttemptsException(remaining.toSeconds());
    }

    public void recordFailure(String email) {
        Instant now = clock.instant();
        attempts.merge(email, new Attempts(1, now), (previous, first) ->
                previous.windowStart().plus(window).isBefore(now)
                        ? first
                        : new Attempts(previous.failures() + 1, previous.windowStart()));
        if (attempts.size() > PURGE_THRESHOLD) {
            attempts.values().removeIf(entry -> entry.windowStart().plus(window).isBefore(now));
        }
    }

    public void reset(String email) {
        attempts.remove(email);
    }
}
