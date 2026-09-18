package com.taskflow.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Le nom est obligatoire.")
        @Size(min = 2, max = 120, message = "Le nom doit contenir entre 2 et 120 caractères.")
        String fullName,

        @NotBlank(message = "L'email est obligatoire.")
        @Email(message = "Format d'email invalide.")
        @Size(max = 180, message = "L'email ne peut pas dépasser 180 caractères.")
        String email,

        // 72 octets est la limite au-delà de laquelle BCrypt tronque silencieusement.
        @NotBlank(message = "Le mot de passe est obligatoire.")
        @Size(min = 8, max = 72, message = "Le mot de passe doit contenir entre 8 et 72 caractères.")
        String password) {
}
