package com.taskflow.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "{validation.fullName.required}")
        @Size(min = 2, max = 120, message = "{validation.fullName.size}")
        String fullName,

        @NotBlank(message = "{validation.email.required}")
        @Email(message = "{validation.email.format}")
        @Size(max = 180, message = "{validation.email.size}")
        String email,

        // 72 octets est la limite au-delà de laquelle BCrypt tronque silencieusement.
        @NotBlank(message = "{validation.password.required}")
        @Size(min = 8, max = 72, message = "{validation.password.size}")
        String password) {
}
