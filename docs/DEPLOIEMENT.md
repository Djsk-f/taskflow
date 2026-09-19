# Déploiement sur une machine, avec Docker Compose

Cette procédure met TaskFlow en ligne sur un serveur, derrière **HTTPS**, en une commande
après configuration. Elle réutilise les images du dépôt : rien n'est reconstruit à la main.

## Ce qu'il faut avant de commencer

| Élément | Détail |
|---|---|
| Une machine Linux | 2 Go de RAM au minimum (MySQL + API + interface), 10 Go de disque |
| Docker | Docker Engine 24+ et le plugin Compose (`docker compose version`) |
| Un nom de domaine | Un enregistrement **A** (et **AAAA** si IPv6) pointant vers l'IP du serveur |
| Les ports 80 et 443 ouverts | Caddy en a besoin pour obtenir le certificat et servir le site |

Le certificat HTTPS est obtenu et renouvelé automatiquement par Caddy (Let's Encrypt) :
il n'y a rien à installer ni à renouveler à la main.

## 1. Récupérer le projet et le configurer

```bash
git clone https://github.com/Djsk-f/taskflow.git
cd taskflow
cp .env.prod.example .env
```

Remplir `.env`. Les trois secrets se génèrent ainsi :

```bash
openssl rand -base64 48   # JWT_SECRET
openssl rand -base64 24   # MYSQL_PASSWORD
openssl rand -base64 24   # MYSQL_ROOT_PASSWORD
```

`DOMAIN` et `TLS_EMAIL` sont obligatoires : le démarrage s'arrête avec un message clair
s'ils manquent. L'API refuse aussi de démarrer si `JWT_SECRET` est absent ou trop court.

## 2. Démarrer

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

La première construction prend quelques minutes (compilation de l'API et de l'interface).
Vérifier ensuite :

```bash
C="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
$C ps                                                    # tous « healthy »
$C exec api wget -qO- http://localhost:8080/actuator/health   # {"status":"UP", ...}
curl -sI https://$DOMAIN | head -1                       # HTTP/2 200
```

L'état de santé n'est pas exposé publiquement : seule l'application l'est.

Puis ouvrir `https://votre-domaine` et créer un compte.

**Ce qui est exposé** : uniquement les ports **80** (redirigé vers 443) et **443**. La base
de données, l'API et l'interface ne sont joignables que depuis le réseau interne de Docker.
La boîte aux lettres de démonstration (Mailpit) n'est pas démarrée en production.

## 3. Exploitation courante

```bash
# Journaux (API seule, 100 dernières lignes, puis en continu)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=100 api

# Mise à jour après un nouveau commit
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans

# Arrêt (les données restent dans le volume)
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

Les migrations de base de données (Flyway) s'appliquent seules au démarrage de l'API.

## 4. Sauvegarde et restauration

Les données vivent dans le volume Docker `taskflow_taskflow-mysql-data`.

```bash
# Sauvegarde (à planifier, par exemple chaque nuit avec cron)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T mysql \
  mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction taskflow \
  | gzip > taskflow-$(date +%F).sql.gz

# Restauration
gunzip -c taskflow-2026-09-19.sql.gz | docker compose -f docker-compose.yml \
  -f docker-compose.prod.yml exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" taskflow
```

## 5. E-mails

Le récapitulatif quotidien reste muet tant que `APP_MAIL_ENABLED=false`. Pour l'activer,
renseigner un serveur d'envoi (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`)
puis relancer. Un envoi qui échoue est journalisé et n'interrompt ni les rappels affichés
dans l'application, ni le reste du service.

## En cas de problème

| Symptôme | Cause la plus fréquente | Vérification |
|---|---|---|
| Certificat non obtenu | Le domaine ne pointe pas encore sur le serveur, ou le port 80 est fermé | `dig +short $DOMAIN`, `logs caddy` |
| `api` reste « unhealthy » | `JWT_SECRET` absent ou trop court, ou MySQL pas encore prêt | `logs api` |
| Page blanche | Construction de l'interface interrompue (disque plein) | `df -h`, reconstruire |
| Notifications qui n'arrivent qu'au rechargement | Un proxy intermédiaire met le flux en tampon | `curl -N https://$DOMAIN/api/v1/notifications/stream` |
