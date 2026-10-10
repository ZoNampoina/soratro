# SORATRO
## Version 0.6.0

Les mesures partagent une grille de colonnes, y compris la dernière ligne incomplète. La taille Solfa reste celle du document ; les lignes impossibles à composer sont signalées sans réduction de police. Mise en page sépare les réglages, les favoris et l’aperçu, avec un éditeur plein écran sur téléphone. Le zoom tactile, les menus, l’espace musical et le partage Web sont adaptés aux petits écrans. Voir [le guide Web](docs/WEB-LAYOUT-V0.6.md), [l’audit](docs/AUDIT-V0.6.md) et [le rapport de livraison](docs/RAPPORT-V0.6.md).

Les crédits multilingues et multiples, la numérotation, la justification et les symboles par clic complètent la gravure traditionnelle. Le Tap Tempo et la source Vocal utilisent le transport, le Recorder et les prises existants. L’analyse de hauteur et les audios originaux facultatifs restent locaux. Voir [le guide](docs/VOCAL-TAP-PRESENTATION.md), [le rapport](docs/RAPPORT-V0.5.md), [l’audit](docs/AUDIT-V0.5.md) et [les notes de version](docs/RELEASE-V0.5.md).


Atelier de composition chorale en notation Solfa : jouer au piano, enregistrer le timing, corriger, quantifier, lire les quatre voix et sauvegarder sur l’appareil.

La V0.1 reprend la structure SATB et les regroupements en 6/8 de la partition IRAKA fournie comme référence. L’étude de démonstration est un exemple, pas une transcription intégrale d’IRAKA.

## Site Web

Adresse GitHub Pages : https://zonampoina.github.io/soratro/

Le workflow `.github/workflows/pages.yml` compile, vérifie les tests et publie automatiquement les changements de `main`. Il peut également être lancé depuis l’onglet Actions. Dans Settings → Pages, la source de publication doit être **GitHub Actions**.

Pour compiler cette version localement : `npm run build:pages`, puis `npm run preview -- --base=/soratro/` pour l’aperçu correspondant. Les ressources, l’installation PWA et le cache hors ligne restent dans le dossier `/soratro/`. La commande `npm run build` conserve une compilation pour une adresse à la racine.

## Lancement

Node.js 22.18+ (24 recommandé), npm et Chrome / Edge récents.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée par Vite. Pour tester l’installation et le cache hors ligne :

```sh
npm run build
npm run preview
```

Le service worker est activé dans la version compilée. La PWA demande HTTPS, ou `localhost` sur le PC ; une simple adresse HTTP du réseau local n’offre pas les mêmes garanties. Sur Android, ouvrir l’URL HTTPS déployée une première fois, attendre « Disponible hors ligne », puis installer l’application depuis Chrome.

## Premier essai

1. Créer IRAKA : SATB, Do = Db, 6/8, ♩. = 72. Choisir l’unité de tempo affichée.
2. Choisir Soprano, appuyer sur REC et attendre le décompte.
3. Jouer avec la souris, les doigts, un clavier MIDI, ou les touches du PC.
4. Arrêter, quantifier, puis déplacer une note ou modifier sa durée.
5. Lire, sélectionner Alto et enregistrer une seconde voix.

Clavier PC : A W S E D F T G Y H U J K O L P ;. Z / X changent l’octave. Espace lit ou met en pause ; pendant REC, Espace arrête. B ouvre le Tap Tempo ; R lance ou arrête REC. Ctrl+Z annule, Ctrl+Shift+Z ou Ctrl+Y rétablit, Suppr supprime la note sélectionnée.

## Convention musicale

La timeline est exprimée en noires, indépendamment du tempo. En 6/8, une mesure contient 3 unités et six croches de 0,5 unité. Le BPM interne correspond à la noire ; l’interface peut exprimer le tempo à la noire pointée ou à la croche sans changer la musique. Les croches 1 et 4 portent les accents fort et moyen. Une noire pointée dure 1,5 unité.

Le Do mobile dépend de la tonalité choisie : C D E F G en Do=C et Db Eb F Gb Ab en Do=Db deviennent d r m f s. Les hauteurs MIDI restent inchangées. Les octaves et altérations sont des données structurées avant leur affichage.

Les secondes brutes NOTE ON/OFF, les positions originales et les positions quantifiées sont conservées séparément. Les modifications de notes utilisent les positions éditées sans effacer le timing brut. La restauration du jeu original concerne le timing.

## Stockage et confidentialité

Les projets et préférences sont enregistrés dans IndexedDB, sur cet appareil et pour ce navigateur. Aucun compte, serveur musical ou service cloud n’est nécessaire. La sauvegarde se déclenche à chaque modification terminée et chaque note relâchée. Une note tenue se termine lorsque l’enregistrement s’arrête ou quand l’application passe à l’arrière-plan.

Exporter régulièrement un fichier `.soratro` protège contre l’effacement des données du navigateur. Importer ce fichier sur un autre appareil restaure la composition complète. Historique prévisualise et restaure des snapshots espacés, avec duplication préalable activée par défaut. Aucun cloud n’est nécessaire. Voir [le format](docs/FORMAT-SORATRO.md).

## Architecture

- `src/music/` : projet, pistes, notes, métrique en temps.
- `src/audio/` : synthèse légère, mixer, métronome et scheduling Web Audio anticipé.
- `src/recording/` : événements NOTE ON/OFF et sessions d’enregistrement.
- `src/quantization/` : quantification non destructive et restauration.
- `src/solfa/` et `src/score/` : Do mobile et placement vectoriel commun aux quatre voix.
- `src/storage/` : IndexedDB, autosave, historique Undo/Redo.
- `src/midi/` : entrées Web MIDI et gestion de la déconnexion.
- `src/ui/` : interface React, piano tactile, Piano Roll et partition SVG.
- `scripts/generate-sw.mjs` : cache de tous les fichiers locaux de la version compilée.

Le projet Capacitor 8 est dans `android/`, avec sélecteur de fichiers, partage, impression et MIDI natif. Le workflow Android est désormais manuel ; la publication Web ne produit ni ne publie d’APK. Voir [Android](docs/ANDROID.md) pour les travaux natifs antérieurs. La PWA reste installable et hors ligne. Une mise à jour attend la sauvegarde avant activation. Pour le premier passage V0.1 → V0.2, fermez tous les onglets SORATRO et la PWA, puis rouvrez le site : la V0.1 ne possède pas encore le bouton de mise à jour. Ne supprimez pas les données du navigateur.

## Vérification

```sh
npm run build:pages
npm test
npx playwright install chromium
npm run test:browser
```

Les tests automatisés couvrent le cœur musical, le stockage et le cache hors ligne à la racine ainsi que sous `/soratro/`. Le [rapport V0.3](docs/RAPPORT-V0.3.md) détaille les nouveautés, tests et limites. Le [rapport V0.2](docs/RAPPORT-V0.2.md) est conservé pour le suivi des évolutions. Le [rapport V0.1 conservé](SORATRO_V0.1_Rapport.md) détaille les résultats initiaux et les essais qui nécessitent encore un téléphone ou un vrai clavier MIDI. Le banc de test navigateur est accessible en développement à `/tests/browser.html`.

## Fonctions V0.2

- **Enregistrement** : Overdub/Replace, Punch, pré-roll, prises de boucle, audition et choix. **Audio → Calibration** : clics/frappes, compensation et réglage manuel.
- **Mesures / Structure** : passages multivoix, timeline, repères, signatures/tempo ponctuels, levée, reprises avec fins 1/2. Formation flexible et renommage des voix.
- **Piano Roll** : sélection multiple/rectangle, copie/duplication, zoom, snap, ghost notes, menu contextuel. Quantification 1/2–1/32, triolets, Auto et Strength.
- **Paroles** : espaces/tirets, syllabes corrigibles, liens aux notes, assignation Espace en lecture/clic, mélismes, couplets, refrain et texte commun.
- **Partition / PDF / Export** : mêmes données musicales, mise en page par systèmes/pages, alignement des voix et paroles, PDF vectoriel A4/A5/Letter avec police locale, SVG/PNG et impression.
- **Répétition** : voix seule/dominante 100 % / 30 %/ensemble, 50–120 % sans changer la hauteur, boucle par mesures finie/infinie.
- **Audio/MIDI** : quatre sons locaux légers, pan/master, sustain CC64, reconnexion et PANIC.

Raccourcis ajoutés : R (REC), M (métronome), L dans le Piano Roll (boucle), Ctrl+C/X/V/D (copier/couper/coller/dupliquer), Ctrl+A dans le Piano Roll, flèches (déplacement). Les champs et dialogues suspendent les raccourcis musicaux. F10 active Immersion et Échap restaure la disposition précédente. Les fonctions et limites de qualification sont détaillées dans le rapport.


## Espace de travail V0.3

Les vues Piano Roll et Solfa restent montées lorsque le mode change. Zoom, défilement, voix active et sélection sont mémorisés par projet ; les panneaux, dimensions, préréglages et préférences Solfa sont enregistrés séparément sur l’appareil.

- **Disposition** : pistes ouvertes/réduites/masquées, ruban et clavier rabattables, inspecteur facultatif, séparateurs souris/tactile/clavier et cinq dispositions. F10 / Échap : Immersion avec restauration de la disposition. Le plein écran Partition possède sa propre commande et un repli interne.
- **Navigation** : sélection commune par identifiant, synchronisation facultative, zoom sur la sélection, cadrages automatiques du Piano Roll et de la partition, navigateur pages/systèmes/mesures/repères. La navigation manuelle suspend le suivi de lecture pendant quatre secondes ; « Revenir à la lecture » le reprend immédiatement.
- **Édition** : Ctrl/Cmd ajoute ou retire, Shift étend, glisser le fond trace un rectangle. Le bouton Multi remplace Ctrl au tactile. Flèches, copie/duplication/suppression, quantification et alignements s’appliquent au groupe en une opération Undo. Les cadenas bloquent l’édition et REC sans empêcher lecture, sélection ou mixer.
- **Solfa** : silences masqués par défaut, prolongations et séparateurs réglables, trois préréglages. L’inspecteur change degré, altération, octave, MIDI, position et durée directement dans la partition en respectant le Do mobile. Une préécoute courte peut être désactivée ou réglée.
- **Export** : fenêtre responsive à paramètres et aperçu indépendants, pied toujours accessible, redimensionnement PC, navigation et zoom multipage. Papier, orientation, marges, notes, paroles et pagination restent dans le projet. Format, fenêtre et cadrage d’aperçu restent sur l’appareil. PDF vectoriel, SVG, PNG et impression utilisent la même gravure ; les couleurs de voix sont facultatives à l’export, désactivées par défaut.

« Réinitialiser la disposition » restaure les panneaux standard sans toucher à la musique. La sauvegarde `.soratro`, les projets V0.1/V0.2, les prises, les paroles et les timings originaux sont conservés. Voir [l’audit](docs/AUDIT-V0.3.md), [les notes de version](docs/RELEASE-V0.3.md) et [le rapport](docs/RAPPORT-V0.3.md).

`npm run benchmark` mesure la gravure du scénario de 100 mesures SATB avec 2 400 notes et huit couplets. Les résultats dépendent du matériel et ne remplacent pas la qualification sur téléphone physique.
