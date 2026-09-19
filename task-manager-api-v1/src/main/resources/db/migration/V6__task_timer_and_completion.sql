-- Chronomètre du statut « En cours » et date de passage à « Terminé ».
-- Pas de reprise des données : les tâches existantes n'ont ni chrono ni date de fin,
-- une tâche déjà terminée est donc définitive.
ALTER TABLE tasks
    ADD COLUMN timer_started_at DATETIME(6) NULL,
    ADD COLUMN completed_at     DATETIME(6) NULL;
