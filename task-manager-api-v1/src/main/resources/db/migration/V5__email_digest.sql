-- Récapitulatif quotidien par e-mail (facultatif) et langue de l'utilisateur.
-- La langue est celle de l'interface au moment du réglage : les e-mails la suivent,
-- alors qu'une notification affichée est traduite à l'affichage.

ALTER TABLE users
    ADD COLUMN notify_email_digest BOOLEAN    NOT NULL DEFAULT FALSE,
    ADD COLUMN language            VARCHAR(5) NOT NULL DEFAULT 'fr';

-- Un envoi par personne et par jour, quel que soit le nombre de passages du générateur.
CREATE TABLE email_digests (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    digest_date DATE        NOT NULL,
    sent_at     DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_email_digests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_email_digests_user_date UNIQUE (user_id, digest_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
