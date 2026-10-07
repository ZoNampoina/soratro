# SORATRO V0.1

Atelier de composition chorale en notation Solfa : jouer au piano, enregistrer le timing, corriger, quantifier, lire les quatre voix et sauvegarder sur l’appareil.

Le prototype reprend la structure SATB et les regroupements en 6/8 de la partition IRAKA fournie comme référence. L’étude de démonstration est un exemple, pas une transcription intégrale d’IRAKA.

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

1. Créer IRAKA : Do = Db, 6/8, 72 BPM.
2. Choisir Soprano, appuyer sur REC et attendre le décompte.
3. Jouer avec la souris, les doigts, un clavier MIDI, ou les touches du PC.
4. Arrêter, quantifier, puis déplacer une note ou modifier sa durée.
5. Lire, sélectionner Alto et enregistrer une seconde voix.

Clavier PC : A W S E D F T G Y H U J K O L P ;. Z / X changent l’octave. Espace lit ou met en pause ; pendant REC, Espace arrête. Ctrl+Z annule, Ctrl+Shift+Z ou Ctrl+Y rétablit, Suppr supprime la note sélectionnée.

## Convention musicale

La timeline est exprimée en noires, indépendamment du tempo. En 6/8, une mesure contient 3 unités et six croches de 0,5 unité. Le BPM correspond à la noire. Les croches 1 et 4 portent les accents fort et moyen. Une noire pointée dure 1,5 unité.

Le Do mobile dépend de la tonalité choisie : C D E F G en Do=C et Db Eb F Gb Ab en Do=Db deviennent d r m f s. Les hauteurs MIDI restent inchangées. Les octaves et altérations sont des données structurées avant leur affichage.

Les secondes brutes NOTE ON/OFF, les positions originales et les positions quantifiées sont conservées séparément. Les modifications de notes utilisent les positions éditées sans effacer le timing brut. La restauration du jeu original concerne le timing.

## Stockage et confidentialité

Les projets et préférences sont enregistrés dans IndexedDB, sur cet appareil et pour ce navigateur. Aucun compte, serveur musical ou service cloud n’est nécessaire. La sauvegarde se déclenche à chaque modification terminée et chaque note relâchée. Une note tenue se termine lorsque l’enregistrement s’arrête ou quand l’application passe à l’arrière-plan.

Ne pas effacer les données du navigateur pour ce site si vous souhaitez conserver vos projets. La synchronisation et l’export de projets ne sont pas inclus dans V0.1.

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

`capacitor.config.ts` prépare le nom, l’identifiant et le dossier Web pour Android. Les dépendances natives et l’APK restent à réaliser dans V0.2. L’interface Web peut déjà être installée comme PWA.

## Vérification

```sh
npm test
npm run build
```

Le rapport de validation détaillera les résultats et les vérifications qui nécessitent encore un téléphone ou un vrai clavier MIDI.
