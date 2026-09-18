package com.taskflow.api.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Configuration JWT lue depuis l'environnement (INV-09). Aucune valeur par défaut pour
 * le secret : si JWT_SECRET est absent, le démarrage échoue au lieu de signer les jetons
 * avec une clé connue de tous.
 */
@Validated
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        @NotBlank String secret,
        @Positive long expirationMs) {
}
