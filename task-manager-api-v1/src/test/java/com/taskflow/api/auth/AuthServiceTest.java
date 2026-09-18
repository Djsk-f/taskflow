package com.taskflow.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taskflow.api.auth.dto.LoginRequest;
import com.taskflow.api.auth.dto.RegisterRequest;
import com.taskflow.api.common.exception.ConflictException;
import com.taskflow.api.common.exception.InvalidCredentialsException;
import com.taskflow.api.security.JwtService;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("un email déjà utilisé est refusé et aucun compte n'est créé")
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmail("fidele@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("Fidèle", "Fidele@Example.COM", "Secret123")))
                .isInstanceOf(ConflictException.class)
                .extracting("messageKey").isEqualTo("error.email.used");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("l'inscription normalise l'email et enregistre le mot de passe haché, jamais en clair")
    void registerNormalizesEmailAndHashesPassword() {
        when(userRepository.existsByEmail("fidele@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret123")).thenReturn("$2a$10$hash-simule");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(any(), any())).thenReturn("jeton");

        authService.register(new RegisterRequest("  Fidèle Kounga  ", "  Fidele@Example.COM ", "Secret123"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("fidele@example.com");
        assertThat(saved.getValue().getFullName()).isEqualTo("Fidèle Kounga");
        assertThat(saved.getValue().getPassword()).isEqualTo("$2a$10$hash-simule").isNotEqualTo("Secret123");
    }

    @Test
    @DisplayName("des identifiants invalides donnent un message générique, sans révéler la cause")
    void loginWithBadCredentialsIsGeneric() {
        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenThrow(new BadCredentialsException("mot de passe erroné"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("fidele@example.com", "faux")))
                .isInstanceOf(InvalidCredentialsException.class)
                .extracting("messageKey").isEqualTo("error.credentials.invalid");
    }
}
