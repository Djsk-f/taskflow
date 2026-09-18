package com.taskflow.api.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/** Modification partielle : un champ absent (null) est laissé inchangé. */
public record UpdateProfileRequest(
        @Size(min = 2, max = 120, message = "Le nom doit contenir entre 2 et 120 caractères.")
        String fullName,

        @Email(message = "Format d'email invalide.")
        @Size(max = 180, message = "L'email ne peut pas dépasser 180 caractères.")
        String email) {
}
