package com.taskflow.api.user;

import com.taskflow.api.security.CurrentUser;
import com.taskflow.api.user.dto.ChangePasswordRequest;
import com.taskflow.api.user.dto.UpdateProfileRequest;
import com.taskflow.api.user.dto.UserResponse;
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
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public UserResponse getProfile(@CurrentUser Long userId) {
        return userService.getProfile(userId);
    }

    @PatchMapping
    public UserResponse updateProfile(@CurrentUser Long userId,
                                      @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(userId, request);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@CurrentUser Long userId,
                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
    }
}
