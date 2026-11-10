# Skills UX/UI génériques

Référence pour réutiliser ces skills sur n’importe quel projet d’interface. Rien ici n’est lié à un site ou une esthétique particulière : pas de police imposée, pas de thème cyberpunk, pas de contenu métier.

**Priorité.** Les règles personnelles « Anti vibe slop » (section en bas) passent avant les skills. Si un skill et une règle perso se contredisent, la règle perso gagne.

**Sources.**
- [jakubkrehel/skills](https://github.com/jakubkrehel/skills) : `better-interface`, `interface-review`, `explain-interface`, tous les `better-*`, `state-machine`, `break`, `variant`, `build-design`, `teardown` (non détaillé ici).
- [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) : `taste-skill` (install name `design-taste-frontend`).
- `humanizer` : basé sur Wikipedia « Signs of AI writing » / humanizer amont (Siqi Chen), avec un add-on pour la copy d’interface.
- Skills Figma : plugin / MCP Figma (pas dans les deux dépôts ci-dessus).

---

## Table des matières

1. [Audit et revue](#1-audit-et-revue)
2. [Domaines](#2-domaines)
3. [Composants](#3-composants)
4. [Figma](#4-figma)
5. [Workflow d’audit suggéré](#5-workflow-daudit-suggéré)
6. [Checklist rapide](#6-checklist-rapide)
7. [Anti vibe slop (règles perso, génériques)](#7-anti-vibe-slop-règles-perso-génériques)
8. [Sources](#8-sources)

---

## 1. Audit et revue

### `better-interface`

**À quoi ça sert.** Orchestrateur de revue d’écran, de parcours ou d’interface entière. Il n’invente pas les règles : il charge chaque skill de domaine, consolide les preuves et sort un seul verdict classé.

**Quand l’utiliser.** Revue globale d’un écran, d’un flow ou d’un dépôt. Pour une branche / PR / diff, passer d’abord par `interface-review`.

**Substance utile.**
- Ordre de revue obligatoire : accessibilité → layout → writing → typography → colors → ui (les fondations avant le polish).
- Sévérités : `HIGH` (bloque une tâche, trompe, cache un contrôle, risque de perte de données), `MEDIUM` (compréhension / efficacité / cohérence), `LOW` (polish isolé).
- **Triggers d’escalade** (toujours `HIGH`, jamais baissés) : contrôle sans nom accessible ; focus clavier invisible ; chemin pointeur sans équivalent clavier ; motion qui ignore `prefers-reduced-motion` ; contenu / contrôle coupé ou injoignable à 320 px ou zoom 200 % ; contraste texte / contrôle sous le ratio requis ; sens porté par la couleur seule ; action destructive sans confirmation / undo / traitement distinct ; contenu tronqué sans accès à la valeur complète ; contenu derrière un scroll / disclosure sans indice visible ; erreur sans voie de récupération ; couleur sémantique utilisée contre son sens ; changement d’état porté par la motion seule.
- Cap : au plus 15 findings, une cause racine = une ligne. Préférer supprimer / plateforme native / token existant avant d’ajouter.
- Preuve obligatoire : `fichier:ligne` + implémentation actuelle. Un check non exécuté = `Not verified`, jamais un finding inventé.

**Sortie.** Scope + couverture par domaine, tableau unique classé (Severity / Domain / Location / Before / After / Why), vérification, verdict `Approve` / `Block`.

**Combinaisons.** Agrège tous les `better-*`. Reçoit le scope déjà classé de `interface-review`. Les variantes de `variant` doivent d’abord passer ses triggers.

---

### `interface-review`

**À quoi ça sert.** Revue d’un *changement* (branche, PR, working tree), pas d’un écran entier. Répond à « est-ce que j’ai empiré l’interface ? ».

**Quand l’utiliser.** Avant merge, sur un diff, un PR, des fichiers non commités. Jamais pour un audit global (là, `better-interface`).

**Substance utile.**
- Résolution de scope : range `merge-base..HEAD` + uncommitted, ou uncommitted seuls, ou PR nommé. Sans changement : demander, ne pas inventer `HEAD~1`.
- Blast radius : un hop vers les importateurs ; deux hops pour tokens / primitives partagés ; au plus 5 consumers.
- Lire le côté `-` du diff (régressions invisibles dans l’état final) : aria-label, outline, `prefers-reduced-motion`, etc.
- Statuts : `Introduced`, `Regression`, `Pre-existing` (au plus 3 pre-existing en courtoisie).
- Intent incomplet : variante / thème appliqué à certains états seulement ; string sans entrée i18n ; composant sans empty / loading / error / narrow ; contrôle ajouté sur une surface mais pas ses sœurs.
- Lecture seule : pas de `git checkout` / `gh pr checkout` qui réécrit le working tree.

**Sortie.** Bloc de scope (Target, Base/Head, commits, files, surfaces), puis hand-off à `better-interface` avec colonne Status. Verdict porté par `better-interface`.

**Combinaisons.** Prépare le scope → `better-interface` applique les règles de domaine.

---

### `taste-skill` (install : `design-taste-frontend`)

**À quoi ça sert.** Direction artistique anti-générique pour pages marketing / portfolio / landing, et un run séparé pour les écrans d’app (dashboard, settings, inbox). Remplace les defaults « moyenne de toutes les pages vues par le modèle » par des décisions mesurables.

**Quand l’utiliser.** Construire, redesign, restyler ou revoir une page publique ; ou un écran d’app. Quand quelqu’un dit « ça fait IA / template / générique ».

**Substance utile (extrait).**
- Run page : brief + inventaire sujet → argument (claims) → `draw.mjs` (3 directions / 20) → idée (« X du sujet devient Y du device ») → copy deck → build (tokens, hero, sections, images, live thing, scroll scenes) → gate (`lint.mjs` + `inspect.mjs` à 1440 / 768 / 390) → look (critique screenshots, max 3 rounds) → motion → report.
- House rules mesurées par l’inspecteur : titres ≤ 2 lignes ; marges externes égales ; pas de stretches vides > ~½ écran ; pas d’eyebrows / pills / badges au-dessus du titre ; pas de monospace hors code ; pas de numérotation 01/02/03 ; pas de hairlines ; pas de gradients ; pas d’ombres au repos ; pas de palette « assistant » (crème + terracotta, violet/indigo) ; pas de labels uppercase tracking ; pas de cartes features à icônes ; pas de glass / blur nav ; pas d’emoji décoratifs ; max 2 fonts.
- Type : ratio headline/body médian ~4.3 ; display tracking -0.02 à -0.05em, leading 0.85–1.05 ; texte 16–20 px, leading 1.45–1.6, 45–75 cpl ; ≤ 5 tailles.
- Espace : marges 16–32 px ; gaps entre sections 120–240 px desktop.
- Couleur : 1 ground, 1 ink, 1 accent ; texte courant en encre pleine.
- Boutons : flat, coins carrés ou fully round (pas le soft 9–16 px des sites faibles).
- Motion : ≥ 8 éléments qui bougent réellement (warn sous 16) ; stagger 60–90 ms ; rise 16–32 px ; `prefers-reduced-motion` obligatoire ; transform + opacity seulement.
- App screens : règles propres (bordures calmes OK ; pas de glow, icônes dans des carrés teintés, charts rainbow, vanity numbers).

**Sortie.** Direction + seed, phrase d’idée, live thing, scores de critique, crédits d’images, 0 FAIL inspecteur.

**Combinaisons.** Pour une landing : taste d’abord, puis `better-interface` pour l’accessibilité / layout produit. Les bans perso anti-slop peuvent être plus stricts que taste (ex. blur-in texte).

---

### `explain-interface`

**À quoi ça sert.** Expliquer *comment* un site, un effet ou une animation a été construits (URL ou capture). Pas de verdict.

**Quand l’utiliser.** Reverse-engineer une technique (gradient, blur stack, stagger), comprendre un système (framework, tokens, breakpoints).

**Substance utile.**
- Deux modes : système entier (`read-the-system`) vs un effet (`find-the-effect`, stack en paint order).
- Tiers de claim : Measured / Derived / Inferred (jamais présenter une estimation comme mesurée).
- Browser (computed, paint, animations) + fetch HTML/CSS (source authored). Préférer le browser pour canvas, CSS-in-JS, motion.
- Capture sans URL = reconstruction, le dire clairement.
- Finir sur la recette en mots (layers + 1–2 valeurs perceptuelles), pas un snippet lookalike.

**Sortie.** Explication stratifiée, sans code de reconstruction. Vocabulaire renvoyé vers le skill de domaine concerné (`better-typography`, `better-colors`, etc.).

**Combinaisons.** Lecture seule. Pour juger : `better-interface`. Pour explorer des alternatives : `variant`.

---

## 2. Domaines

### `better-accessibility`

**À quoi ça sert.** Sémantique, clavier, focus, noms accessibles, formulaires, annonces lecteurs d’écran, motion, zoom. WCAG 2.2 A/AA.

**Quand l’utiliser.** Premier skill de toute revue. Toujours avant le polish.

**Substance utile.**
- Native first : `<button>` / `<a href>`, pas `<div onClick>`. ARIA en dernier recours.
- Focus : `:focus-visible` ; ring custom ≥ 3:1 (1.4.11) ; jamais `outline: none` sans remplacement ; élément focusé jamais entièrement caché derrière un sticky (2.4.11).
- Clavier : Tab entre widgets, flèches dans composites, Escape ferme ; `tabindex` 0 ou -1 seulement ; roving tabindex.
- Overlays : préférer `<dialog showModal()>` ; sinon `inert` + `role="dialog"` + `aria-modal` ; restore focus au trigger.
- Hit area AA : 24×24 CSS px (2.5.8) ; viser 44×44 touch / 40×40 desktop.
- Forms : `<label for>` (placeholder ≠ label) ; validate on submit (pas submit disabled) ; `aria-invalid` + `aria-describedby` + focus premier champ en erreur ; ne pas bloquer le paste.
- Contraste (seuils) : texte 4.5:1 ; large (≥ 24 px ou 18.67 px bold) 3:1 ; UI / graphiques significatifs 3:1 (1.4.11). Mesure = `better-colors`.
- Motion : wrap dans `@media (prefers-reduced-motion: no-preference)` ; sous reduced = cross-fade opacity, kill parallax/autoplay.
- Contenu dynamique : `aria-describedby` (champ), `role="status"` (poli), `role="alert"` (urgent seulement).
- Zoom / reflow : 200 % (1.4.4), 320 px sans scroll horizontal (1.4.10) ; jamais `maximum-scale=1` / `user-scalable=no`.
- Alt : décoratif `alt=""`, informatif = sens, fonctionnel = action.

**Sortie.** Tableau Severity / Location / Before / After / Why (critère WCAG). `Block` si un HIGH reste.

**Combinaisons.** Contrast → `better-colors`. Text sizing / iOS 16 px → `better-typography`. Espacement cibles / RTL → `better-layout`. Wording labels/erreurs → `better-writing`.

---

### `better-layout`

**À quoi ça sert.** Groupement, alignement, ordre de lecture, structure responsive, place pour les traductions, miroir RTL.

**Quand l’utiliser.** Structure d’écran, responsive, clipping, RTL, densité de contrôles.

**Substance utile.**
- Grouper par l’espace d’abord (gap inter-groupes ≥ 2× gap interne) ; lignes en dernier.
- Contrôles distincts du contenu (fond, bordure, underline, ou zone type toolbar).
- Peu d’axes d’alignement partagés ; un step d’espacement par niveau (défaut utile : 16 px).
- Propriétés logiques (`margin-inline-start`, etc.) pour tout ce qui se miroite.
- Ordre DOM = ordre visuel ; pas de `order` / `row-reverse` pour « réordonner ».
- Une action primaire par vue ; secondaires derrière un menu au-delà de 3.
- Contenu hors écran / collapsed : indice visible (peek 16–32 px ou disclosure).
- Clearance : ~12 px entre contrôles bordés/remplis ; ~24 px entre glyphes de contrôles borderless adjacents.
- Boutons pleine largeur inset (~16 px inline mobile) ; content bleeds, controls float ; `scroll-padding-block-start` = hauteur sticky.
- Breakpoints depuis le contenu ; préférer container queries pour les composants.
- Croissance i18n : `max-width` + `min-height`, jamais width/height fixes sur du texte ; tester pseudo-loc / allemand.
- Pièges : `minmax(0,1fr)` / `min-width:0` ; `100%` pas `100vw` ; `100dvh` pas `100vh` mobile ; `min-height` pas `height` fixe.

**Sortie.** Même format de rapport domaine. HIGH si clip / overlap à 320 px ou 200 %, ou troncature sans accès à la valeur.

**Combinaisons.** Hit areas / focus → a11y. Radius / shadows / motion → `better-ui`. Measure / truncation CSS → typography. Mots → writing.

---

### `better-typography`

**À quoi ça sert.** Échelle, interlignage, tracking, wrapping, troncature, ponctuation typographique, chargement des fontes, inputs iOS.

**Quand l’utiliser.** Lisibilité, hiérarchie de titres, measure, truncate, font features.

**Substance utile.**
- Peu de fonts (rarement > 3) ; weights + sizes portent la hiérarchie. Sous 18 px : weight ≥ 400 (100–300 réservés à ≥ 28 px).
- Propriétés CSS plutôt que tags bruts (`font-weight`, `font-variant-numeric: tabular-nums`, pas `font-variation-settings` / `font-feature-settings` quand une propriété existe).
- Line-height unitless : display ~1.1 ; headings 1.2–1.3 ; body 1.5–1.6 ; wrapping ≥ 3 lignes → ≥ 1.4.
- Tracking : headings ≥ 24 px → -0.01 à -0.02em ; labels uppercase ≤ 14 px → 0.05em ; body = 0.
- Measure long-form : 60–75 caractères / ligne.
- Wrap : `text-wrap: balance` titres/courts (jamais paragraphes) ; `pretty` sur paragraphes ; `overflow-wrap: break-word` pour IDs/liens longs ; `nowrap` sur labels/badges.
- `tabular-nums` sur timers, compteurs, prix, colonnes numériques.
- Truncate 1 ligne (`truncate`) ou multi (`line-clamp-N`) + voie de retour (layout).
- Inputs iOS ≥ 16 px (sinon Safari zoom) : soit `text-base` mobile, soit scale transform.
- Floors : body long-form ≥ 16 px ; UI menus/inputs ~14 px ; captions ~13 px ; rarement < 12 px ; `rem`.
- `lang` / `dir` / `<bdi>` pour le bidi. Smooth antialiased une fois sur le root.

**Sortie.** Rapport domaine. HIGH si illisible, truncate sans retour, clip à 320 px / 200 %.

**Combinaisons.** Contraste = colors + a11y. Mots = writing. Structure de headings sémantique = a11y.

---

### `better-colors`

**À quoi ça sert.** Ramps, rôles / tokens sémantiques, notation, contraste mesuré (pas estimé).

**Quand l’utiliser.** Nouveau système de couleur, audit de contrastes, mapping tokens, thèmes light/dark.

**Substance utile.**
- Système = ramps (neutre + accent + status réellement utilisés), pas une boîte de couleurs. Chaque step a un job (bg page, hover, border, fill, text).
- Primitives nommées par hue (`--blue-600`) ; sémantiques par rôle (`--color-text-secondary`) ; composants ne référencent que le sémantique.
- Une couleur = un sens (même hue à ±15° OKLCH = même couleur). Jamais couleur seule pour le sens (a11y).
- Remplir exactement une action primaire par vue (fill sur le fond, pas accent sur le label).
- Contraste : mesurer la paire *rendue* (fond réel, y compris alpha / image) ; seuils = a11y ; ne changer les couleurs que si demandé, puis remesurer.
- Ramp : hue constant, chroma peak au milieu, pas plus fin au bout clair (~0.04–0.05 L OKLCH). Défaut notation nouvelle : `oklch()`. Gradients : `in oklab` (ou `in oklch` si gris au milieu).
- Dark ≠ reverse light : baisser chroma accent, élargir le bout sombre, remesurer.
- Piège courant : `text-white` sur Tailwind `500` échoue souvent 4.5:1 → monter le fill à `600`.

**Sortie.** Rapport domaine. HIGH : contraste texte/contrôle sous seuil, sens par couleur seule, couleur sémantique contre son sens.

**Combinaisons.** Seuils d’obligation = a11y. Surfaces / ombres / icônes = `better-ui`.

---

### `better-ui`

**À quoi ça sert.** Polish des surfaces, icônes et motion, avec des valeurs exactes. Un polish ne bat jamais une interaction cassée.

**Quand l’utiliser.** Après que l’interaction tient : radius, ombres, press, entrances, icônes, hover touch.

**Substance utile.**
- Radius concentrique : outer = inner + padding (+ border) ; au-delà de 24 px de padding, surfaces séparées.
- Alignement optique : -2 px padding côté icône d’un bouton, etc.
- Ombres pour l’élévation, bordures pour la structure ; inputs gardent une bordure (contraste 3:1) ; sous shadow ring : `border: 1px solid transparent` (forced-colors).
- Outline images : 1 px inset `oklch(0 0 0 / 0.1)` light / `oklch(1 0 0 / 0.1)` dark.
- Press : scale `0.96` en 150 ms ease-out ; disabled ne scale pas.
- High-frequency (keystrokes, row hover, tabs) : ≤ 150 ms opacity/background ; jamais motion seule comme feedback.
- Entrances (infrequent) : stagger 100 ms ; opacity + blur 4 px + translateY 12 px sur 300 ms ease-out.
- Exits : plus courts (150 ms), -12 px, blur 4 px.
- Icon swap infrequent : scale 0.25→1, opacity 0→1, blur 4→0 ; spring duration 0.3 bounce 0 ; ou 300 ms `cubic-bezier(0.2, 0, 0, 1)`.
- `transition-property` nommé (jamais `all`) ; `will-change` sparingly et nommé.
- Hover seulement sous `@media (hover: hover)` ; overlays scrollables : `overscroll-behavior: contain`.
- Icônes : `currentColor` ; stroke ~1.5 px (400) → 2.5 px (700) ; outline défaut, fill = actif ; miroir RTL seulement si le sens suit la lecture.
- Motion gated `prefers-reduced-motion: no-preference` ; reduced = opacity cross-fade.

**Sortie.** Rapport domaine. HIGH : keyframe toggle irréversible, hover collé au touch, motion sans reduced-motion, état porté par motion seule.

**Note vs règles perso.** Ce skill documente des recettes avec blur 4 px sur entrances/icon swaps. Les bans anti vibe slop interdisent le *blur-in de texte* type landing. En cas de conflit, la règle perso gagne : pas de blur-in texte.

---

### `better-writing`

**À quoi ça sert.** Labels, erreurs, empty states, confirmations, vocabulaire produit. Une voix, un lexique.

**Quand l’utiliser.** Toute copy d’UI, avant ou pendant l’implémentation ; revue de strings / locales.

**Substance utile.**
- Inventaire d’abord (fichiers i18n, noms d’objets, verbes, casing).
- Adresser le lecteur (« you ») ; erreurs sans « we » défensif ; possessifs sobres.
- Boutons verb-first (« Delete project », pas « OK » / « Let’s go »).
- Liens = destination (« Read the billing docs », pas « Click here » / « Learn more » nu).
- Une politique de casing par type d’élément (sentence case par défaut).
- Toggles : décrire l’état ON (« Send read receipts », pas « Don’t send… »).
- Erreurs = instruction à côté du champ (quoi + comment corriger) ; pas d’« Oops » / « ! ».
- Undo > confirmation quand réversible ; confirmation = titre action+objet, body conséquences, boutons verb+object (pas Yes/No) ; objets critiques : taper le nom.
- Empty state : ce que c’est + comment le remplir + une action ; filtered empty nomme la query + Clear filters.
- Strings entières avec placeholders ICU / pluriels locaux ; `Intl` pour dates/nombres. Jamais `"You have " + n + "…"`.

**Sortie.** Rapport domaine. HIGH : trompe l’utilisateur, erreur sans récupération, destructive sans confirm/undo.

**Combinaisons.** Rendu (`text-transform`, truncate) = typography. Markup a11y des erreurs = a11y. Place pour traductions = layout. Défler le ton IA = `humanizer`.

---

### `humanizer`

**À quoi ça sert.** Enlever les tics d’écriture d’IA tout en gardant le fond. Pour prose et (add-on) copy d’interface courte.

**Quand l’utiliser.** Relire une page, un deck, une PR description, des strings marketing. Après `better-writing` si le ton reste « chatbot ».

**Substance utile (patterns forts §1–5 = éditer dès une occurrence).**
1. Contrastes Not X but Y / « ce n’est pas… c’est… ».
2. Closers dramatiques d’une ligne qui répètent (« That is the real win. »).
3. Aphorismes creux (« at its core », « the real question is »).
4. Run-ups (« Let’s dive in », « Here’s what you need to know »).
5. Argumenter contre personne (« I’m not saying… », « You might think… »).
- Puis : triades forcées, openings répétés, tirets em/en partout, inflation (« pivotal », « landscape », « nestled »), bold décoratif, wrappers chatbot (« I hope this helps »), re-explication du contexte déjà connu.
- Règle tirets : pas d’em/en dash sauf si le sample d’écriture en utilise.
- Add-on UI : pas de middle dots `·` ; pas de stack eyebrow + titre dramatique + résumé ; pas de filler en clauses courtes séparées par virgules ; pas de framing « I built » ; faits concrets > adjectifs ; fragments OK pour labels/boutons.

**Sortie.** Texte réécrit (ou fichier écrasé en mode file) + liste courte des patterns restants. Mode embed (PR/commit) : texte final seulement.

**Combinaisons.** Complète `better-writing`. Les bans anti vibe slop recoupent l’add-on UI et restent prioritaires.

---

## 3. Composants

### `state-machine`

**À quoi ça sert.** Workbench : un composant réel rendu dans tous ses états produit, avec mock data et switcher. Pas une revue.

**Quand l’utiliser.** Travailler le look état par état (loading, empty, error, plan tiers, permissions…).

**Substance utile.**
- Un composant par run. États = branches déjà dans le code (Data / Account / Feature) ; ne pas inventer de branches.
- Page jetable dans l’app (route scratch, `"use client"` si Next), import du vrai composant, styles de l’app inchangés.
- Data injectée à la frontière (props ou seam de data app) ; fixtures product-shaped ; loading qui tient jusqu’au switch.
- Switcher groupé via `?__state=` (double underscore).
- Après chaque fix visuel : rejouer tous les états. Supprimer la page seulement sur demande.

**Sortie.** URL + liste d’états + clés switcher. Pas de verdict.

**Combinaisons.** Hostile all-at-once = `break`. Alternatives de design = `variant`. Revue finie = `interface-review`.

---

### `break`

**À quoi ça sert.** Harness : le composant sous chaque scénario worst-case qui peut vraiment l’atteindre, côte à côte. Observe ce qui casse visuellement.

**Quand l’utiliser.** Stress test contenu (string 60 chars unbreakable, 0 items, RTL, container étroit…).

**Substance utile.**
- Axes seulement si le composant les accepte (lire props/slots). Documenter les axes droppés.
- Page harness, vrai composant, labels + largeurs + fixtures seulement.
- Un load, un look ; findings = ce qui est visible (« overflow right edge »), pas « spacing feels tight ».
- Chaque break nomme le skill owner (`better-typography`, `better-writing`…).
- « Everything survived » est un rapport valide. Page laissée up jusqu’à demande de delete.

**Sortie.** Tableau Scenario / Observed / Owner + notes sur la page. Pas de verdict.

**Combinaisons.** Owner skill pour le fix. Pas de jugement goût → `better-interface` pour ça.

---

### `variant`

**À quoi ça sert.** Trois (parfois cinq) réponses différentes au même brief, derrière un picker sur la vraie page. Ne classe pas les favorites.

**Quand l’utiliser.** Explorer structure / densité / emphase / type / voix avant de figer.

**Substance utile.**
- Un axe primaire par set (Structure, Density, Emphasis, Type, Voice). Noms parlants (`Quiet`, `Dense`), pas Option A.
- Floor = triggers `better-interface` (identique sur toutes les variantes).
- Hostées sur la page réelle avec chrome et data product-shaped ; `?__variant=`.
- Table tradeoffs (Right when / Costs) sans favori marqué.
- Sur choix : promouvoir une, supprimer le harness.

**Sortie.** Picker live + tableau de tradeoffs.

**Combinaisons.** Floor a11y/contrast via `better-interface`. Stress après choix : `break`. États : `state-machine`.

---

### `build-design`

**À quoi ça sert.** Passer une maquette (Figma ou image) en code fidèle, avec les tokens/composants du projet.

**Quand l’utiliser.** Implémenter un frame Figma ou une capture fournie.

**Substance utile.**
- Source of truth = le design. Écart = décision user, pas goût agent.
- Figma → MCP Figma ; image → ratios estimés (demander le lien Figma si possible).
- Mapper variables/styles → tokens projet ; instances → composants projet ; raw sans token → nearest token (signaler si > 2 px ou step de couleur différent).
- Builder seulement ce que le design montre (états non dessinés = missing, pas inventés). Diff pas plus large que le design.
- Comparer frame par frame (screenshot build vs design) ; findings mesurés (« gap 12 vs 16 »).

**Sortie.** Tableau Element / Design / Built / Status + Unwired / Missing states / Domain conflicts.

**Combinaisons.** Conflits de règles → skill owner (a11y, colors…). Alternatives = `variant`. Stress = `break`.

---

## 4. Figma

Skills du plugin / MCP Figma. À charger avant les appels outils correspondants. Résumés courts.

### `figma-use`

API Plugin via `$fig` (création / mutation planifiée). Règles critiques : pas de `figma.create*` brut ; auto-layout par défaut ; couleurs via `figma.util.solidPaint` / rgb / rgba ; lier aux variables quand un token existe ; screenshots incrémentaux ; jamais `get_design_context` depuis ce skill (outil interdit ici). Prérequis de tout autre skill Figma d’écriture.

### `figma-design-to-code`

Figma → code. Toujours demander un screenshot avec `get_design_context` ; adapter au stack projet ; réutiliser Code Connect et composants/tokens existants ; assets téléchargés localement (pas d’URL Figma temporaires) ; vérifier chaque asset rendu.

### `figma-generate-design`

Construire / mettre à jour un écran Figma depuis le design system (instances, variables, styles), pas des boîtes hex. Workflow : découvrir composants (Code Connect → écrans existants → `search_design_system`) → wrapper + placeholders → section par section → screenshots. Parallèle `generate_figma_design` obligatoire si images (transfer `imageHash`).

### `figma-generate-library`

Construire un design system Figma en phases (Discovery → Foundations tokens → File structure → Components un par un → QA). Variables avant composants ; scopes explicites (jamais `ALL_SCOPES`) ; code syntax `var(--…)` ; ledger d’état sur disque ; 20–100+ appels `use_figma` séquentiels.

### `figma-implement-motion`

Traduire le motion Figma en code. `get_motion_context` = vérité timing/easing/snippets ; `get_design_context` = structure. Merger par `data-node-id` ; respecter `prefers-reduced-motion` ; factoriser les snippets répétés ; stack existant du projet prioritaire (motion.dev / CSS / Framer…).

### `figma-use-motion`

Écrire / éditer le motion *dans* Figma via Plugin API (keyframes manuels, animation styles, timeline). Flag `metronome` requis ; sinon bail out. Vérifier via `export_video` (coûteux) + frames, pas `get_screenshot` (état de repos seulement).

---

## 5. Workflow d’audit suggéré

Ordre type pour un écran ou un flow produit :

1. **Scope** — écran / flow / diff ? Diff → `interface-review`. Écran → `better-interface`.
2. **Fondations** (dans `better-interface` ou standalone) :
   1. `better-accessibility`
   2. `better-layout`
   3. `better-writing` (+ `humanizer` si le ton IA persiste)
   4. `better-typography`
   5. `better-colors`
   6. `better-ui`
3. **Anti vibe slop** — passer la checklist perso (section 7) ; elle peut invalider un « Approve » polish.
4. **Page marketing / landing** — en plus ou à la place du polish : `taste-skill` (draw → build → inspect → critique).
5. **Composant fragile** — `state-machine` pour les états, `break` pour le worst-case, `variant` si plusieurs directions.
6. **Depuis Figma** — `build-design` ou `figma-design-to-code` ; motion → `figma-implement-motion`.
7. **Comprendre une référence externe** — `explain-interface`, puis décider si on reprend la technique.

Ne pas polir (`better-ui` / taste motion) tant qu’un trigger HIGH a11y / layout / contraste reste ouvert.

---

## 6. Checklist rapide

Avant de dire « c’est bon » :

- [ ] Chaque contrôle a un nom accessible et un focus visible
- [ ] Tout chemin pointeur a un chemin clavier
- [ ] `prefers-reduced-motion` respecté ; pas d’état porté par la motion seule
- [ ] Pas de clip / overlap à 320 px et zoom 200 %
- [ ] Contrastes texte ≥ 4.5:1 (large ≥ 3:1) ; UI ≥ 3:1 ; pas de sens par couleur seule
- [ ] Erreurs avec voie de récupération ; destructive avec confirm ou undo
- [ ] Troncatures avec accès à la valeur complète
- [ ] Une action primaire claire ; empty states orientés
- [ ] Labels complets, pas d’abréviations gratuites
- [ ] Aucun texte de remplissage ; chaque ligne apporte un fait
- [ ] Bans anti vibe slop (section 7) respectés
- [ ] Sur une landing : inspecteur taste sans FAIL (si le run taste a été fait)

---

## 7. Anti vibe slop (règles perso, génériques)

Ces règles **passent avant** les skills. Elles s’appliquent à tout projet UI / page.

1. **Pas de framing auto-promo « I built » / « We crafted ».** Montrer le travail, ne pas se raconter.
2. **Pas d’animations de texte en flou (blur-in).** Le texte apparaît net (opacity / translate OK si nécessaire et gated reduced-motion). Le blur décoratif sur du copy de landing est interdit, même si une recette `better-ui` en mentionne 4 px.
3. **Pas de formule eyebrow caps colorées + gros titre dramatique + résumé inutile** en phrases courtes séparées par des virgules. Y compris toute phrase isolée de ce type (« Unique prints, one per visual, coming soon. »). Chaque ligne doit ajouter un fait nouveau.
4. **Pas de boutons / cartes avec bordure gauche colorée** comme signature visuelle.
5. **Pas de boutons pilule à bordure colorée / dégradé avec point lumineux** (glow dot).
6. **Pas de points médians (`·`)** aléatoires entre les mots ou comme pastilles de statut. Préférer un pipe `|`, un tiret simple, ou une vraie phrase.
7. **Pas de polices serif display « élégantes » à la mode** (contraste élevé, serrées, fashion landing). Rester dans le système typo du projet.

**Compléments perso (même priorité) :**
- Aucun texte qui n’apporte rien : pas de remplissage, pas de doublon d’info déjà visible ailleurs.
- Labels complets, jamais abrégés pour faire joli. Si le menu ne tient pas : menu scrollable horizontalement, pas d’abréviations.

---

## 8. Sources

| Origine | Skills |
| --- | --- |
| [jakubkrehel/skills](https://github.com/jakubkrehel/skills) | `better-interface`, `interface-review`, `explain-interface`, `better-accessibility`, `better-layout`, `better-typography`, `better-colors`, `better-ui`, `better-writing`, `state-machine`, `break`, `variant`, `build-design` (+ `teardown` dans le repo, non détaillé ici) |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | `taste-skill` / install name `design-taste-frontend` |
| Humanizer amont + Wikipedia [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) | `humanizer` (add-on UI local possible) |
| Plugin / MCP Figma | `figma-use`, `figma-design-to-code`, `figma-generate-design`, `figma-generate-library`, `figma-implement-motion`, `figma-use-motion` |

Install typique :

```bash
npx skills add jakubkrehel/skills
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

Ce document résume le contenu réel des SKILL.md chargés ; pour les recettes CSS détaillées, ouvrir les fichiers `references/` de chaque skill.
