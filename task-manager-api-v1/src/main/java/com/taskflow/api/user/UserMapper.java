package com.taskflow.api.user;

import com.taskflow.api.user.dto.UserResponse;

/**
 * Conversion entité -> DTO en un seul endroit : le jour où un champ est ajouté au profil,
 * il n'y a qu'une ligne à changer (INV-21).
 */
public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getCreatedAt());
    }
}
