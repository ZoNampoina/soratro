# SORATRO 0.9.1 — ruban compact

## Demande et audit

La zone supérieure empilait l’en-tête, le transport, les outils de composition, les modes, les sous-modes Partition et la barre de zoom. Certaines règles mobiles ajoutaient une seconde ligne d’en-tête, des retours à la ligne et un décalage vertical de transport. Le déplacement automatique de la mini-timeline faisait aussi défiler ses ancêtres lorsqu’elle était intégrée dans un ruban horizontal.

## Modifications

- En-tête de projet sur une ligne, actions de fichier compactes avec noms accessibles et infobulles.
- Onglets Composition, Partition et Répétition, bouton Paroles et accès aux dispositions.
- Une rangée de groupes : Lecture, Position, Vue, Composer, Repères, Quantification, Partition, Répétition, Tempo, Enregistrement et Tonalité et mesure, selon le mode actif.
- Repli par la flèche ou double-clic sur un onglet. Lecture, Stop, REC et Aller à… restent disponibles ; le réglage `workspace-v1.toolbar` existant mémorise ce choix.
- Défilement horizontal borné aux groupes, avec flèches et accès clavier/tactile. Le REC mobile conserve une hauteur de 44 px. La barre de zoom défile sans tronquer ses contrôles.
- Timeline : seul son propre défilement suit la mesure courante, sans entraîner le ruban entier.
- Les styles compacts excluent les dialogues natifs ouverts depuis un groupe, notamment Aller à…, afin de conserver la taille habituelle de leurs champs et boutons.

Les actions réutilisent leurs gestionnaires existants. Piano Roll et Partition restent montés pendant les changements de mode. Aucun changement du schéma de projet, de la base IndexedDB, du moteur de gravure, de la pagination ou du moteur audio.

## Mesures comparatives

Même partition SATB de sept mesures importée dans les deux compilations, thème clair, onglet Partition. Position du haut de la zone défilante de partition, en pixels CSS :

| Écran | 0.9.0 | 0.9.1 ouvert | 0.9.1 replié | Réduction, ouvert |
| --- | ---: | ---: | ---: | ---: |
| 1920 × 1080 | 275 | 180 | 146 | 35 % |
| 1366 × 768 | 275 | 180 | 146 | 35 % |
| 390 × 844 | 387 | 181 | 155 | 53 % |
| 740 × 390 | 234 | 181 | 155 | 23 % |

Les coordonnées et tailles des notes, ponctuations et colonnes des SVG ont été comparées entre les deux versions : identiques. [Mesures brutes](validation-v0.9.1/comparison.json), [capture ordinateur](validation-v0.9.1/ribbon-desktop.png), [capture téléphone](validation-v0.9.1/ribbon-mobile.png). Ces chiffres concernent cette configuration ; des panneaux facultatifs ouverts prennent leur propre espace.

## Vérifications

- Compilation TypeScript et GitHub Pages réussie ; avertissement de taille de bundle déjà présent.
- 193 tests du cœur et cinq tests UI réussis.
- Suite navigateur complète : 82/83 réussis au premier passage final. Le test du double-tap synthétique après rotation a été intermittent pendant des vérifications concurrentes ; sa [revalidation isolée](validation-v0.9.1/gesture-recheck.log) réussit trois fois de suite, sans modification du code du geste ni du test. Les cinq nouveaux tests du ruban réussissent. [Journal complet](validation-v0.9.1/browser-tests.log).
- [Contrôle complémentaire du curseur et du ruban](validation-v0.9.1/dialog-controls.log) : 20 scénarios réussis après exclusion des dialogues natifs des styles compacts, avec vérification de la typographie des champs.
- Comparaison reproductible et captures aux quatre tailles via `scripts/verify-ribbon.mjs`.
- [Mise à jour réelle 0.9.0 → 0.9.1](validation-v0.9.1/pwa-update.json) : projet de 96 notes et préférence témoin identiques, zoom du Piano Roll conservé, curseur à 4,25 conservé après fermeture complète et redémarrage hors ligne ; PDF hors ligne produit sans erreur JavaScript.
- Mobile : essais Chromium avec dimensions Android et événements tactiles ; aucun appareil Android physique disponible dans cet environnement.

## Publication

La version 0.9.1 est destinée au site existant https://zonampoina.github.io/soratro/, via le workflow GitHub Pages déjà en place. Celui-ci répète la compilation, les tests du cœur, les tests UI et les 83 tests navigateur avant de déployer. `version.json` permet de contrôler la version et le commit effectivement servis.
