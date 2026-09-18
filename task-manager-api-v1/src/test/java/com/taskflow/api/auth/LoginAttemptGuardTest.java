package com.taskflow.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.taskflow.api.common.exception.TooManyAttemptsException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LoginAttemptGuardTest {

    private static final String EMAIL = "cible@test.local";

    /** Horloge qu'on avance à la main : l'expiration se teste sans attendre. */
    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-09-18T10:00:00Z");

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    private final MutableClock clock = new MutableClock();
    private final LoginAttemptGuard guard = new LoginAttemptGuard(5, Duration.ofMinutes(15), clock);

    private void fail(int times) {
        for (int i = 0; i < times; i++) {
            guard.checkAllowed(EMAIL);
            guard.recordFailure(EMAIL);
        }
    }

    @Test
    @DisplayName("5 échecs : la tentative suivante est refusée, avec le délai restant")
    void locksAfterMaxFailures() {
        fail(5);

        assertThatThrownBy(() -> guard.checkAllowed(EMAIL))
                .isInstanceOf(TooManyAttemptsException.class)
                .satisfies(error -> assertThat(((TooManyAttemptsException) error).getRetryAfterSeconds())
                        .isEqualTo(15 * 60));
        assertThatCode(() -> guard.checkAllowed("autre@test.local")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("la fenêtre écoulée, le compte est de nouveau accessible")
    void unlocksAfterWindow() {
        fail(5);
        clock.advance(Duration.ofMinutes(15).plusSeconds(1));

        assertThatCode(() -> guard.checkAllowed(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("une connexion réussie remet le compteur à zéro")
    void successResetsCounter() {
        fail(4);
        guard.reset(EMAIL);
        fail(4);

        assertThatCode(() -> guard.checkAllowed(EMAIL)).doesNotThrowAnyException();
    }
}
