package com.taskflow.api.user.dto;

import java.time.Instant;

/** Profil exposé par l'API : aucun champ de mot de passe, même haché (INV-10). */
public record UserResponse(
        Long id,
        String fullName,
        String email,
        Instant createdAt) {
}
