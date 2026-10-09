# Reprise SORATRO — 9 octobre 2026

Le chat partagé s’arrête après la livraison 0.3.0. Les deux fichiers de consignes ont été relus intégralement. La première demande (vingt améliorations d’interface) est livrée ; la seconde (notation traditionnelle, gravure, paroles communes, renvois et personnalisation) constitue le travail restant.

État réel avant modification : `main` à `926b27720af3f17760c4e4918fb1124f94a14b58`, version publique 0.3.0 du même SHA. Pages, Chromium et Android ont réussi ; release 0.3.0 avec APK. Aucune PR ouverte. La branche `work/v0.3-ui` est antérieure à la livraison. La copie de la session précédente et le clone de reprise sont propres, sans modification non enregistrée ni autre worktree.

La reprise conserve le socle 0.3.0 : vues persistantes, sélection commune, cadenas, préécoute, panneaux, Immersion, exports, stockage et mises à jour. Aucun de ces travaux n’est recréé.

Audit : README, rapports V0.2/V0.3, modèles musicaux, timeline, notation, gravure, métriques de police, paroles, édition, reprises, AudioEngine, UI, stockage/migrations, fichiers portables, tests, PWA, Capacitor et workflows. La compilation Pages passe ; les 61 tests Node et 4 parcours React passent après compilation préalable. Les tests offline exigent les ressources `dist` ; compilation puis tests doivent rester séquentiels. Chromium doit être installé dans ce nouvel environnement pour reprendre ses 18 parcours.

Restant avant développement : ponctuation générée depuis les véritables frontières métriques ; octaves attachées à la lettre et séparées des signes rythmiques ; justification régulière/adaptative ; labels au premier système ; paroles à contenu partagé et liens individuels ; navigation D.C./D.S./Fine/Coda ; signes et liaisons distincts ; en-têtes/pieds, styles et ajustements manuels ; sous-espaces Lecture/Édition/Mise en page ; contrôle automatique ; tests et publication de l’ensemble.

Conventions vérifiées dans John Curwen, *Tonic Sol-fa*, chapitre Time : point pour les moitiés, virgule pour les quarts, deux virgules inversées pour les tiers, tiret de prolongation et vide pour le silence. Source primaire : https://archive.org/stream/cu31924021797547/cu31924021797547_djvu.txt (passage autour des lignes 2232–2246). SORATRO conserve les apostrophes/virgules d’octave et altérations existantes demandées, et expose la pulsation composée plutôt que d’assimiler 6/8 à six noires.

Les nouvelles données sont des extensions optionnelles du schéma 2 ; le format `.soratro` version 1, IndexedDB v2 et le timing brut restent conservés. Les décisions et résultats finaux sont consignés dans le rapport V0.4.
