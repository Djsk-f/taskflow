package com.taskflow.api.auth;

import com.taskflow.api.auth.dto.AuthResponse;
import com.taskflow.api.auth.dto.LoginRequest;
import com.taskflow.api.auth.dto.RegisterRequest;
import com.taskflow.api.common.exception.ConflictException;
import com.taskflow.api.common.exception.ErrorCode;
import com.taskflow.api.common.exception.InvalidCredentialsException;
import com.taskflow.api.common.util.Emails;
import com.taskflow.api.security.JwtService;
import com.taskflow.api.user.User;
import com.taskflow.api.user.UserMapper;
import com.taskflow.api.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = Emails.normalize(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException(ErrorCode.EMAIL_ALREADY_USED, "error.email.used");
        }
        User user = userRepository.save(User.builder()
                .fullName(request.fullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .build());
        log.info("Nouvel utilisateur enregistré : id={}", user.getId());
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = Emails.normalize(request.email());
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (AuthenticationException exception) {
            // Email inconnu et mot de passe erroné donnent la même réponse (EX-02).
            throw new InvalidCredentialsException();
        }
        User user = userRepository.findByEmail(email).orElseThrow(InvalidCredentialsException::new);
        return buildAuthResponse(user);
    }

    /** Inscription et connexion renvoient exactement la même charge utile (INV-21). */
    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, "Bearer", jwtService.expiresInSeconds(), UserMapper.toResponse(user));
    }
}
