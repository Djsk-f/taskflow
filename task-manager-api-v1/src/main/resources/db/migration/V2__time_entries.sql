-- Feuilles de temps : saisies de temps passé sur une tâche.
-- user_id est redondant avec tasks.user_id à dessein : toutes les lectures filtrent sur
-- le propriétaire directement, comme pour les tâches (INV-07), sans jointure obligatoire.

CREATE TABLE time_entries (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          BIGINT       NOT NULL,
    task_id          BIGINT       NOT NULL,
    work_date        DATE         NOT NULL,
    duration_minutes INT          NOT NULL,
    note             VARCHAR(500) NULL,
    created_at       DATETIME(6)  NOT NULL,
    updated_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_time_entries_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_time_entries_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    CONSTRAINT ck_time_entries_duration CHECK (duration_minutes BETWEEN 1 AND 1440)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_time_entries_user_date ON time_entries (user_id, work_date);
CREATE INDEX idx_time_entries_task      ON time_entries (task_id);
