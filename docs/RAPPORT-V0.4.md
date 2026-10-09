# Rapport de reprise — SORATRO 0.4.0

Date : 9 octobre 2026. Dépôt : https://github.com/ZoNampoina/soratro

## Point de reprise vérifié

Le chat partagé et les deux demandes attachées ont été relus avant de modifier le code. La version 0.3.0 avait déjà été livrée : le dépôt, le site public et l’APK correspondaient au commit `926b27720af3f17760c4e4918fb1124f94a14b58`. La copie de travail d’origine et la nouvelle copie étaient propres. La branche ancienne `work/v0.3-ui` était un état intermédiaire de travaux déjà intégrés, pas une base pour recommencer.

| État retrouvé | Opérations |
| --- | --- |
| Terminées | Atelier persistant, édition Solfa directe, sélection commune, audio/REC, stockage, historique, exports, PWA et livraison 0.3.0 |
| Partiellement exécutées | Aucune modification non finalisée de la nouvelle demande trouvée dans les copies ni dans GitHub |
| Non commencées | Gravure traditionnelle approfondie, textes communs, objets musicaux, styles et outils de page de la seconde demande |

La reprise s’est donc faite sur la version fonctionnelle livrée, dans `work/v0.4-traditional`. L’audit détaillé est dans `AUDIT-REPRISE-V0.4.md`.

## Opérations réalisées

1. Étendu le modèle avec des champs optionnels, en gardant le schéma 2 et IndexedDB 2. La validation, l’import/export portable et le nettoyage des références prennent en charge les extensions.
2. Remplacé la ponctuation générique de la gravure par les temps et subdivisions traditionnels : octaves attachées, `:`, points, virgules et virgules inversées vectorielles. Conservé le Do mobile, les altérations et les hauteurs MIDI.
3. Calculé une grille temporelle commune aux voix. Ajouté la justification régulière/adaptative, l’ajustement des mesures denses, les sauts de systèmes/pages et les exceptions de largeur, quantité et espacement.
4. Affiché les noms des voix au premier système par défaut, avec les alternatives par page, toujours et jamais.
5. Créé un texte commun par groupe de voix, avec des associations syllabe-note indépendantes. Les corrections se propagent sans effacer les liens ; les rythmes différents conservent des lignes propres à chaque voix. Les couplets, refrains et mélismes restent distincts.
6. Ajouté les liaisons de durée, phrasé et mélisme. La liaison de durée supprime la réattaque de notes contiguës de même hauteur. Les liaisons et soufflets continuent aux changements de système.
7. Ajouté la bibliothèque filtrable des symboles, les respirations positionnées et les parcours D.C./D.S./Fine/Coda. Les reprises existantes restent actives. Les destinations sont contrôlées et la lecture refuse un parcours incomplet.
8. Ajouté les sous-modes de partition Lecture, Édition et Mise en page, les commandes proches de la musique, le contexte des mesures/symboles et les liaisons dans l’inspecteur.
9. Ajouté les champs d’en-tête/pied de page, la présence par page, la typographie, les couleurs, les logos incorporés et les styles personnels. L’aperçu permet application ou annulation ; appliquer crée une seule entrée d’historique. Le dialogue d’export respecte aussi cette règle.
10. Unifié les opérations de dessin SVG/PDF/PNG/impression, avec douze polices locales incorporables. Préservé la proportion des logos. Le cache hors ligne comprend les nouveaux fichiers.
11. Ajouté le vérificateur avec niveaux, mesure/voix, recommandation et navigation ; il ne corrige pas automatiquement la composition. La vérification figure aussi avant export.
12. Préparé la version 0.4.0 et l’APK avec `versionCode 4`, ainsi que la validation de la branche avant publication sur `main`.

## Vérifications

La base 0.3.0 a passé **61 tests Node, 4 tests React et 18 scénarios Chromium** avant les ajouts. La reprise ajoute **27 tests musicaux/données/export** et **7 scénarios Chromium**, soit **88 tests Node + 4 React + 25 Chromium** dans la version 0.4.

Les suites vérifient les signatures 2/4, 3/4, 4/4, 6/8, 9/8, 12/8, les groupements personnalisés, levées, subdivisions binaires/ternaires, rythmes mixtes, silences, continuations et octaves simples/doubles. Elles contrôlent les paroles SATB communes, le groupe SA, les rythmes divergents, corrections, insertions, mélismes, duplication et suppression. Elles développent D.C., D.S., al Fine et al Coda, avec reprises, destinations absentes et limites de parcours.

Les scénarios d’interface couvrent les clics, gestes multiples, raccourcis, verrous, préécoute, plein écran, panneau de paroles, styles, aperçu/application/annulation, Undo/Redo, PDF/SVG/PNG, impression, redémarrage froid hors ligne et formats mobiles 390×844 et 740×390. Un scénario Web Audio a vérifié les hauteurs réellement déclenchées par D.C. al Fine : `61, 63, 65, 66, 61, 63`.

Les PDF ont été rendus et inspectés, ainsi que les aperçus desktop. Les cas de 1, 5 et 10 pages, les accents, apostrophes, polices sérif obliques, pieds numérotés et la partition SATB de 100 mesures sont couverts. Une mesure dense mêlant subdivisions proches a été corrigée pendant cette validation.

Benchmark local (Node 24.19.0) : 100 mesures, 4 voix, 2 400 notes, 8 couplets / 1 600 syllabes, 25 pages / 50 systèmes ; gravure froide **349 ms**, médiane répétée **247 ms**, maximum **263 ms**. Ces valeurs décrivent l’environnement de test, sans prétendre mesurer la latence d’un téléphone physique.

La publication s’appuie sur les workflows Chromium et Android de la branche, puis sur le workflow Pages de `main` qui reconstruit, teste, déploie et publie l’APK du commit correspondant. Les exécutions et livraisons définitives sont consultables dans GitHub Actions et la release `v0.4.0`.

## Limites explicites

- Nuances, soufflets, accents, tenuto, phrasés, points d’orgue et rit./rall./accel. sont des indications d’impression ; leur absence d’interprétation audio est affichée. Les changements chiffrés de tempo et les parcours de navigation sont joués.
- Si les associations de paroles divergent, la gravure garde des lignes par voix plutôt que de forcer un regroupement trompeur.
- Les reprises imbriquées/chevauchantes restent refusées. Les renvois sont résolus par mesure entière, à sa fin. Un réglage de position précise uniquement la gravure du signe.
- Les styles personnels sont enregistrés sur l’appareil et contiennent la présentation. Le projet portable transporte sa mise en page appliquée, pas toute la collection des styles personnels.
- Les contrôles Android automatisés sont compilation et lint, plus simulation du navigateur mobile. Aucun appareil Android physique, clavier MIDI USB ou imprimante système n’était disponible pour qualifier ces comportements matériels. L’APK fournie est une APK debug de test.

Aucune remise à zéro du dépôt, aucune réécriture de l’historique publié et aucune recreation des fonctionnalités déjà livrées n’ont été nécessaires.
