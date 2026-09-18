package com.taskflow.api.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /** Contrôle d'unicité lors d'un changement d'email : exclut l'utilisateur courant. */
    boolean existsByEmailAndIdNot(String email, Long id);
}
