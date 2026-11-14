# Déployer Veni Vidi Vici sur le Pinas avec Portainer

Usage **personnel**, pas public : l'appli et PocketBase tournent chez toi, pour toi (et tes proches si tu leur ouvres des comptes). Rien ici n'est prévu pour être exposé sur internet.

> **Cette PR dépend de la PR « PocketBase » (`feat/pocketbase-store`)** : elle doit être mergée **après**. Sans elle, l'appli ne sait pas parler à PocketBase.
>
> Les fichiers Docker n'ont **pas pu être testés avec `docker compose`** par leur auteur (Docker n'était pas installé sur son PC).

## Ce qui tourne

| Service | Image | Rôle | Port publié (modifiable) |
|---|---|---|---|
| `app` | `ghcr.io/ksel31/veni-vidi-vici:latest` | l'appli (SvelteKit, serveur Node) | `APP_PORT`, défaut 3000 |
| `pocketbase` | `ghcr.io/ksel31/veni-vidi-vici-pocketbase:latest` | comptes + données (PocketBase **0.40.6**, épinglé dans l'image, plus les migrations du dépôt) | `POCKETBASE_PORT`, défaut 8090 |

Les images sont construites et publiées **automatiquement** par un GitHub Action (`.github/workflows/publish-images.yml`) à chaque push sur `main`. Le Pinas **ne construit rien** : il tire ces images. Les migrations PocketBase sont déjà dans l'image et s'appliquent toutes seules au démarrage : rien à faire dans l'interface d'admin pour le schéma.

Le **navigateur** parle directement à PocketBase (l'appli est une application côté navigateur). Le port de PocketBase doit donc être joignable depuis tes appareils, pas seulement depuis le conteneur de l'appli.

### Paquets GHCR : public ou login Portainer

Le dépôt GitHub est public, mais un paquet GHCR est souvent **privé par défaut** à la première publication. Au choix, le plus simple d'abord :

1. Dans GitHub : **Packages**, ouvre `veni-vidi-vici` et `veni-vidi-vici-pocketbase`, et rends-les **publics**. Portainer pourra alors tirer les images sans compte.
2. Sinon, dans Portainer : **Registries → Add registry → GitHub**, avec ton compte GitHub et un jeton qui a le droit `read:packages`.

Les images n'existent qu'**après** le premier passage de l'Action sur `main` (juste après le merge de cette PR). Attends qu'elle soit verte dans l'onglet Actions du dépôt avant de déployer.

## Variables d'environnement

À renseigner dans l'interface de la stack Portainer (section « Environment variables »), ou dans un fichier `.env` à côté du `docker-compose.yml`. Le modèle est dans [`.env.example`](../.env.example). Rien d'autre à éditer à la main.

| Variable | Obligatoire | Rôle | Défaut |
|---|---|---|---|
| `PUBLIC_POCKETBASE_URL` | **oui** | Adresse de PocketBase **telle que ton navigateur la voit**, ex. `http://<adresse-du-pinas>:8090` | aucun (la stack refuse de démarrer sans) |
| `APP_PORT` | non | Port publié pour l'appli | `3000` |
| `POCKETBASE_PORT` | non | Port publié pour PocketBase | `8090` |
| `INSCRIPTIONS_OUVERTES` | non | `true` pour que n'importe qui puisse créer un compte depuis l'appli (voir [Rouvrir les inscriptions](#rouvrir-les-inscriptions)) | `false` : l'admin crée les comptes |

`PUBLIC_STORE=pocketbase` est déjà réglé par le `docker-compose.yml`. Les variables `PUBLIC_*` sont lues **au démarrage du conteneur**, pas au build : changer l'adresse de PocketBase demande de redémarrer la stack, pas de toucher à l'image.

## Déployer comme stack Portainer depuis le dépôt GitHub

1. Vérifie que l'Action **« Publier les images »** a bien tourné sur `main` (onglet Actions de GitHub) et, si besoin, que les paquets GHCR sont publics ou que Portainer a un login registry (voir plus haut).
2. Dans Portainer : **Stacks → Add stack**.
3. **Build method : Repository.**
4. **Repository URL** : l'adresse du dépôt GitHub.
5. **Repository reference** : `refs/heads/main` (une fois les PR mergées).
6. **Compose path** : `docker-compose.yml` (à la racine).
7. Ajoute les **variables d'environnement** (au minimum `PUBLIC_POCKETBASE_URL`).
8. **Deploy the stack.** Portainer tire les images GHCR : pas de compilation sur le Pinas.
9. Ouvre `http://<adresse-du-pinas>:3000` (ou ton `APP_PORT`).

## Premier lancement : créer le superuser PocketBase (une seule fois)

Le superuser (l'« admin ») gère PocketBase : il crée les comptes, réinitialise un mot de passe, fait les sauvegardes. Ce n'est **pas** un compte de l'appli. Tant qu'il n'existe pas, personne ne peut créer de compte (les inscriptions sont fermées).

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

## Créer les comptes (c'est l'admin qui s'en charge)

Les inscriptions publiques sont **fermées** : sur l'écran « Créer un compte », l'appli affiche « Les inscriptions sont fermées. Demande un compte à l'admin. ». Pour créer le tien et ceux de tes proches :

1. Ouvre le tableau de bord (`http://<adresse-du-pinas>:8090/_/`) et connecte-toi en superuser.
2. **Collections → users → New record.**
3. Renseigne **username** (l'identifiant de connexion), **password** et **passwordConfirm** (8 caractères minimum). Le prénom et l'e-mail sont facultatifs ; **verified** n'a pas d'effet ici.
4. **Create.** La personne se connecte ensuite sur l'appli avec ce nom d'utilisateur et ce mot de passe.

Si quelqu'un oublie son mot de passe : même écran, ouvre son compte dans `users`, change le mot de passe. Sans e-mail dans le profil, il n'y a pas d'autre moyen de le réinitialiser, et l'appli n'envoie aucun e-mail.

## Rouvrir les inscriptions

Utile seulement pour laisser des proches se créer un compte eux-mêmes. À éviter si l'appli est joignable depuis internet.

1. Dans Portainer, ajoute la variable **`INSCRIPTIONS_OUVERTES=true`** à la stack.
2. **Update the stack** (ou « Pull and redeploy »). La variable est transmise à PocketBase (au démarrage, il ouvre la règle « Create » de `users`) **et** à l'appli (qui affiche le formulaire). Les deux doivent redémarrer : le redéploiement s'en charge.

Pour refermer : remets `false` (ou retire la variable) et redéploie ; PocketBase referme la règle au démarrage.

Sans passer par la variable, tu peux aussi agir sur PocketBase seul : **Collections → users → API rules → Create rule**, champ vide pour ouvrir ou « Set superusers only » pour fermer. Mais l'appli, elle, continuera d'afficher « inscriptions fermées » tant que `INSCRIPTIONS_OUVERTES` n'est pas `true`, et PocketBase remettra la règle selon la variable à son prochain redémarrage : la variable reste le moyen simple.

## Où vivent les données

Dans le **volume Docker nommé `pb_data`** (base SQLite et fichiers). Il survit aux mises à jour, au redémarrage et à la recréation de la stack. Il n'est supprimé que si tu coches « supprimer les volumes » en retirant la stack (ou avec `docker compose down -v`).

Dans Portainer, le volume peut apparaître précédé du nom de la stack (par ex. `nomdelastack_pb_data`). Tu le retrouves dans **Volumes**.

## Mettre à jour

Une fois les changements mergés sur `main`, l'Action publie de nouvelles images (tag `latest`). Ensuite, **rien d'autre que** :

1. Dans Portainer : **Stacks → ta stack → Pull and redeploy** (coche « Re-pull image » si proposé).
2. Les nouvelles images sont tirées, les migrations s'appliquent au démarrage si le schéma a changé, les données du volume `pb_data` ne bougent pas.

Pas besoin de reconstruire quoi que ce soit sur le Pinas, ni de modifier le compose, ni de passer par l'interface d'admin pour le schéma.

Pour changer la version de PocketBase elle-même : modifier `PB_VERSION` (et les empreintes) dans `docker/pocketbase.Dockerfile` **et** la variable `PB_VERSION` du workflow, merger sur `main`, puis même geste : pull + redéployer.

## Sauvegarder pb_data

Deux façons, au choix.

**Depuis le tableau de bord PocketBase** (la plus simple) : **Settings → Backups**. Tu crées une sauvegarde et tu la télécharges. Pour restaurer : le même écran, « restore ».

**Copie du volume** (sur le Pinas, en SSH). Remplace `NOM_DU_VOLUME` par le nom réel vu dans Portainer → Volumes (souvent `nomdelastack_pb_data`) :

```sh
# Sauvegarder dans le dossier courant
docker run --rm -v NOM_DU_VOLUME:/data -v "$(pwd)":/backup alpine tar czf /backup/pb_data-$(date +%Y%m%d).tar.gz -C /data .

# Restaurer (arrête d'abord la stack)
docker run --rm -v NOM_DU_VOLUME:/data -v "$(pwd)":/backup alpine tar xzf /backup/pb_data-AAAAMMJJ.tar.gz -C /data
```

Garde cette archive hors du Pinas (autre disque, autre machine) si tu tiens à pouvoir tout récupérer.

## Réseau, HTTPS

Rien n'est prévu pour internet. Si tu veux y accéder hors de chez toi (Tailscale, reverse proxy…), à brancher selon ton réseau.

**Accès distant (Tailscale).** Le navigateur parle directement à PocketBase. Si `PUBLIC_POCKETBASE_URL` contient l'IP locale du Pinas, la connexion échoue depuis l'extérieur (« Le serveur ne répond pas »). Mets simplement `PUBLIC_POCKETBASE_URL=:8090` : l'adresse de PocketBase est alors celle de la page ouverte, sur le port 8090. Ça marche avec l'IP locale, l'IP Tailscale ou le nom de machine, sans rien changer d'un cas à l'autre. Redémarre la stack après le changement. Le port 8090 doit aussi être joignable via Tailscale (rien à ouvrir de plus si Tailscale tourne sur le Pinas). Une seule règle : si l'appli est servie en HTTPS, PocketBase doit l'être aussi, sinon le navigateur bloquera les appels (contenu mixte). `PUBLIC_POCKETBASE_URL` doit alors contenir l'adresse HTTPS.
