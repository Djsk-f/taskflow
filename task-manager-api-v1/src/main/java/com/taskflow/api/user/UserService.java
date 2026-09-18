package com.taskflow.api.user;

import com.taskflow.api.common.exception.ConflictException;
import com.taskflow.api.common.exception.ErrorCode;
import com.taskflow.api.common.exception.InvalidCredentialsException;
import com.taskflow.api.common.exception.ResourceNotFoundException;
import com.taskflow.api.common.util.Emails;
import com.taskflow.api.user.dto.ChangePasswordRequest;
import com.taskflow.api.user.dto.UpdateProfileRequest;
import com.taskflow.api.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getProfile(Long userId) {
        return UserMapper.toResponse(requireUser(userId));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = requireUser(userId);
        if (request.fullName() != null) {
            user.setFullName(request.fullName().trim());
        }
        if (request.email() != null) {
            String email = Emails.normalize(request.email());
            if (userRepository.existsByEmailAndIdNot(email, userId)) {
                throw new ConflictException(ErrorCode.EMAIL_ALREADY_USED, "Cet email est déjà utilisé.");
            }
            user.setEmail(email);
        }
        return UserMapper.toResponse(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = requireUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Le mot de passe actuel est incorrect.");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        log.info("Mot de passe modifié : id={}", userId);
    }

    /** Un seul chemin de résolution de l'utilisateur courant pour les trois opérations. */
    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
    }
}
