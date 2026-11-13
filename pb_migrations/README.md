# Migrations PocketBase

Ces fichiers construisent tout le schéma d'un PocketBase neuf : PocketBase les applique
tout seul, dans l'ordre des noms de fichiers, au démarrage (dossier `pb_migrations`
posé à côté de l'exécutable, ou passé avec `--migrationsDir`).

**Version épinglée : PocketBase 0.40.6** (SDK JS `pocketbase` 0.29, compatible avec l'API
« collections / champs » introduite en 0.23). Le schéma suit le modèle de données d'`AGENTS.md`.

- `1760000000_users.js` : adapte la collection `users` (connexion par `username`, e-mail facultatif, prénom, avatar, `onboardingSeen`).
- `1760000001_data_collections.js` : `venues`, `artists`, `events`, `performances`, chacune liée à son utilisateur par des règles d'API.

Choix à connaître :

- Les dates (`startDate`, `endDate`, `day`) sont des **textes `AAAA-MM-JJ`**, pas des champs `date` PocketBase (qui stockent une heure et un fuseau). C'est le format que l'appli utilise déjà.
- `ticketPrice` est un nombre : PocketBase ne distingue pas « vide » de 0, l'appli lit 0 comme « pas de prix ».
- `ticketFile` et `photos` existent pour la phase 3 ; l'appli ne les remplit pas encore.
- Les inscriptions sont ouvertes (`createRule` de `users`) : l'appli est faite pour un usage perso, non exposée sur internet. Pour fermer les inscriptions une fois ton compte créé, mets la règle « Create » de `users` à « superusers only » dans le tableau de bord PocketBase.
