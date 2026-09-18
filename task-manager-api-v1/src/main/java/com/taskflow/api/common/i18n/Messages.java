package com.taskflow.api.common.i18n;

import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

/**
 * Point unique de résolution des messages renvoyés au client (messages*.properties).
 * La langue est celle de la requête (en-tête Accept-Language), le français par défaut.
 * Une clé inconnue est renvoyée telle quelle plutôt que de faire échouer la réponse.
 */
@Component
@RequiredArgsConstructor
public class Messages {

    private final MessageSource messageSource;

    /** Langue de la requête en cours, positionnée par Spring MVC. */
    public String get(String key, Object... args) {
        return get(LocaleContextHolder.getLocale(), key, args);
    }

    public String get(Locale locale, String key, Object... args) {
        return messageSource.getMessage(key, args.length == 0 ? null : args, key, locale);
    }
}
