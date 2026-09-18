package com.taskflow.api.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/** Modification partielle : un champ absent (null) est laissé inchangé. */
public record UpdateProfileRequest(
        @Size(min = 2, max = 120, message = "{validation.fullName.size}")
        String fullName,

        @Email(message = "{validation.email.format}")
        @Size(max = 180, message = "{validation.email.size}")
        String email) {
}
