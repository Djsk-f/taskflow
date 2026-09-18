package com.taskflow.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Génération et lecture des jetons d'accès (HS256).
 * Format : sub = identifiant utilisateur, claim « email », iat, exp.
 * Aucune révocation ni rafraîchissement : choix assumé et documenté (ADR-007).
 */
@Slf4j
@Service
public class JwtService {

    private static final int MIN_KEY_BYTES = 32;
    private static final String EMAIL_CLAIM = "email";

    private final SecretKey signingKey;
    private final Duration expiration;

    public JwtService(JwtProperties properties) {
        this.signingKey = Keys.hmacShaKeyFor(decodeSecret(properties.secret()));
        this.expiration = Duration.ofMillis(properties.expirationMs());
    }

    public String generateToken(Long userId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(EMAIL_CLAIM, email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(signingKey)
                .compact();
    }

    /** Jeton absent, expiré, altéré ou mal formé : Optional vide, aucune exception propagée. */
    public Optional<TokenPayload> parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(new TokenPayload(Long.valueOf(claims.getSubject()), claims.get(EMAIL_CLAIM, String.class)));
        } catch (JwtException | IllegalArgumentException exception) {
            log.debug("Jeton rejeté : {}", exception.getMessage());
            return Optional.empty();
        }
    }

    public long expiresInSeconds() {
        return expiration.toSeconds();
    }

    /**
     * Le secret est attendu en base64 (openssl rand -base64 48). Un secret trop court
     * rendrait la signature HS256 attaquable : l'application refuse alors de démarrer,
     * plutôt que de fonctionner avec une sécurité de façade.
     */
    private static byte[] decodeSecret(String secret) {
        // Cas le plus fréquent en exploitation : la variable d'environnement n'est pas
        // fournie et la valeur reste le placeholder brut. Le dire explicitement évite
        // d'envoyer l'exploitant chercher un problème d'encodage qui n'existe pas.
        if (secret == null || secret.isBlank() || secret.startsWith("${")) {
            throw new IllegalStateException(
                    "JWT_SECRET n'est pas défini. Renseigner la variable d'environnement "
                            + "(voir .env.example) avec une valeur générée par : openssl rand -base64 48");
        }
        byte[] key;
        try {
            key = Decoders.BASE64.decode(secret);
        } catch (DecodingException exception) {
            throw new IllegalStateException(
                    "JWT_SECRET doit être encodé en base64. Générer une valeur avec : openssl rand -base64 48", exception);
        }
        if (key.length < MIN_KEY_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET doit contenir au moins %d octets décodés (%d trouvés). Générer : openssl rand -base64 48"
                            .formatted(MIN_KEY_BYTES, key.length));
        }
        return key;
    }

    public record TokenPayload(Long userId, String email) {
    }
}
