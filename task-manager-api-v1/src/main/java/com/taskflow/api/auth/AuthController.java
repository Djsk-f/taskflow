package com.taskflow.api.auth;

import com.taskflow.api.auth.dto.AuthResponse;
import com.taskflow.api.auth.dto.LoginRequest;
import com.taskflow.api.auth.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Authentification")
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Créer un compte", description = "Crée l'utilisateur (mot de passe haché BCrypt) et renvoie un jeton JWT et le profil.")
    @ApiResponse(responseCode = "409", description = "Email déjà utilisé (EMAIL_ALREADY_USED).")
    @SecurityRequirements
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @Operation(summary = "Se connecter", description = "Renvoie un jeton JWT valable 24 h et le profil. En cas d'échec, message générique : il ne révèle pas si l'email existe.")
    @ApiResponse(responseCode = "401", description = "Email ou mot de passe incorrect (INVALID_CREDENTIALS).")
    @SecurityRequirements
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
