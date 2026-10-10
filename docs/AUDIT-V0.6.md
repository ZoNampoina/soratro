# Audit SORATRO Web 0.6

## Point de départ

Audit du 10 octobre 2026 sur `main`, commit [`9c45672ca3e35b914a96248014145eac6168384d`](https://github.com/ZoNampoina/soratro/commit/9c45672ca3e35b914a96248014145eac6168384d). La version réellement servie est **0.5.0**, avec les bundles `index-BRvvVGk5.js` et `index-D9kJf9wT.css`, identiques à la compilation de ce commit. Les derniers workflows Pages et Chromium sont terminés avec succès. Aucun travail local à conserver n’était présent dans le checkout initial.

Les commits précédents ajoutent la présentation/Vocal/Tap Tempo (0.5), la gravure traditionnelle (0.4) et l’espace de travail persistant (0.3). Le dernier correctif impose déjà correctement le nombre demandé de mesures par ligne : cette règle est conservée.

Modules examinés : gravure, géométrie rythmique, préférences Solfa, modèle et validation, PageLayout, PrintPreview, SolfaScore, PianoRoll, App, CSS, stockage, PWA et workflows. Les tests initiaux passent : **107 tests unitaires et 4 tests d’interface**, après compilation.

## Problèmes reproduits

| Problème | Reproduction sur le code initial | Cause |
| --- | --- | --- |
| Colonnes variables | Sept mesures, quatre par ligne : largeur 156,579 px sur la première ligne, 146,240 px sur la seconde ; la mesure 6 commence à 256,933 px au lieu de 267,272 px. | Largeurs calculées et justifiées indépendamment pour chaque système. |
| Police réduite sans avertissement | Quatre mesures denses forcées en A5, taille Solfa 17 : notes effectivement composées à 1,761 ou 2,348 px. | `noteSize * Math.min(1, shrink)` dans la gravure. |
| Taille du document influencée par les préférences | Le coefficient `display.noteScale` transforme la taille de référence avant la gravure. | Préférence visuelle mêlée à la typographie imprimée. |
| Paramètre redondant | Les deux contrôles de PageLayout écrivent `measuresPerSystem`. | Deux présentations du même champ, dont une dans les réglages de systèmes. |
| Réglages mobile encombrants | Fenêtre de page divisée entre une grande zone de réglages et un aperçu réduit. | Disposition PC simplifiée plutôt qu’un éditeur mobile dédié. |
| Menus aux bords | Positionnement basé sur une hauteur supposée plutôt que la taille réelle. | Absence de mesure et d’adaptation au viewport visuel. |
| Partage Web absent | Le partage de fichiers est présenté uniquement pour Capacitor. | Chemin natif sans repli Web Share/téléchargement. |
| Packaging automatique | Le push déclenche un workflow Android et Pages peut publier une release APK. | Couplage du déploiement Web et de la livraison native. |

La version 0.6 conserve le modèle musical, le schéma 2, IndexedDB v2, le transport, les prises, les timings originaux, les symboles et les outils déjà opérationnels. Le projet Capacitor et ses dépendances sont conservés. Aucun packaging natif n’est lancé pour cette mission.
