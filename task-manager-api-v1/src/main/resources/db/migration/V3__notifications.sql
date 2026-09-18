-- Notifications : rappels générés par le serveur (échéances proches, retards).
-- dedup_key identifie l'événement (type, tâche, instant visé) : la contrainte d'unicité
-- garantit qu'un rappel n'est jamais créé deux fois, même si la génération repasse.

CREATE TABLE notifications (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    task_id     BIGINT       NULL,
    type        VARCHAR(30)  NOT NULL,
    subject_at  DATETIME(6)  NOT NULL,
    dedup_key   VARCHAR(120) NOT NULL,
    created_at  DATETIME(6)  NOT NULL,
    read_at     DATETIME(6)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    CONSTRAINT uk_notifications_user_dedup UNIQUE (user_id, dedup_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at);
CREATE INDEX idx_notifications_user_read    ON notifications (user_id, read_at);
CREATE INDEX idx_tasks_due_date             ON tasks (due_date);
