# SORATRO 0.10.0 — numérisation assistée

Branche de développement : `work/score-scanning-v0.10`. Base : `e791d78`, version 0.9.1. [Audit préalable](AUDIT-SCAN-V0.10.md). Le développement conserve l’application existante, sa gravure et son modèle de partition ; il ne crée pas d’APK.

## État de livraison

| Partie | État réel |
| --- | --- |
| Phase 1 : atelier, sources, préparation, zones, correction, sauvegarde et conversion | Opérationnelle, parcours assisté vérifié de bout en bout |
| Phase 2 : reconnaissance d’imprimés | Première version expérimentale ; cas contrôlés reconnus, validation humaine obligatoire |
| Phase 3 : manuscrits et documents difficiles | Saisie assistée et profils d’exemples disponibles ; aucun modèle universel de manuscrit |
| OCR des paroles, lecture automatique des reprises, D.C./D.S., tempo, tonalité et signature | Non implémentés ; saisie et outils musicaux existants à utiliser |
| Reconnaissance distante / modèle neuronal spécialisé | Non commencés ; aucun envoi d’image, serveur ou clé API |
| Sélection multiple et correction groupée de glyphes | Non implémentées ; sélection précise et navigation au clavier signe par signe |

La première version publiée est un atelier utilisable avec une reconnaissance locale limitée. Elle n’est pas une transcription automatique complète de FITIAVANA ou des manuscrits.

## Utilisation

1. Accueil → **Numériser une partition**, ou **Importer → Numériser une partition** dans un projet. Les trois onglets du ruban existant sont conservés.
2. Importer une image, plusieurs images ou un PDF multipage. La commande Photographier demande au navigateur une capture par la caméra arrière ; sa disponibilité dépend du navigateur et n’a pas été vérifiée sur un téléphone physique.
3. Préparer l’image : rotation, coins de recadrage/perspective, inclinaison, luminosité, contraste, netteté, grain, gris, noir/blanc adaptatif, correction du fond et inversion. Tous les traitements repartent d’un raster source conservé. Les petites composantes ne sont pas supprimées par une érosion morphologique. Il n’existe pas de gomme automatique de taches ; les zones « À ignorer » permettent de les exclure sans effacer les ponctuations.
4. Renseigner la tonalité et la signature. Le tempo initial de 72 est une valeur de lecture, pas une détection. Vérifier les registres absolus des voix dans les paramètres avancés.
5. Lancer la reconnaissance locale ou tracer directement une zone de musique/paroles. Pour une reconnaissance ciblée, définir sa voix, sa première mesure et son système ; relancer uniquement la zone sélectionnée si nécessaire.
6. Corriger et valider chaque zone. Un signe automatique est « à vérifier » ; « validé » signifie qu’une personne l’a confirmé. Un « ? » reste indéterminé. Les distances de formes affichées sont des distances réelles, jamais des pourcentages de confiance.
7. Importation : lire les anomalies, choisir la destination, afficher l’aperçu final, puis confirmer explicitement. Un import dans le projet ouvert constitue une opération Annuler/Rétablir. La création d’un projet ajoute une composition et conserve les anciennes.

Sur écran étroit, **Commandes** replie le panneau ; le passage au tracé le replie automatiquement. Original / Résultat reconnu / Comparaison et le zoom du document restent accessibles. Le document accepte le pincement et le défilement. La gravure numérique utilise le composant A4 existant.

## Convention de correction

- `|d:r.m:f,s,l:0|` : quatre temps ; le deuxième est divisé en deux et le troisième en trois.
- `:` sépare les temps ; `.` divise un temps en deux ; deux virgules divisent un temps en trois. Une moitié peut aussi se subdiviser en deux ou trois.
- `0` est un silence ; `-` prolonge une note précédente contiguë. Une prolongation isolée est refusée.
- `d'` ou `d^1` indique l’octave haute ; `d_1` l’octave basse. `_1` évite de confondre octave basse et virgule rythmique dans le texte corrigé.
- `di`, `ri`, `fi`, `si`, `ta` réutilisent les altérations du convertisseur existant ; `d/m` forme un accord.
- En 6/8, trois croches forment par défaut un temps ; l’option avancée permet de saisir six temps de croche.
- La levée s’exprime en noires. L’import superposé vérifie les longueurs de mesures ; une insertion incompatible avec une levée ou une voix verrouillée est refusée.

Les conventions imprimées qui ne correspondent pas à cette grammaire doivent être explicitées manuellement. Aucune quantification ou correction de durée n’est appliquée silencieusement. Le modèle conserve les temps exacts, y compris les tiers.

## Correction, sources et profils

Les glyphes portent leur boîte dans l’image préparée et un quadrilatère dans le raster original. Les ancrages se retrouvent par coordonnées source lors d’une nouvelle analyse. Une modification de préparation rend les anciennes zones obsolètes et bloque leur import jusqu’à révision/reconnaissance. Une zone validée ou corrigée n’est pas écrasée par une relance globale. Une relance ciblée demande confirmation et reste annulable.

Le clic sur une note reconnue sélectionne son signe source ; la sélection d’un signe retrouve la note correspondante. Après remplacement libre du texte d’une zone, la correspondance précise entre caractères n’est plus garantie : le lien porte sur la zone entière. Les anciens glyphes restent consultables, mais leur correction individuelle demande une relance pour éviter d’écraser le texte manuel. Les prolongations fusionnées dans une même note native se rattachent d’abord à son attaque.

Le découpage automatique d’une zone exige des barres localisées ; sans ces repères, l’utilisateur trace les zones au lieu de recevoir des coordonnées inventées. La fusion exige deux zones consécutives de la même voix.

Les profils enregistrent jusqu’à 256 masques réels de lettres/chiffres/signes de corps validés. Ces exemples participent effectivement à la comparaison des formes lors des analyses suivantes. La ponctuation repose sur la géométrie et les ancrages. Ce mécanisme n’entraîne pas de réseau neuronal. Les profils et leurs exemples peuvent être supprimés séparément des sessions.

Les paroles sont saisies/collées dans des zones distinctes, avec couplets, découpage syllabique et liens explicites aux notes ; plusieurs notes par syllabe permettent un mélisme. Un lien absent ou devenu invalide n’est pas inventé : la ligne reste dans le brouillon. Il n’y a pas encore d’OCR textuel des paroles.

## Conversion et protection des données

- Base musicale `soratro` v2 et base audio inchangées. Aucun effacement, migration ou réinitialisation des partitions, préférences ou historiques.
- Base indépendante `soratro-scans` v1 : sessions, catalogue léger, sources/rastérisations et profils. Métadonnées et nouveaux blobs s’enregistrent dans une transaction atomique.
- Sauvegardes sérialisées, révision optimiste contre les écrasements entre onglets, reprise et indication explicite des erreurs. En cas d’échec, les blobs en attente restent disponibles pour réessayer ; le brouillon ne prétend pas être sauvegardé.
- Historique de correction borné (25 états, budget de métadonnées d’environ 8 Mio) ; les images ne sont pas dupliquées dans l’historique.
- Limites : 24 Mio par fichier, 96 Mio sources et rasters par session, 24 pages, 40 mégapixels au décodage d’une image et 2,4 mégapixels pour le raster de travail. Le navigateur conserve son quota global habituel ; les erreurs de stockage restent visibles.
- Retirer une page est annulable et conserve ses fichiers pour l’historique. Supprimer volontairement une session efface ses sources et résultats, sans toucher aux projets ni aux profils.
- Les originaux peuvent être téléchargés avec leurs octets inchangés. Les sources privées ne sont jamais intégrées au projet `.soratro` ni envoyées à un service.
- L’import utilise `createProject`, `makeNote`, `copyMeasures`, `pasteBlock`, le validateur et le store existants. Le projet obtenu fonctionne avec le Piano Roll, les paroles, la lecture, la quantification et l’export actuels.
- L’option de brouillon incomplet omet les zones non validées et ajoute une indication « À vérifier » ; elle ne crée pas de notes arbitraires. SORATRO conserve son affichage de travail minimal de quatre mesures, même si une seule mesure a été reconnue.

## Moteur et résultats mesurés

PDF.js **6.4.299**, Apache-2.0, rasterise localement les PDF. Son worker, ses fontes standard et ses ressources WASM sont livrés et précachés ; aucune dépendance à un CDN. Les PDF protégés demandent une copie déverrouillée. Les PDF reposant sur des fontes/CMaps non embarqués complexes restent une limite de cette première configuration.

Le moteur **soratro-glyphs-1** effectue en worker : seuillage, composantes connexes, lignes et barres, règles de temps discontinues, comparaison de masques imprimés, ponctuation par position, ancrages, puis contrôle musical strict. Les modèles de formes proviennent de quatre fontes locales, trois tailles et deux graisses, plus les exemples de l’utilisateur.

Résultats reproductibles : [`scan-benchmark-v0.10.json`](scan-benchmark-v0.10.json), commande `npm run benchmark:scan`. Le jeu comporte 12 cas synthétiques avec référence explicite. Les fontes sont aussi présentes dans les modèles de comparaison : **ce n’est pas un corpus indépendant de précision générale**.

- Transcriptions exactes et conversion après validation dans les cas contrôlés : SATB 4/4 (16 notes), solo 2/4 (2), SA 3/4 (6), demi-temps/tiers SATB (24), 6/8 SATB (24), prolongations solo (2), imprimé légèrement flouté (16).
- Restent en correction : petite italique, octave haute dans la variante serif et page inclinée du banc. Les cas de notes sans séparation et de mesure irrégulière restent bloqués musicalement, même lorsque leurs caractères sont lus.
- **FITIAVANA réelle** : original privé examiné et testé localement ; 19 zones proposées, 48 composantes de barres et 95 signes indéterminés dans l’essai de page entière. Ces nombres ne sont pas une validation de segmentation : plusieurs barres sont fragmentées. Tonalité B♭ visible ; aucune référence rythmique complète n’a été inventée. Pas de mesure de précision musicale ni de transcription complète revendiquée. L’image n’est pas publiée dans le dépôt.

Les profils peuvent améliorer une écriture connue ; ils ne résolvent pas encore les lettres collées, les marques dégradées, toutes les conventions de ponctuation ou les manuscrits. La détection automatique d’inclinaison reste indicative ; le curseur manuel permet la correction.

## Validation et déploiement

- TypeScript et build GitHub Pages : vérifiés.
- `npm test` : **215 tests musicaux/stockage/image/moteur + 5 tests UI**, tous réussis.
- Suite Chromium complète : **89 parcours réussis** à l’étape de non-régression (83 existants et 6 premiers nouveaux parcours). Les parcours finaux ajoutent le fonctionnement PDF/reconnaissance hors ligne et les formats JPEG/WebP.
- Parcours nouveaux : création native avec aperçu obligatoire ; PDF deux pages, réordonnancement, retrait et annulation ; conservation SHA-256 de l’original ; reprise après rechargement ; SATB imprimé contrôlé et liens image–note ; vrai masque de profil ; insertion dans un projet et Annuler ; isolement de la suppression ; mobile 390 × 844 et pincement ; démarrage hors ligne du worker PDF ; validation des formats.
- Mise à jour PWA réelle **0.9.1 → 0.10.0** : 96 notes, préférences, zoom, curseur, projet et marqueur de contrôle préservés ; fermeture complète du navigateur et redémarrage hors ligne ; export PDF hors ligne ; aucune erreur de page.
- Android : émulation Chromium tactile ; aucun téléphone physique, caméra réelle ou périphérique MIDI physique disponible. Les tests existants couvrent néanmoins les messages MIDI simulés, l’enregistrement, l’audio/vocal, la quantification et les exports A4 multipages.

La publication ne doit prendre effet qu’après les contrôles de la branche et de GitHub Actions. Le statut effectif et le commit publié sont fournis dans le compte rendu de livraison, après vérification de `version.json` sur le site.

## Fichiers

- `src/recognition/` : types, documents, préparation, moteur imprimé, modèles de glyphes, worker/client, grammaire et conversion musicale, édition de zones, historique et dépôt séparé.
- `src/ui/ScoreScanWorkspace.tsx`, `ScanImage.tsx`, `useScanSession.ts`, `scan/` : atelier, affichage, sauvegarde, préparation, informations, correction, import et styles.
- `src/ui/App.tsx`, `ProjectFiles.tsx`, `workspace.css` : points d’entrée et commandes d’import.
- `scripts/prepare-scan-assets.mjs`, `benchmark-scan.mjs`, `test-ui.mjs` : ressources PDF locales, banc reproductible, prise en charge des URL d’assets Vite dans les tests UI Node.
- `tests/scan-*.test.ts`, `tests/e2e/scanning.spec.ts`, `tests/fixtures/scan/two-pages.pdf` : grammaire, conversion, images, stockage, adaptation et parcours réels. Les fixtures publiées sont synthétiques.
- `package.json`, verrou de dépendances, `src/music/model.ts`, `.gitignore` : version 0.10.0, PDF.js épinglé, ressources générées ignorées.

## Suites prioritaires

Constituer un corpus Solfa annoté avec autorisation et validation musicale, mesurer les erreurs par famille de signes et convention, améliorer segmentation et recalage des glyphes, ajouter l’OCR des paroles et la lecture des indications, puis évaluer un modèle spécialisé de manuscrit. Un éventuel service distant exige une architecture serveur et un consentement explicite séparé.
