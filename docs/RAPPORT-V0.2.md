# Rapport SORATRO V0.2

## Base et méthode

Évolution incrémentale depuis `17b58d40e104a3a869b2af1e4d4c5e29d3792ff7`, sans recréer SORATRO. README, rapport V0.1, modules et tests lus avant modification. Les 17 tests d’origine et le build Pages passaient. La page publiée répondait HTTP 200 avec les bundles du build de référence. La branche `work/v0.2` permet les builds natifs avant publication de `main`.

Version 0.2.0 après validation des fonctions principales. Le commit effectivement servi est inscrit automatiquement dans `/soratro/version.json` ; les contrôles Actions et publics seront consignés après exécution.

## Fonctions ajoutées

| Lot | Résultat implémenté |
| --- | --- |
| Sauvegarde | `.soratro` JSON complet, SHA-256, import validé sans écrasement, schéma 2, IndexedDB 2, snapshots espacés, prévisualisation/restauration/copie préalable |
| REC | Overdub, Replace, Punch, pré-roll et décompte 0/1/2/4, prises de boucle séparées, audition/choix/suppression, calibration robuste et réglage manuel |
| Édition | Pistes flexibles, huit signatures, anacrouse, changements ponctuels, timeline/repères, mesures/blocs multivoix, transposition avec Undo |
| Piano Roll | Sélections multiples/rectangle, déplacement/durée, clipboard, duplication, raccourcis, menu contextuel/appui long, snap, zoom, notes fantômes |
| Quantification | 1/2–1/32, triolets, composé, Auto, Strength et restauration conservant les éditions explicites |
| Paroles | Syllabes liées par voix, découpage espaces/tirets, correction, assignation lecture/Espace/clic, mélismes, couplets/refrain/commun |
| Partition | Gravure partagée SVG/PDF, largeur proportionnelle, voix/paroles alignées, systèmes/sauts/pagination, reprises et fins 1/2, indications |
| Export | PDF vectoriel avec police incorporée, A4/A5/Letter, portrait/paysage, paramètres, aperçu, SVG/PNG page/système/plage, impression |
| Répétition | Voix seule/dominante 100/30/ensemble, tempo 50–120 % sans transposition, boucles finies/infinies, mesure/paroles courantes |
| Audio/MIDI | Piano/piano doux/orgue/guide synthétique locaux, pan/master, PANIC, CC64, reconnexion et libération des notes |
| Android | Projet Capacitor, icône/splash/orientations, fichiers SAF, partage, impression, MIDI natif, suspension/reprise, workflow APK/lint |

## Corrections

Échecs d’autosave remontés par `flush` ; restaurations annulables avec copie ; formation Solo utilisant son vrai identifiant de voix ; Bb représenté par `ta` ; copie cohérente des notes et syllabes ; notes tenues affectées à la bonne prise avant NOTE OFF entre ticks ; compensation traversant un changement de tempo sans modifier les diagnostics ; déplacement préservant métriques, tempo, repères, fins et prises ; fin du projet de 100 mesures sans 101e mesure artificielle.

La PWA attend une activation après sauvegarde et conserve un cache précédent pour les anciens bundles. Les installations incomplètes sont supprimées, les caches d’autres projets restent intacts.

## Validation

`npm ci`, TypeScript et builds racine/Pages : réussis. Au checkpoint : 50 tests de cœur et 3 parcours React/JSDOM réussis. Les contrôles finaux/navigateur et builds distants seront ajoutés après exécution.

Couverture : export → suppression locale → import dans une autre base, égalité exacte ; migration V0.1 ; checksum/futurs schémas/imports invalides ; rétention ; panne autosave/retry ; Punch Replace protégeant extérieurs et autres voix ; trois prises ; note tenue entre ticks ; latence incohérente refusée ; transposition atomique ; move avec tempo/signatures/fins ; mélismes/couplets ; reprises/horloge ; CC64/panic/reconnexion ; redémarrage hors ligne et tous les assets à `/` et `/soratro/`, activation explicite et ancien lazy bundle.

Projet long : 100 mesures SATB, 2 400 notes, deux couplets, repères et reprise. Toutes les mesures paginées et PDF Unicode vectoriel généré. Le test limite la gravure à quatre secondes et 150 Mo supplémentaires. Poppler reconnaît le PDF et une page rendue a été inspectée. Cela ne démontre pas la fluidité d’un téléphone peu puissant.

## Migrations et format

Schéma musical 1 → 2 par ajout de champs, mêmes identifiants/hauteurs/événements/BPM historiques en noires. IndexedDB 1 → 2 ajoute `versions` sans remplacer `projects/preferences`. Checkpoints automatiques espacés d’environ cinq minutes si changement, regroupements temporels, 48 maximum / 30 jours. Historique local distinct du fichier portable.

Enveloppe `.soratro` : `format`, `formatVersion: 1`, `appVersion`, `exportedAt`, `checksum`, `project`. Projet : métadonnées, pistes/notes originales/éditées/quantifiées et diagnostics, prises, paroles/liens, tonalité/tempo/signatures, repères/reprises/indications, préférences et layout. JSON UTF-8, 32 Mo maximum. [Format documenté](FORMAT-SORATRO.md).

## Limites et essais non qualifiés

Reprises imbriquées/chevauchantes refusées. Courbes de ritardando, swing, fusion/comping de prises, import MIDI, cloud et liaison de phrasé éditable non implémentés. Les indications textuelles ne modifient pas automatiquement l’audio ; une fermata ne ralentit pas le transport. Première gravure avancée, à qualifier sur partitions denses. Images d’une sélection multipage : première page ; PDF : toutes les pages. La levée reste au début, sans déplacement/duplication comme mesure complète.

Chrome/Edge manuels, téléphone Android, PWA installée, multitouch physique, MIDI/pédale OTG et latence de la sortie sonore ne sont pas attestables sans matériel. Le navigateur distant a échoué ; JSDOM teste les composants, pas les navigateurs. Un APK debug compilé n’est pas une release Play Store qualifiée.

## Prochaines priorités

1. Qualification sur téléphone et clavier USB : composition/transfert/suspension/répétition.
2. Partitions Solfa réelles : paroles longues, rythmes denses, reprises et impressions.
3. Signature Android durable et qualification de production.
4. Indications expressives, regroupements irréguliers éditables et import MIDI avec migrations/tests.
