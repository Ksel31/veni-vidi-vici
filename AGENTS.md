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

Le prototype de code précédent a été écarté. Le projet repart d'un SvelteKit propre (JavaScript + JSDoc).

**Stack :**
- SvelteKit (TypeScript optionnel, JavaScript accepté pour rester simple).
- **Aucun backend.** Les données vivent dans un store Svelte, sauvegardé dans `localStorage`. Se connecter avec l'identifiant `demo` charge les données de démo ; tout autre identifiant ouvre une appli vide.
- Repli autorisé si SvelteKit pose problème : Vite + Svelte en simple page.
- Lancement : `npm install` puis `npm run dev`.

**Login factice :** un écran de connexion où n'importe quel identifiant fonctionne. Il sert seulement à faire exister l'étape dans le parcours.

**Style :** l'interface est **sombre, sur photo de concert**. Les maquettes Elyx font foi : `screens/style-guide.elyx` (règles et composants), `screens/home.elyx` (référence d'écran) et `screens/flow.elyx` (parcours complet). L'app doit reprendre ces maquettes, pas réinventer le style.
- Fond d'écran : photo de concert sous un dégradé noir (45 à 92 %), cartes en « verre sombre » (`glass`, bordure `glass-border`). Les photos sont dans `images/` (`bg-*.jpg`, `hero-*.jpg`) ; sources dans `design/images/`.
- Couleurs (`tokens/colors.elyx`, échelles Radix de 12 steps) : neutre olive pour les fonds et textes (texte principal `text-on-dark`, secondaire `text-on-dark-muted`) ; **lime `#aaff22` = la marque et les CTA** (boutons principaux, « + », billet du prochain event), jamais en fond d'écran ; rouge = raté, ambre = à confirmer, vert = vu (états seulement, jamais de la déco). Un état n'est jamais porté par la couleur seule : toujours un texte ou une icône.
- Boutons : principal = lime, texte noir ; secondaire = verre dense + filet clair ; options sélectionnées (puces, cases) = pilule claire. Cinq états sur tout élément cliquable : défaut, survol (step 4, pointeur seulement), pressé (step 5), focus (anneau de 2 px), désactivé. Zone tactile minimale 44 px.
- Typo : Cabinet Grotesk, **Regular et Medium seulement**, pour toute l'interface. Wagon (Bold) uniquement pour les grands chiffres du billet. Logo : `images/logo-white.svg` (version blanche simple), variantes dans `logos/SVG/`.
- Icônes : Lucide, trait de 2 px (dans `icons/lucide/`), en blanc ou en noir sur fond clair.
- Rayons : 6 px (pastilles), 10 px (éléments dans une carte), 18 px (cartes, gros boutons), 24 px (cartes sur photo), 32 px (pilules et boutons ronds). Tokens dans `tokens/lengths.elyx`.
- Composants réutilisables : `components/` (`event-card`, `tab-bar`, `profile`, `screen-header`, `ui`). Les écrans les assemblent, ils ne les recréent pas.
- Un écran = une intention : accueil (à venir), à confirmer, historique, avec une barre d'onglets flottante en bas et le « + » à droite.
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
| ticketPrice | number \| null | prix du billet en euros, optionnel |
| ticketFile | fichier \| null | billet envoyé (PDF ou image), optionnel |
| photos | fichier[] | photos souvenirs, uniquement une fois l'event « Vu » |
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

- **« À confirmer »** n'est pas un statut stocké : c'est un event `planned` dont la date de fin (ou de début) est passée. Le jour même reste « à venir » : l'event ne devient « à confirmer » qu'à partir du lendemain. L'accueil affiche un bandeau « N events à confirmer », qui mène à la liste `/to-confirm`.
- **Confirmer la présence** : sur la fiche d'un event passé, l'utilisateur choisit « Vu » ou « Raté ».
  - Concert : les passages suivent le statut de l'event.
  - Festival : l'utilisateur coche les jours faits, puis les groupes vus parmi ceux de ces jours. Les groupes non cochés passent en `missed`.
  - Si un festival entier est marqué « Raté », tous ses passages passent en `missed`.
- Le statut d'un passage est lié à la date de cet event : un groupe raté à un festival reste `missed` pour cette date. Le revoir plus tard est un autre event.
- **Ajout d'un event passé** : la présence est pré-sélectionnée sur « Vu » (hypothèse à valider à l'usage).
- **Tout est modifiable à tout moment** depuis la fiche : date, lieu, groupes, billets. Si la date repasse à aujourd'hui ou plus tard, l'event redevient `planned` et tous ses passages repassent en `to_see`.
- Pas de statut « reporté » : on modifie la date.
- Le compte rendu (pouces, avis, setlist, accompagnants, photos souvenirs) n'est accessible qu'une fois l'event marqué « Vu ».
- **Billet** : à l'ajout comme en modification, on peut cocher « billet acheté », saisir le prix et envoyer le fichier du billet (PDF ou image). Prix et fichier sont toujours optionnels, et modifiables à tout moment.
- **Photos souvenirs** : ajoutées depuis le compte rendu d'un event vu, sans limite de nombre, affichées en grille de vignettes avec une case « + ».
- Lieux et artistes : autocomplétion sur ceux déjà saisis, création à la volée sinon.
- Un concert a généralement 1 à 3 groupes, mais le nombre n'est pas limité.

---

## Écrans et routes (phase 1)

| Route | Écran | Contenu |
|---|---|---|
| `/login` | Connexion | identifiant + mot de passe factices |
| `/` | Accueil | bandeau « à confirmer » si besoin (vers `/to-confirm`), liste des events prévus triés par date, bouton « + » bien visible, accès à l'historique |
| `/to-confirm` | À confirmer | events `planned` dont la date est passée ; chaque ligne ouvre la fiche |
| `/history` | Historique | events vus et ratés, du plus récent au plus ancien, filtre par année |
| `/add` | Ajout, étape 1 | choix : Concert ou Festival |
| `/add/concert` | Ajout, étape 2 | date, lieu, groupes (avec tête d'affiche / première partie), billet (acheté, prix, fichier) |
| `/add/festival` | Ajout, étape 2 | titre, dates début/fin, lieu, line-up « à voir » avec jour par groupe, billet (acheté, prix, fichier) |
| `/event/[id]` | Fiche event | infos + billet (prix, fichier) + line-up ; avant la date : compte à rebours ; après : confirmation de présence, puis jours/groupes (festival), puis compte rendu |
| `/event/[id]/edit` | Modifier l'event | même formulaire que l'ajout, pré-rempli |

Après un ajout, rediriger vers la fiche du nouvel event. Chaque écran a un moyen évident de revenir à l'accueil.

**Parcours de référence :** Connexion → Accueil → (Historique | Events prévus | À confirmer | Ajouter → Type d'event → Infos) → Fiche event → (Modifier l'event) → selon la date : avant l'event, ou présence confirmée → (festival : jours et groupes) → compte rendu (dont photos souvenirs) → retour à l'accueil.

---

## Données de démo

Pas de bouton « Réinitialiser les données de démo ». À la place, un **compte démo** : se connecter avec l'identifiant `demo` charge les données de démo ; n'importe quel autre identifiant ouvre une appli vide. Les données vivent dans un store Svelte, sauvegardé dans `localStorage` (chaque compte a les siennes).

Le compte `demo` contient :
- 1 concert passé, déjà marqué vu, avec 2 groupes, un pouce et un avis ;
- 1 concert passé encore `planned` (à confirmer) ;
- 1 festival passé, `planned`, sur 2 jours, avec ses groupes répartis sur les jours (à confirmer) ;
- 3 lieux belges et une poignée d'artistes.

Pas d'event à venir dans la démo : on les crée en testant le parcours d'ajout.

---

## Hors périmètre en phase 1

Ne pas faire : vrai backend, vrais comptes, envoi réel de fichiers (billets, photos : seuls les champs existent dans la maquette), intégration setlist.fm, statistiques, export, mode hors ligne, Docker, APK, design final.

---

## Phases suivantes (pour information, ne pas commencer)

- **Phase 2** — PocketBase (backend en un exécutable : base SQLite, comptes, stockage de fichiers). Remplacer le store local par l'API PocketBase, vrais comptes.
- **Phase 3** — Envoi et stockage réels des billets et des photos (pièces jointes d'un event, champs déjà dessinés en phase 1), import de setlist depuis setlist.fm, stats (« Vici »), export de sauvegarde.
- **Phase 4** — Design final, Docker pour le Pinas (accès local + Tailscale), APK Android (enveloppe Capacitor) avec billets disponibles hors ligne.

---

## Checklist de validation de la phase 1

- [ ] Je me connecte et j'arrive sur l'accueil.
- [ ] Je vois le bandeau « à confirmer » : il m'amène à la liste, puis à la fiche d'un event.
- [ ] J'ajoute un concert à venir et je le retrouve dans les prévus.
- [ ] J'ajoute un festival avec un line-up sur plusieurs jours.
- [ ] J'ajoute un concert passé et j'arrive directement au compte rendu.
- [ ] Sur un festival passé, je coche les jours faits puis les groupes vus.
- [ ] Je mets un pouce sur l'event et sur un groupe, un avis, des accompagnants, une setlist.
- [ ] Je modifie la date d'un event et son statut s'adapte.
- [ ] Je retrouve tout dans l'historique, filtré par année.
- [ ] Le tout est utilisable en vue mobile.

---

## Notes de design

- Les maquettes (`screens/*.elyx`) sont à jour pour tout le parcours de la phase 1, y compris billet (prix, fichier) et photos souvenirs. Toute évolution de l'interface se fait d'abord dans les maquettes.
- Reste à faire côté design : variantes des composants du formulaire (états erreur, focus), écran « accueil vide », version bureau.
