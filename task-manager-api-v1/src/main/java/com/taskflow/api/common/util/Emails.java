package com.taskflow.api.common.util;

/**
 * Normalisation unique des adresses email : tout chemin d'écriture et de recherche passe
 * par ici, sinon « Jean@X.com » et « jean@x.com » deviendraient deux comptes distincts
 * (INV-21, règle de cohérence de .brain/04-MODELE-DONNEES.md).
 */
public final class Emails {

    private Emails() {
    }

    public static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
