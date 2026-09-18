package com.taskflow.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    // Clé de test uniquement, sans valeur en production.
    private static final String TEST_SECRET =
            "dGVzdC1zZWNyZXQtdW5pcXVlbWVudC1wb3VyLWxlcy10ZXN0cy1hdS1tb2lucy0zMi1vY3RldHM=";

    private final JwtService jwtService = new JwtService(new JwtProperties(TEST_SECRET, 3_600_000));

    @Test
    @DisplayName("un jeton généré se relit et porte l'identifiant et l'email")
    void generatedTokenIsReadableBack() {
        String token = jwtService.generateToken(12L, "fidele@example.com");

        assertThat(jwtService.parse(token))
                .isPresent()
                .get()
                .satisfies(payload -> {
                    assertThat(payload.userId()).isEqualTo(12L);
                    assertThat(payload.email()).isEqualTo("fidele@example.com");
                });
    }

    @Test
    @DisplayName("un jeton altéré d'un seul caractère est rejeté")
    void tamperedTokenIsRejected() {
        String token = jwtService.generateToken(12L, "fidele@example.com");
        String tampered = token.substring(0, token.length() - 1) + (token.endsWith("A") ? "B" : "A");

        assertThat(jwtService.parse(tampered)).isEmpty();
    }

    @Test
    @DisplayName("un jeton signé avec une autre clé est rejeté")
    void tokenSignedWithAnotherKeyIsRejected() {
        JwtService otherService = new JwtService(new JwtProperties(
                "YXV0cmUtc2VjcmV0LWRlLXRlc3QtcXVpLWZhaXQtYXUtbW9pbnMtdHJlbnRlLWRldXgtb2N0ZXRz", 3_600_000));
        String foreignToken = otherService.generateToken(12L, "fidele@example.com");

        assertThat(jwtService.parse(foreignToken)).isEmpty();
    }

    @Test
    @DisplayName("un jeton expiré est rejeté")
    void expiredTokenIsRejected() throws InterruptedException {
        JwtService shortLived = new JwtService(new JwtProperties(TEST_SECRET, 1));
        String token = shortLived.generateToken(12L, "fidele@example.com");

        Thread.sleep(50);

        assertThat(shortLived.parse(token)).isEmpty();
    }

    @Test
    @DisplayName("un jeton absurde est rejeté sans lever d'exception")
    void garbageTokenIsRejected() {
        assertThat(jwtService.parse("pas-un-jeton")).isEmpty();
        assertThat(jwtService.parse("")).isEmpty();
    }

    @Test
    @DisplayName("un secret manquant empêche la construction du service, avec un message actionnable")
    void missingSecretIsRefused() {
        assertThatThrownBy(() -> new JwtService(new JwtProperties("${JWT_SECRET}", 3_600_000)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET n'est pas défini");
    }

    @Test
    @DisplayName("un secret trop court est refusé : pas de signature affaiblie")
    void tooShortSecretIsRefused() {
        assertThatThrownBy(() -> new JwtService(new JwtProperties("dHJvcC1jb3VydA==", 3_600_000)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("au moins 32 octets");
    }

    @Test
    @DisplayName("la durée de validité annoncée correspond à la configuration")
    void expiresInMatchesConfiguration() {
        assertThat(jwtService.expiresInSeconds()).isEqualTo(3_600L);
    }
}
