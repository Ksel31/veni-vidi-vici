# Retours bêta et idées

Carnet de bord des retours de la bêta entre amis : bugs, améliorations et idées à trier plus tard. Rien ici n'est un engagement de développement.

Démo : [veni-vidi-vici sur Vercel](https://veni-vidi-vici-ksel31.vercel.app). Connexion avec l'identifiant `demo` et n'importe quel mot de passe. Les données restent dans le navigateur de chacun.

## Légende

**Priorité**

- **P1** — bloquant
- **P2** — important
- **P3** — bonus

**Statut**

- à trier
- à faire
- en cours
- fait

## 🐞 Bugs à corriger

- [ ] **La ville de l'event ne s'enregistre pas**
  - Date : 14 nov. 2026
  - Source : Axel
  - Écran : Ajout / modification d'un event
  - Description : la ville saisie dans le formulaire n'est pas conservée sur l'event. On s'attend à la retrouver ensuite (fiche, accueil, historique).
  - Priorité : à définir
  - Statut : à trier

- [ ] **Festival : le jour de passage d'un groupe est obligatoire**
  - Date : 14 nov. 2026
  - Source : Axel
  - Écran : Ajout / modification d'un festival
  - Description : on doit choisir un jour pour chaque groupe avant d'enregistrer. C'est gênant quand le festival est ajouté et que les groupes sont annoncés, mais pas encore le programme. Le jour doit pouvoir rester vide et se remplir plus tard.
  - Priorité : à définir
  - Statut : à trier

<!--
Exemple d'entrée :

- [ ] **Titre court**
  - Date : 12 nov. 2026
  - Source : Ruru
  - Écran : Accueil
  - Description : ce qui se passe, et ce qu'on attendait.
  - Priorité : P2
  - Statut : à trier
-->

## 🎨 Améliorations UX/UI

Rien pour l'instant.

## 💡 Idées de fonctionnalités

- [ ] **Pré-workout de concert**
  - Description : proposer des playlists Spotify quelques jours avant le concert.
  - Priorité : à définir
  - Statut : à trier
  - Source : Ruru

- [ ] **Partager un concert**
  - Description : envoyer un concert à ses potes via un ticket VVV (Veni Vidi Vici).
  - Priorité : à définir
  - Statut : à trier
  - Source : Ruru

- [ ] **Mini réseau social**
  - Description : chacun peut s'inviter dans les concerts des autres. Il faudra ajouter une date dans l'agenda.
  - Priorité : à définir
  - Statut : à trier
  - Source : Ruru

- [ ] **Import Excel**
  - Date : 12 nov. 2026
  - Description : importer un tableau Excel déjà rempli, car aujourd'hui tout se saisit à la main.
  - Priorité : à définir
  - Statut : à trier
  - Source : Gilles

- [ ] **Ajout automatique d'un concert**
  - Date : 12 nov. 2026
  - Description : un bot récupère les infos publiques du concert (date, lieu, line-up) et remplit l'event, éventuellement déclenché par commande vocale.
  - Priorité : à définir
  - Statut : à trier
  - Source : Sanguisugalaurent Stieoui

- [ ] **Setlists automatiques**
  - Date : 12 nov. 2026
  - Description : setlists remplies automatiquement, sans devoir les chercher et les saisir soi-même.
  - Note : rejoint l'import setlist.fm déjà prévu en phase 3.
  - Priorité : à définir
  - Statut : à trier
  - Source : Sanguisugalaurent Stieoui

- [ ] **Animation du billet déchiré**
  - Date : 12 nov. 2026
  - Description : quand un concert est classé « Vu », le billet se déchire avec une petite animation.
  - Priorité : à définir
  - Statut : à trier
  - Source : Ruru

## ✅ Fait

- [x] **Empty state de l'accueil**
  - Description : quand il n'y a aucun event à venir, proposer un gros bouton « Ajouter mon premier concert », ou un petit onboarding.
  - Priorité : à définir
  - Statut : fait
  - Source : Ruru
  - Fait le 12 nov. 2026 (PR #15)

- [x] **Festival d'un seul jour impossible (obligé de choisir plusieurs jours)**
  - Date : 13 nov. 2026
  - Description : retour bêta après le déploiement Docker sur le Pinas. Le calendrier exigeait deux touchers, donc un festival d'un jour était impossible. Un toucher suffit maintenant (début = fin), « 1 jour » s'écrit au singulier et les stats comptent 1 jour.
  - Priorité : P2
  - Statut : fait
  - Source : Axel
  - Fait le 13 nov. 2026

- [x] **Bouton + du line-up qui ne fait rien**
  - Date : 13 nov. 2026
  - Description : retour bêta sur la version Docker / PocketBase du Pinas. Dans « Line-up à voir », le bouton + à droite d'un groupe (ex. « Skeptical Minds ») ne faisait rien. Cause : `crypto.randomUUID` n'existe pas quand l'appli est servie en HTTP simple (hors HTTPS ou localhost), l'erreur était avalée en silence. Les identifiants passent maintenant par `newId` (`getRandomValues`), et une erreur d'ajout affiche un message. Même correction pour le concert (ajout et modification).
  - Statut : fait
  - Source : Axel
  - Fait le 13 nov. 2026

- [x] **Bouton + du line-up toujours sans effet (2e correctif)**
  - Date : 13 nov. 2026
  - Description : retour bêta sur le déploiement Docker / PocketBase du Pinas (HTTP simple, navigation privée, image à jour avec `newId`). Le + à droite d'un groupe dans « Line-up à voir » ne faisait toujours rien. Reproduction sur un build de production (`ADAPTER=node`), PocketBase 0.40.6, appli et PocketBase servis en HTTP sur l'IP du réseau local, avec Chromium, Firefox et WebKit : le + ajoutait bien un groupe nouveau, à l'ajout comme à la modification, sans erreur de console ni de réseau. L'hypothèse du clavier mobile n'a pas pu être confirmée (non reproduite sur bureau). Seul cas où le + ne faisait réellement rien : un nom déjà dans le line-up (même avec une autre casse) était ignoré sans message. Il affiche maintenant « Déjà dans le line-up » (un seul contrôle, dans le champ, au lieu d'un test copié dans chaque écran). Le maintien du focus sur le + est gardé comme précaution tactile. Parcours navigateur : `e2e/lineup.mjs` (voir README). Si le + reste sans effet sur le Pinas avec un nom nouveau, la cause n'est pas dans ce code : relever la console du navigateur (F12) à ce moment-là.
  - Statut : fait
  - Source : Axel
  - Fait le 13 nov. 2026

- [x] **Calendrier des dates affiché derrière les cartes**
  - Date : 13 nov. 2026
  - Description : retour bêta (Docker / PocketBase, Pinas). Le calendrier s'ouvrait derrière la carte « Line-up à voir ». Cause : les cartes en verre (`backdrop-filter`, `isolation`) forment chacune leur propre empilement, et le calendrier, posé dans l'une d'elles, restait piégé dedans. Il est maintenant déplacé à la racine de la page, donc toujours au-dessus.
  - Statut : fait
  - Source : Axel
  - Fait le 13 nov. 2026

- [x] **Calendrier : toucher deux fois la même date pour un seul jour**
  - Date : 13 nov. 2026
  - Description : retour bêta (Docker / PocketBase, Pinas). Il fallait toucher deux fois la même date pour choisir un seul jour. Maintenant : un toucher = un jour (début = fin), un second toucher sur une autre date forme la plage (dans n'importe quel ordre), un toucher après une plage complète recommence.
  - Statut : fait
  - Source : Axel
  - Fait le 13 nov. 2026
