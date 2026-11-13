# Déployer Veni Vidi Vici sur le Pinas avec Portainer

Usage **personnel**, pas public : l'appli et PocketBase tournent chez toi, pour toi (et tes proches si tu leur ouvres des comptes). Rien ici n'est prévu pour être exposé sur internet.

> **Cette PR dépend de la PR « PocketBase » (`feat/pocketbase-store`)** : elle doit être mergée **après**. Sans elle, l'appli ne sait pas parler à PocketBase.
>
> Les fichiers Docker n'ont **pas pu être testés avec `docker compose build/up`** par leur auteur (Docker n'était pas installé sur son PC). Les étapes de build ont été rejouées à la main avec Node et PocketBase. Au premier déploiement, regarde les journaux (logs) de la stack.

## Ce qui tourne

| Service | Rôle | Port dans le conteneur | Port publié (modifiable) |
|---|---|---|---|
| `app` | l'appli (SvelteKit, serveur Node) | 3000 | `APP_PORT`, défaut 3000 |
| `pocketbase` | comptes + données (PocketBase 0.40.6, épinglé) | 8090 | `POCKETBASE_PORT`, défaut 8090 |

Le **navigateur** parle directement à PocketBase (l'appli est une application côté navigateur). Le port de PocketBase doit donc être joignable depuis tes appareils, pas seulement depuis le conteneur de l'appli.

## Variables d'environnement

À renseigner dans l'interface de la stack Portainer (section « Environment variables »), ou dans un fichier `.env` à côté du `docker-compose.yml`. Le modèle est dans [`.env.example`](../.env.example).

| Variable | Obligatoire | Rôle | Défaut |
|---|---|---|---|
| `PUBLIC_POCKETBASE_URL` | **oui** | Adresse de PocketBase **telle que ton navigateur la voit**, ex. `http://<adresse-du-pinas>:8090` | aucun (la stack refuse de démarrer sans) |
| `APP_PORT` | non | Port publié pour l'appli | `3000` |
| `POCKETBASE_PORT` | non | Port publié pour PocketBase | `8090` |

`PUBLIC_STORE=pocketbase` est déjà réglé par le `docker-compose.yml`. Les deux variables `PUBLIC_*` sont lues **au démarrage du conteneur**, pas au build : changer l'adresse de PocketBase demande de redémarrer la stack, pas de reconstruire l'image.

## Déployer comme stack Portainer depuis le dépôt GitHub

1. Dans Portainer : **Stacks → Add stack**.
2. **Build method : Repository.**
3. **Repository URL** : l'adresse du dépôt GitHub. Si le dépôt est privé, active l'authentification et renseigne un jeton d'accès.
4. **Repository reference** : la branche à déployer (par ex. `refs/heads/main` une fois les PR mergées).
5. **Compose path** : `docker-compose.yml` (à la racine).
6. Ajoute les **variables d'environnement** (au minimum `PUBLIC_POCKETBASE_URL`).
7. **Deploy the stack.** Le premier build prend quelques minutes (installation des dépendances, compilation de l'appli, téléchargement de PocketBase).
8. Ouvre `http://<adresse-du-pinas>:3000` (ou ton `APP_PORT`).

## Créer le compte admin PocketBase (une seule fois)

L'admin (« superuser ») sert à gérer PocketBase : voir les utilisateurs, réinitialiser un mot de passe, sauvegarder. Ce n'est pas ton compte dans l'appli.

**Option 1, par le navigateur.** Au tout premier démarrage, PocketBase écrit dans ses journaux une ligne qui ressemble à :

```
(!) Launch the URL below in the browser if it hasn't been open already to create your first superuser account:
http://0.0.0.0:8090/_/#/pbinstall/<jeton>
```

Dans Portainer : **Containers → pocketbase → Logs**. Ouvre ce lien en remplaçant l'adresse par celle de ton PocketBase (`http://<adresse-du-pinas>:8090/_/#/pbinstall/<jeton>`), puis choisis e-mail et mot de passe. Le lien expire au bout d'une demi-heure environ.

**Option 2, en ligne de commande** (si le lien a expiré). Dans Portainer : **Containers → pocketbase → Console** (commande `/bin/sh`), puis :

```sh
/pb/pocketbase superuser upsert ton@email.exemple ton-mot-de-passe --dir=/pb/pb_data
```

Ensuite, le tableau de bord est sur `http://<adresse-du-pinas>:8090/_/`.

## Ton compte dans l'appli

Sur l'écran de connexion, « Créer un compte » : nom d'utilisateur + mot de passe (8 caractères minimum). L'e-mail est facultatif. Si tu oublies ton mot de passe sans e-mail, c'est l'admin PocketBase qui le réinitialise depuis le tableau de bord (collection `users`).

Les inscriptions sont ouvertes à quiconque atteint l'appli. Une fois ton compte (et ceux de tes proches) créés, tu peux les fermer : tableau de bord PocketBase → **Collections → users → API rules → Create rule → « Set superusers only »**.

## Où vivent les données

Dans le **volume Docker nommé `pb_data`** (base SQLite et fichiers). Il survit aux mises à jour, au redémarrage et à la recréation de la stack. Il n'est supprimé que si tu coches « supprimer les volumes » en retirant la stack (ou avec `docker compose down -v`).

Pour sauvegarder : tableau de bord PocketBase → **Settings → Backups**, ou copie du volume.

## Mettre à jour

1. Merge les changements voulus sur la branche déployée.
2. Portainer : **Stacks → ta stack → Pull and redeploy** (coche « Re-pull image / rebuild » si proposé). Les images sont reconstruites depuis le dépôt, les migrations PocketBase (dossier `pb_migrations/`) s'appliquent au démarrage, les données ne bougent pas.

Pour changer la version de PocketBase : modifie `PB_VERSION` et les deux empreintes dans `docker/pocketbase.Dockerfile` (elles sont dans le fichier `checksums.txt` de la release), puis redéploie.

## Réseau, HTTPS

Rien n'est prévu pour internet. Si tu veux y accéder hors de chez toi (Tailscale, reverse proxy…), à brancher selon ton réseau. Une seule règle : si l'appli est servie en HTTPS, PocketBase doit l'être aussi, sinon le navigateur bloquera les appels (contenu mixte). `PUBLIC_POCKETBASE_URL` doit alors contenir l'adresse HTTPS.
