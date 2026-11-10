## Project Configuration

- **Language**: JavaScript (JSDoc)
- **Package Manager**: npm
- **Add-ons**: none

---

# Veni Vidi Vici — brief projet

Application personnelle auto-hébergée pour suivre ses concerts et festivals : ceux à venir, ceux vus, avec un historique et des stats.

- **Veni** : les events prévus
- **Vidi** : l'historique (events vus)
- **Vici** : les stats (phase ultérieure)

Le propriétaire du projet est designer UI/UX avec des bases en code, pas développeur. Il doit pouvoir lire et comprendre le code.

---

## Règles de travail pour l'agent

1. **Une étape à la fois.** Après chaque étape, dis en deux lignes ce qui a été fait et comment le tester dans le navigateur.
2. **Ne construis que la phase en cours.** Pas de fonctionnalités en avance, pas d'abstraction « pour plus tard ».
3. **Reste simple et lisible.** Peu de fichiers, des noms explicites, des commentaires courts en français là où la logique n'est pas évidente.
4. **Pas de dépendance sans raison.** Avant d'installer une librairie, explique pourquoi en une phrase. Pas de librairie de composants UI.
5. **Si un outil bloque** (installation, config, erreur qui tourne en boucle après deux essais), arrête-toi, explique le problème simplement et propose une alternative plus simple plutôt que d'insister.
6. **Si une règle métier est ambiguë**, pose la question au lieu d'inventer.
7. Code (variables, fichiers, routes) en anglais. Interface affichée en français.

---

## Phase en cours : PHASE 1 — prototype navigable

**Objectif :** pouvoir parcourir toute l'appli au clic, sur desktop et en vue mobile, pour valider le parcours à l'usage. Ce n'est pas la version finale.

**Stack :**
- SvelteKit (TypeScript optionnel, JavaScript accepté pour rester simple).
- **Aucun backend.** Les données vivent dans un store Svelte, sauvegardé dans `localStorage`, avec un bouton « Réinitialiser les données de démo ».
- Repli autorisé si SvelteKit pose problème : Vite + Svelte en simple page.
- Lancement : `npm install` puis `npm run dev`.

**Login factice :** un écran de connexion où n'importe quel identifiant fonctionne. Il sert seulement à faire exister l'étape dans le parcours.

**Style :** minimal mais dans l'esprit final, sans y passer de temps. Référence : `screens/style-guide.elyx`.
- Couleurs (`tokens/colors.elyx`) : rose fluo `#ff0088` = fond d'écran et marque ; encre brun-noir `#2b1118` = texte et actions (pleine = principale, contour = secondaire) ; papier `#f5f1ea` = pastilles d'information ; blanc = cartes. Le fond d'écran et les cartes ne sont jamais de la couleur d'action.
- Titres d'interface : Archivo gras. Texte : Archivo regular. ROYAL Hefana uniquement pour le logo et le branding (illisible en interface).
- Icônes : Lucide, trait de 2 px, en encre. Rayons : 18 px (cartes, gros boutons), 10 px (éléments dans une carte), 6 px (pastilles).
- Un écran = une intention : accueil (à venir), à confirmer, historique, avec une barre d'onglets en bas.
- Mobile d'abord (largeur ~390 px), utilisable sur desktop.
- Pas d'animations.

---

## Modèle de données

Toutes les données sont propres à un utilisateur (pas de partage entre comptes).

### Venue (lieu / salle)
| champ | type | note |
|---|---|---|
| id | string | |
| name | string | ex. « Ancienne Belgique » |
| city | string | |
| country | string | |

### Artist
| champ | type | note |
|---|---|---|
| id | string | |
| name | string | |

### Event
| champ | type | note |
|---|---|---|
| id | string | |
| type | `concert` \| `festival` | choisi en premier lors de l'ajout |
| title | string \| null | obligatoire pour un festival, optionnel pour un concert |
| startDate | date | |
| endDate | date \| null | festival sur plusieurs jours |
| venueId | string | |
| status | `planned` \| `attended` \| `missed` | |
| ticketBought | boolean | |
| daysAttended | date[] | festival uniquement : jours faits |
| thumb | `up` \| `down` \| null | avis global, pas d'étoiles |
| comment | string | une ligne maximum |
| companions | string[] | prénoms libres, avec autocomplétion sur les prénoms déjà utilisés |

### Performance (passage d'un artiste à un event)
| champ | type | note |
|---|---|---|
| id | string | |
| eventId | string | |
| artistId | string | |
| billing | `headliner` \| `support` \| null | tête d'affiche ou première partie |
| day | date \| null | festival : jour de passage |
| status | `to_see` \| `seen` \| `missed` | |
| thumb | `up` \| `down` \| null | avis par groupe |
| setlist | string | texte libre, un titre par ligne (saisie manuelle) |

---

## Règles métier

- **« À confirmer »** n'est pas un statut stocké : c'est un event `planned` dont la date de fin (ou de début) est passée. L'accueil affiche un bandeau « N events à confirmer ».
- **Confirmer la présence** : sur la fiche d'un event passé, l'utilisateur choisit « Vu » ou « Raté ».
  - Concert : les passages suivent le statut de l'event.
  - Festival : l'utilisateur coche les jours faits, puis les groupes vus parmi ceux de ces jours. Les groupes non cochés passent en `missed`.
- **Ajout d'un event passé** : la présence est pré-sélectionnée sur « Vu » (hypothèse à valider à l'usage).
- **Tout est modifiable à tout moment** depuis la fiche : date, lieu, groupes, billets. Si la date repasse dans le futur, l'event redevient `planned`.
- Pas de statut « reporté » : on modifie la date.
- Le compte rendu (pouces, avis, setlist, accompagnants) n'est accessible qu'une fois l'event marqué « Vu ».
- Lieux et artistes : autocomplétion sur ceux déjà saisis, création à la volée sinon.
- Un concert a généralement 1 à 3 groupes, mais le nombre n'est pas limité.

---

## Écrans et routes (phase 1)

| Route | Écran | Contenu |
|---|---|---|
| `/login` | Connexion | identifiant + mot de passe factices |
| `/` | Accueil | bandeau « à confirmer » si besoin, liste des events prévus triés par date, bouton « + » bien visible, accès à l'historique |
| `/history` | Historique | events vus et ratés, du plus récent au plus ancien, filtre par année |
| `/add` | Ajout, étape 1 | choix : Concert ou Festival |
| `/add/concert` | Ajout, étape 2 | date, lieu, groupes (avec tête d'affiche / première partie), billet acheté |
| `/add/festival` | Ajout, étape 2 | titre, dates début/fin, lieu, line-up « à voir » avec jour par groupe, billet acheté |
| `/event/[id]` | Fiche event | infos + line-up ; avant la date : compte à rebours ; après : confirmation de présence, puis jours/groupes (festival), puis compte rendu |
| `/event/[id]/edit` | Modifier l'event | même formulaire que l'ajout, pré-rempli |

Après un ajout, rediriger vers la fiche du nouvel event. Chaque écran a un moyen évident de revenir à l'accueil.

**Parcours de référence :** Connexion → Accueil → (Historique | Events prévus | Ajouter → Type d'event → Infos) → Fiche event → (Modifier l'event) → selon la date : avant l'event, ou présence confirmée → (festival : jours et groupes) → compte rendu → retour à l'accueil.

---

## Données de démo

Au premier lancement, créer :
- 1 concert passé et marqué vu, avec 2 groupes, un pouce et un avis ;
- 1 concert passé encore `planned` (pour tester « à confirmer ») ;
- 1 concert à venir avec billet acheté ;
- 1 festival à venir sur 3 jours avec 8 groupes répartis sur les jours ;
- 1 festival passé, `planned`, sur 2 jours (pour tester la sélection des jours et groupes) ;
- 3 lieux belges, une dizaine d'artistes.

---

## Hors périmètre en phase 1

Ne pas faire : vrai backend, vrais comptes, photos, billets PDF, intégration setlist.fm, statistiques, export, mode hors ligne, Docker, APK, design final.

---

## Phases suivantes (pour information, ne pas commencer)

- **Phase 2** — PocketBase (backend en un exécutable : base SQLite, comptes, stockage de fichiers). Remplacer le store local par l'API PocketBase, vrais comptes.
- **Phase 3** — Photos et billets PDF (pièces jointes d'un event), import de setlist depuis setlist.fm, stats (« Vici »), export de sauvegarde.
- **Phase 4** — Design final, Docker pour le Pinas (accès local + Tailscale), APK Android (enveloppe Capacitor) avec billets disponibles hors ligne.

---

## Checklist de validation de la phase 1

- [ ] Je me connecte et j'arrive sur l'accueil.
- [ ] Je vois le bandeau « à confirmer » et il m'amène à la bonne fiche.
- [ ] J'ajoute un concert à venir et je le retrouve dans les prévus.
- [ ] J'ajoute un festival avec un line-up sur plusieurs jours.
- [ ] J'ajoute un concert passé et j'arrive directement au compte rendu.
- [ ] Sur un festival passé, je coche les jours faits puis les groupes vus.
- [ ] Je mets un pouce sur l'event et sur un groupe, un avis, des accompagnants, une setlist.
- [ ] Je modifie la date d'un event et son statut s'adapte.
- [ ] Je retrouve tout dans l'historique, filtré par année.
- [ ] Le tout est utilisable en vue mobile.

---

## Notes de design (à faire)

- **Photos de concert** : chercher des photos (libres de droits ou perso) pour habiller le fond de l'app (accueil, fiche event). Rose réservé aux éléments, pas aux aplats ; fond sombre avec dégradés et reliefs.
