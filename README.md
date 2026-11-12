# Veni Vidi Vici

Application personnelle auto-hébergée pour suivre ses concerts et festivals.

- **Veni** : les events à venir
- **Vidi** : l'historique des events vus, avec compte rendu (pouces, avis, setlist, accompagnants, photos souvenirs)
- **Vici** : les stats (phase ultérieure)

Chaque event garde aussi son billet : acheté ou non, prix, fichier du billet (PDF ou image).

## État du projet

**Phase 1 : prototype navigable.** Pas de backend : les données de démo vivent dans le navigateur (`localStorage`). Le parcours complet est dessiné dans des maquettes [Elyx](https://elyx.design) avant d'être codé.

Le brief complet (modèle de données, règles métier, routes, checklist de validation, phases suivantes) est dans [`AGENTS.md`](AGENTS.md).

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
elyx render screens/home.elyx --scale 2 -o exports/02-home.png
elyx render screens/flow.elyx --scale 0.5 -o exports/00-flow.png
```

## Lancer le prototype

```sh
npm install
npm run dev
```

Le code est en SvelteKit (JavaScript + JSDoc). Les routes visées sont `/login`, `/`, `/to-confirm`, `/history`, `/add`, `/add/concert`, `/add/festival`, `/event/[id]` et `/event/[id]/edit`.

## Phases suivantes

1. Prototype navigable (en cours)
2. PocketBase : vrais comptes, base SQLite, stockage de fichiers
3. Envoi réel des billets et photos, import de setlist depuis setlist.fm, stats
4. Design final, Docker (accès local + Tailscale), APK Android avec billets hors ligne
