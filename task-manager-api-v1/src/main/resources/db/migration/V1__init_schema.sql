-- Schéma initial TaskFlow (voir .brain/04-MODELE-DONNEES.md)
-- Hibernate est en ddl-auto=validate : ce fichier est la seule autorité sur le schéma.

CREATE TABLE users (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    full_name   VARCHAR(120) NOT NULL,
    email       VARCHAR(180) NOT NULL,
    password    VARCHAR(100) NOT NULL,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE tasks (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    user_id     BIGINT        NOT NULL,
    title       VARCHAR(150)  NOT NULL,
    description VARCHAR(2000) NULL,
    status      VARCHAR(20)   NOT NULL DEFAULT 'TODO',
    priority    VARCHAR(20)   NOT NULL DEFAULT 'MEDIUM',
    due_date    DATETIME(6)   NULL,
    created_at  DATETIME(6)   NOT NULL,
    updated_at  DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tous les index sont préfixés par user_id : aucune requête de l'application ne lit
-- les tâches sans filtrer sur le propriétaire (INV-07).
CREATE INDEX idx_tasks_user_created  ON tasks (user_id, created_at);
CREATE INDEX idx_tasks_user_status   ON tasks (user_id, status);
CREATE INDEX idx_tasks_user_priority ON tasks (user_id, priority);
