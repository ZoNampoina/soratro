# SORATRO V0.2

Atelier de composition chorale en notation Solfa : jouer au piano, enregistrer le timing, corriger, quantifier, lire les quatre voix et sauvegarder sur l’appareil.

La V0.1 reprend la structure SATB et les regroupements en 6/8 de la partition IRAKA fournie comme référence. L’étude de démonstration est un exemple, pas une transcription intégrale d’IRAKA.

## Site Web

Adresse GitHub Pages : https://zonampoina.github.io/soratro/

Le workflow `.github/workflows/pages.yml` compile, vérifie les tests et publie automatiquement les changements de `main`. Il peut également être lancé depuis l’onglet Actions. Dans Settings → Pages, la source de publication doit être **GitHub Actions**.

Pour compiler cette version localement : `npm run build:pages`. Les ressources, l’installation PWA et le cache hors ligne restent dans le dossier `/soratro/`. La commande `npm run build` conserve une compilation pour une adresse à la racine.

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

Clavier PC : A W S E D F T G Y H U J K O L P ;. Z / X changent l’octave. Espace lit ou met en pause ; pendant REC, Espace arrête. Ctrl+Z annule, Ctrl+Shift+Z ou Ctrl+Y rétablit, Suppr supprime la note sélectionnée.

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

Le projet Capacitor 8 est dans `android/`, avec sélecteur de fichiers, partage, impression et MIDI natif. Le workflow Android compile un APK de test ; voir [Android](docs/ANDROID.md). La PWA reste installable et hors ligne. Une mise à jour attend la sauvegarde avant activation.

## Vérification

```sh
npm run build
npm test
```

Les tests automatisés couvrent le cœur musical, le stockage et le cache hors ligne à la racine ainsi que sous `/soratro/`. Le [rapport V0.2](docs/RAPPORT-V0.2.md) détaille les nouveautés, tests et limites. Le [rapport V0.1 conservé](SORATRO_V0.1_Rapport.md) détaille les résultats initiaux et les essais qui nécessitent encore un téléphone ou un vrai clavier MIDI. Le banc de test navigateur est accessible en développement à `/tests/browser.html`.

## Fonctions V0.2

- **Enregistrement** : Overdub/Replace, Punch, pré-roll, prises de boucle, audition et choix. **Audio → Calibration** : clics/frappes, compensation et réglage manuel.
- **Mesures / Structure** : passages multivoix, timeline, repères, signatures/tempo ponctuels, levée, reprises avec fins 1/2. Formation flexible et renommage des voix.
- **Piano Roll** : sélection multiple/rectangle, copie/duplication, zoom, snap, ghost notes, menu contextuel. Quantification 1/2–1/32, triolets, Auto et Strength.
- **Paroles** : espaces/tirets, syllabes corrigibles, liens aux notes, assignation Espace en lecture/clic, mélismes, couplets, refrain et texte commun.
- **Partition / PDF / Export** : mêmes données musicales, mise en page par systèmes/pages, alignement des voix et paroles, PDF vectoriel A4/A5/Letter avec police locale, SVG/PNG et impression.
- **Répétition** : voix seule/dominante 100 % / 30 %/ensemble, 50–120 % sans changer la hauteur, boucle par mesures finie/infinie.
- **Audio/MIDI** : quatre sons locaux légers, pan/master, sustain CC64, reconnexion et PANIC.

Raccourcis ajoutés : R (REC), M (métronome), L dans le Piano Roll (boucle), Ctrl+C/X/V/D (copier/couper/coller/dupliquer), Ctrl+A dans le Piano Roll, flèches (déplacement). Les champs et dialogues suspendent les raccourcis musicaux. Les fonctions futures non implémentées sont détaillées dans le rapport.
