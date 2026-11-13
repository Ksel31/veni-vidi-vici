# Veni Vidi Vici

Application personnelle auto-hébergée pour suivre ses concerts et festivals.

- **Veni** : les events à venir
- **Vidi** : l'historique des events vus, avec compte rendu (pouces, avis, setlist, accompagnants, photos souvenirs)
- **Vici** : les stats (phase ultérieure)

Chaque event garde aussi son billet : acheté ou non, prix, fichier du billet (PDF ou image).

## État du projet

**Phase 1 : prototype navigable.** Pas de backend : les données de démo vivent dans le navigateur (`localStorage`). Le parcours complet est dessiné dans des maquettes [Elyx](https://elyx.design) avant d'être codé.

Le brief complet (modèle de données, règles métier, routes, checklist de validation, phases suivantes) est dans [`AGENTS.md`](AGENTS.md).

### Où vivent les données (`PUBLIC_STORE`)

- `local` (défaut) : dans le navigateur, avec le compte `demo`. C'est le mode de la démo en ligne.
- `pocketbase` : sur un serveur [PocketBase](https://pocketbase.io) avec de vrais comptes (identifiant + mot de passe). Le schéma est dans [`pb_migrations/`](pb_migrations/README.md) (PocketBase 0.40.6).

Les variables (`PUBLIC_STORE`, `PUBLIC_POCKETBASE_URL`) sont décrites dans [`.env.example`](.env.example). Pour essayer PocketBase en local : `pocketbase serve --migrationsDir=./pb_migrations`, puis dans `.env` `PUBLIC_STORE=pocketbase` et `PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090`, puis `npm run dev`.

Pour faire tourner l'appli sur ton propre serveur (Docker, Portainer) : [`docs/deploiement-portainer.md`](docs/deploiement-portainer.md).


### Où se trouve quoi / Ajouter un champ

Pour ajouter un champ (par ex. un nouveau renseignement sur un event), on passe par ces trois endroits, **dans cet ordre** :

1. **Migration** — le champ est d’abord décrit dans le modèle de [`AGENTS.md`](AGENTS.md). Pour PocketBase, on ajoute une **nouvelle** migration dans [`pb_migrations/`](pb_migrations/README.md) (on ne modifie pas une migration déjà publiée : PocketBase l’aurait déjà appliquée). En mode `local`, pas de migration : le navigateur enregistre ce que l’adaptateur lui envoie.
2. **Adaptateur** — on ajoute le champ au type JSDoc dans `src/lib/store.js`, puis à la lecture/écriture des deux backends (`src/lib/backend/local.js` et `src/lib/backend/pocketbase.js`). L’interface commune est dans `src/lib/backend/index.js`. Les écrans n’appellent **jamais** PocketBase ni `localStorage` directement, seulement le store.
3. **Écran** — le formulaire ou l’affichage dans `src/routes/`.

Les règles métier pures (dates, « à confirmer », listes) vivent dans `src/lib/rules.js`. Les calculs de stats sont dans `src/lib/stats.js`. Les deux sont couverts par `npm test`.

## Les maquettes

Les écrans sont dans `screens/`, un fichier par écran, et assemblés dans `screens/flow.elyx` avec les flèches de navigation. Des PNG prêts à regarder sont dans [`exports/`](exports/).

| | Écran | Fichier |
|---|---|---|
| 01 | Connexion (factice) | `screens/login.elyx` |
| 02 | Accueil | `screens/home.elyx` |
| 03 | À confirmer | `screens/to-confirm.elyx` |
| 04 | Historique | `screens/history.elyx` |
| 05 | Ajout, étape 1 : concert ou festival | `screens/add-type.elyx` |
| 06 | Ajout d'un concert | `screens/add-concert.elyx` |
| 07 | Ajout d'un festival | `screens/add-festival.elyx` |
| 08 | Fiche d'un event à venir | `screens/event-upcoming.elyx` |
| 09 | Modifier l'event | `screens/event-edit.elyx` |
| 10 | Confirmer la présence (concert) | `screens/event-confirm.elyx` |
| 11 | Confirmer un festival : jours et groupes | `screens/event-festival.elyx` |
| 12 | Compte rendu, photos, billet | `screens/event-report.elyx` |

Le style (couleurs, typo, icônes, composants et leurs états) est documenté dans `screens/style-guide.elyx`.

### Structure

```
screens/      écrans et flow.elyx (le parcours complet)
components/   composants réutilisables (billet, lignes d'events, barre d'onglets, champs, boutons…)
tokens/       couleurs, polices, tailles
images/       photos de fond et logo
icons/lucide/ icônes Lucide (trait de 2 px)
fonts/        Cabinet Grotesk, Wagon
logos/        logos sources (SVG)
exports/      PNG des écrans
```

### Mettre à jour les PNG

Après une modification des maquettes, avec le CLI [`@elyx-design/cli`](https://www.npmjs.com/package/@elyx-design/cli) :

```sh
elyx render screens/home.elyx --scale 2 -o exports/06-home.png
elyx render screens/flow.elyx --scale 0.5 -o exports/00-flow.png
```

Les PNG sont numérotés dans l'ordre du parcours (`00-flow`, `01-login`, `02` à `04` l'onboarding, `05-home-empty`, `06-home`…). Les écrans à l'échelle 2, le parcours à 0.5, `style-guide.png` à 1.

## Lancer le prototype

```sh
npm install
npm run dev
npm test
```

Le code est en SvelteKit (JavaScript + JSDoc). Les routes visées sont `/login`, `/`, `/to-confirm`, `/history`, `/add`, `/add/concert`, `/add/festival`, `/event/[id]` et `/event/[id]/edit`.

## Phases suivantes

1. Prototype navigable (en cours)
2. PocketBase : vrais comptes, base SQLite, stockage de fichiers
3. Envoi réel des billets et photos, import de setlist depuis setlist.fm, stats
4. Design final, Docker (accès local + Tailscale), APK Android avec billets hors ligne
