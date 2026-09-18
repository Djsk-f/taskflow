package com.taskflow.api.security;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

/**
 * Injecte l'identifiant de l'utilisateur authentifié dans un paramètre de contrôleur.
 * Seule source autorisée de l'identité de l'appelant : jamais l'URL, jamais le corps
 * de la requête (INV-12). S'appuie sur le mécanisme standard de Spring Security, sans
 * resolver maison (INV-22).
 */
@Documented
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@AuthenticationPrincipal(expression = "id")
public @interface CurrentUser {
}
