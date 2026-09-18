-- Rappel choisi par l'utilisateur sur une tâche, et préférences de notification.
-- Les préférences valent pour tous les comptes existants dès la migration (défauts).

ALTER TABLE tasks ADD COLUMN reminder_at DATETIME(6) NULL;
CREATE INDEX idx_tasks_reminder_at ON tasks (reminder_at);

ALTER TABLE users
    ADD COLUMN notify_due_24h     BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN notify_due_1h      BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN notify_overdue     BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN notify_daily_time  BOOLEAN NOT NULL DEFAULT FALSE;
