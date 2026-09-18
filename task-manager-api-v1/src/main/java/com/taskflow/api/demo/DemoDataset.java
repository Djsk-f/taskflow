package com.taskflow.api.demo;

import com.taskflow.api.task.TaskPriority;
import com.taskflow.api.task.TaskStatus;
import java.util.List;

/**
 * Contenu du compte de démonstration. Les échéances sont exprimées en jours relatifs au
 * démarrage (null = sans échéance) : la démo reste « d'actualité » quel que soit le jour.
 */
final class DemoDataset {

    static final String FULL_NAME = "Camille Martin";
    static final String EMAIL = "camille.martin@taskflow.dev";

    record DemoTask(String title, String description, TaskStatus status, TaskPriority priority, Integer dueInDays) {
    }

    private DemoDataset() {
    }

    static final List<DemoTask> TASKS = List.of(
            task("Rédiger le cahier des charges du portail client", "Recueillir les besoins des équipes support et commerciale, puis valider le périmètre avec la direction.", TaskStatus.DONE, TaskPriority.HIGH, -6),
            task("Maquetter le tableau de bord", "Wireframes basse fidélité puis maquettes pour les vues desktop et mobile.", TaskStatus.DONE, TaskPriority.MEDIUM, -3),
            task("Mettre en place l'intégration continue", "Pipeline de build, tests et analyse statique sur chaque pull request.", TaskStatus.IN_REVIEW, TaskPriority.HIGH, 1),
            task("Revoir la charte graphique", "Harmoniser couleurs, typographies et icônes avec la nouvelle identité.", TaskStatus.IN_REVIEW, TaskPriority.MEDIUM, 2),
            task("Développer l'authentification", "Inscription, connexion par jeton et gestion du profil.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 3),
            task("Écrire les tests d'intégration de l'API", "Couvrir l'isolation des données entre utilisateurs et les cas d'erreur.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 4),
            task("Optimiser les requêtes de recherche", "Vérifier les index et éliminer les requêtes N+1 sur la liste des tâches.", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, 6),
            task("Préparer la démo client", null, TaskStatus.TODO, TaskPriority.HIGH, -1),
            task("Rédiger la documentation utilisateur", "Guide de prise en main illustré, orienté tâches courantes.", TaskStatus.TODO, TaskPriority.MEDIUM, 9),
            task("Planifier la rétrospective de sprint", "Réserver la salle et préparer le tableau des points forts et axes de progrès.", TaskStatus.TODO, TaskPriority.LOW, 5),
            task("Mettre à jour les dépendances front-end", null, TaskStatus.TODO, TaskPriority.LOW, null),
            task("Auditer l'accessibilité", "Navigation clavier, contrastes et libellés des champs sur tous les écrans.", TaskStatus.TODO, TaskPriority.MEDIUM, 12),
            task("Configurer les sauvegardes de la base", "Sauvegarde quotidienne chiffrée et test de restauration mensuel.", TaskStatus.TODO, TaskPriority.HIGH, 14),
            task("Organiser l'atelier de lancement du projet", "Réserver la salle, préparer l'ordre du jour et envoyer les invitations aux parties prenantes.", TaskStatus.DONE, TaskPriority.HIGH, -8),
            task("Valider le budget du trimestre", "Arbitrer les postes de dépenses avec la direction financière.", TaskStatus.DONE, TaskPriority.HIGH, -4),
            task("Rédiger la newsletter de septembre", "Actualités produit, portrait client et agenda des événements.", TaskStatus.IN_REVIEW, TaskPriority.MEDIUM, 1),
            task("Préparer le comité de pilotage", "Synthèse de l'avancement, risques et décisions attendues.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 2),
            task("Relancer les factures impayées", "Trois clients en retard de plus de 30 jours.", TaskStatus.TODO, TaskPriority.HIGH, -2),
            task("Mettre à jour le plan de formation", "Recenser les besoins des équipes pour le prochain semestre.", TaskStatus.TODO, TaskPriority.MEDIUM, 10),
            task("Recruter un chargé de clientèle", "Publier l'offre, trier les candidatures, organiser les entretiens.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 15),
            task("Renouveler le contrat de maintenance", "Comparer deux devis avant l'échéance du contrat actuel.", TaskStatus.TODO, TaskPriority.MEDIUM, 6),
            task("Préparer la présentation client Nova", "Démonstration des nouvelles fonctionnalités et feuille de route.", TaskStatus.IN_REVIEW, TaskPriority.HIGH, 3),
            task("Archiver les dossiers de l'année précédente", null, TaskStatus.TODO, TaskPriority.LOW, null),
            task("Analyser l'enquête de satisfaction", "Dégager les trois axes d'amélioration prioritaires.", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, 5),
            task("Planifier les congés d'automne", "Consolider les demandes et assurer la continuité de service.", TaskStatus.DONE, TaskPriority.LOW, -6),
            task("Mettre en place l'onboarding des nouveaux arrivants", "Livret d'accueil, accès aux outils et parrainage.", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, 12),
            task("Négocier le partenariat avec l'agence Horizon", null, TaskStatus.TODO, TaskPriority.MEDIUM, 18),
            task("Rédiger le compte rendu du séminaire", "Décisions, actions et responsables.", TaskStatus.DONE, TaskPriority.MEDIUM, -3),
            task("Mettre à jour le site vitrine", "Nouvelles références clients et page carrières.", TaskStatus.IN_REVIEW, TaskPriority.LOW, 7),
            task("Préparer l'inventaire du matériel", null, TaskStatus.TODO, TaskPriority.LOW, 21),
            task("Former l'équipe au nouvel outil de tickets", "Deux sessions d'une heure et un guide pratique.", TaskStatus.TODO, TaskPriority.MEDIUM, 9),
            task("Clôturer le projet Atlas", "Bilan, retour d'expérience et archivage des livrables.", TaskStatus.DONE, TaskPriority.HIGH, -10),
            task("Suivre les indicateurs commerciaux", "Tableau mensuel : chiffre d'affaires, pipeline, taux de conversion.", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, 4),
            task("Réviser les conditions générales de vente", "Relecture juridique avant publication.", TaskStatus.IN_REVIEW, TaskPriority.HIGH, -1),
            task("Organiser le déjeuner d'équipe", null, TaskStatus.TODO, TaskPriority.LOW, 8));

    static final List<String> NOTES = List.of(
            "Réunion de cadrage", "Rédaction", "Relecture", "Échanges avec le client",
            "Préparation des supports", "Analyse", "Mise à jour du document", "Point d'équipe");

    private static DemoTask task(String title, String description, TaskStatus status, TaskPriority priority,
                                 Integer dueInDays) {
        return new DemoTask(title, description, status, priority, dueInDays);
    }
}
