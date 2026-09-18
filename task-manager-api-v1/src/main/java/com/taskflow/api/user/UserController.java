package com.taskflow.api.user;

import com.taskflow.api.security.CurrentUser;
import com.taskflow.api.user.dto.ChangePasswordRequest;
import com.taskflow.api.user.dto.UpdateProfileRequest;
import com.taskflow.api.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Profil de l'utilisateur connecté. Aucune route ne prend d'identifiant : l'API ne
 * permet pas de désigner un autre utilisateur que soi (INV-12).
 */
@RestController
@Tag(name = "Profil")
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "Lire mon profil")
    @GetMapping
    public UserResponse getProfile(@CurrentUser Long userId) {
        return userService.getProfile(userId);
    }

    @Operation(summary = "Modifier mon nom ou mon email")
    @ApiResponse(responseCode = "409", description = "Email déjà utilisé (EMAIL_ALREADY_USED).")
    @PatchMapping
    public UserResponse updateProfile(@CurrentUser Long userId,
                                      @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(userId, request);
    }

    @Operation(summary = "Changer mon mot de passe", description = "Exige le mot de passe actuel.")
    @ApiResponse(responseCode = "401", description = "Mot de passe actuel incorrect (INVALID_CREDENTIALS).")
    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@CurrentUser Long userId,
                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
    }
}
