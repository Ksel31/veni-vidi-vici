# Migrations PocketBase

Ces fichiers construisent tout le schéma d'un PocketBase neuf : PocketBase les applique
tout seul, dans l'ordre des noms de fichiers, au démarrage (dossier `pb_migrations`
posé à côté de l'exécutable, ou passé avec `--migrationsDir`). Le dossier voisin `pb_hooks/` (`--hooksDir`) contient un petit script lu à chaque démarrage.

**Version épinglée : PocketBase 0.40.6** (SDK JS `pocketbase` 0.29, compatible avec l'API
« collections / champs » introduite en 0.23). Le schéma suit le modèle de données d'`AGENTS.md`.

- `1760000000_users.js` : adapte la collection `users` (connexion par `username`, e-mail facultatif, prénom, avatar, `onboardingSeen`).
- `1760000001_data_collections.js` : `venues`, `artists`, `events`, `performances`, chacune liée à son utilisateur par des règles d'API.
- `1760000002_close_signups.js` : ferme les inscriptions publiques (`users.createRule = null`, réservé à l'admin).

Choix à connaître :

- Les dates (`startDate`, `endDate`, `day`) sont des **textes `AAAA-MM-JJ`**, pas des champs `date` PocketBase (qui stockent une heure et un fuseau). C'est le format que l'appli utilise déjà.
- `ticketPrice` est un nombre non requis : `null` = prix non renseigné, `0` = gratuit (affiché « Gratuit »). L'appli garde la différence.
- `ticketFile` et `photos` existent pour la phase 3 ; l'appli ne les remplit pas encore.
- Les inscriptions sont **fermées** : l'admin crée les comptes dans le tableau de bord PocketBase (collection `users` → « New record »). Pour les rouvrir : `VVV_INSCRIPTIONS_OUVERTES=true` côté PocketBase (le hook `pb_hooks/inscriptions.pb.js` règle la règle « Create » au démarrage) **et** `PUBLIC_INSCRIPTIONS_OUVERTES=true` côté appli (affiche le formulaire), puis redémarrer les deux. Sans hook, on peut aussi vider la règle « Create » de `users` à la main dans le tableau de bord.
