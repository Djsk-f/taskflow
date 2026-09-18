package com.taskflow.api.security;

import com.taskflow.api.user.User;
import java.util.Collection;
import java.util.List;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Identité de l'appelant, unique représentation du « qui » dans l'application :
 * produite depuis la base lors du login, depuis le jeton sur les requêtes suivantes.
 * L'application n'a pas de rôles : la liste d'autorités est volontairement vide.
 */
@Getter
@RequiredArgsConstructor
public final class AuthenticatedUser implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;

    /** Identité issue de la base, avec le hachage nécessaire à la vérification du login. */
    public static AuthenticatedUser from(User user) {
        return new AuthenticatedUser(user.getId(), user.getEmail(), user.getPassword());
    }

    /** Identité issue d'un jeton validé : aucun secret à transporter. */
    public static AuthenticatedUser withoutCredentials(Long id, String email) {
        return new AuthenticatedUser(id, email, null);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getUsername() {
        return email;
    }
}
