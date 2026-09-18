package com.taskflow.api.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "{validation.currentPassword.required}")
        String currentPassword,

        @NotBlank(message = "{validation.newPassword.required}")
        @Size(min = 8, max = 72, message = "{validation.password.size}")
        String newPassword) {
}
