# SORATRO 0.11.0 — audio de référence

Version qualifiée sur `feat/reference-audio-0.11`, base 0.10.1 `96a758af0944cf849b1c55cfbd0898234f10a452`. [PR nº 2](https://github.com/ZoNampoina/soratro/pull/2).

## Réalisé

- Transport dans l’en-tête, menu de projet compact, ruban libéré, palette native et contraste secondaire renforcés.
- Ctrl+Q commun au bouton Quantifier, sélection/voix active indiquée, timing original préservé et annulation ; précompte Aucun existant conservé.
- Replace par union des intervalles joués, ou région Punch explicite ; découpage des notes longues et protection des autres voix. Sélection/restauration des prises avec intervalles distincts.
- Import local des formats décodés par le navigateur, source inchangée, forme d’onde repliable, curseur, région, zoom, déplacement fin et glisser du décalage.
- Audio maître : horloge musicale par ancrages ; SORATRO maître : rendu adapté au tempo de la partition. WSOLA en worker pour la conservation de hauteur, vitesse 25–200 %, boucles et reprise depuis le curseur. Même horloge pour le MIDI et la compensation de latence existante.
- Estimation des pulsations/BPM avec validation manuelle et propositions d’ancrages ; aucun premier temps garanti automatiquement.
- Analyse monodique locale par région, seuil/confiance/plage/durée/fusion/octave, aperçu corrigible, ajout/suppression/scission/fusion, audition, quantification optionnelle, voix et insertion explicite annulable.
- Hauteurs concert ou écrites : alto +9, soprano +2, ténor +14 demi-tons, personnalisé. Tonalité de destination confirmée explicitement si différente.
- Métadonnées projet et blobs séparés, audio portable étendu, récupération des fichiers manquants, gestion des limites mémoire et fichiers inutilisés avec protection des projets/versions/annulations.

## Limites

Reconnaissance polyphonique et séparation : interfaces préparées, fonctions non livrées. Les mixages accompagnés doivent fournir une piste isolée. La confiance est une estimation de détection, pas une garantie de justesse. Vibrato large, glissando, réattaques rapides et sons bruités peuvent nécessiter une correction. Aucun enregistrement de saxophone ou de voix réels fourni pour la qualification.

Import : 80 Mo, 15 min, 32 millions d’échantillons décodés et rendus. Analyse d’un passage de 3 min maximum. La préparation du ralentissement peut prendre plusieurs secondes et consommer de la mémoire. Aux changements extrêmes de tempo, le WSOLA peut produire des artefacts et un nouveau rendu est nécessaire. Un audio manquant empêche la lecture synchronisée ; la partition reste accessible et le fichier peut être réaffecté. Les fichiers retirés sont conservés tant qu’un projet, une version ou l’annulation les référence.

Les modes Composition/Partition/Répétition partagent la piste. Passer entre Composition et Partition conserve la lecture ; une vitesse de répétition différente prépare une reprise depuis le même point. Aucun APK produit.

## Validation

| Contrôle | Résultat |
| --- | --- |
| Compilation TypeScript et Pages | Réussie ; avertissement de taille du bundle principal déjà présent |
| Tests du cœur | 237 réussis, dont 16 nouveaux ; [journal](validation-audio-v0.11/core-and-react.log) |
| Tests React | 5 réussis, dans le même journal |
| Suite Chromium complète | 105 réussis en 8,3 min ; [journal](validation-audio-v0.11/chromium-complete.log) |
| Contrôles audio/ruban après les dernières retouches | 15 réussis ; [journal](validation-audio-v0.11/chromium-audio-final.log) |
| Mise à jour réelle 0.10.1 → 0.11, puis fermeture complète | 96 notes, projet, préférence témoin, zoom et curseur 4,25 conservés |
| Redémarrage froid hors ligne après mise à jour | Réussi, PDF hors ligne produit, aucune erreur JavaScript ; [résultat](validation-audio-v0.11/pwa-upgrade.json) |
| CI GitHub de qualification | [Exécution verte](https://github.com/ZoNampoina/soratro/actions/runs/40820369963) |

Les scénarios couvrent les exports PDF/SVG/PNG, le curseur et les subdivisions, l’édition/paroles, les prises vocales, la numérisation et sa finalisation, le stockage/cache, le MIDI simulé, les dispositions mobiles et les raccourcis. Les tests propres à l’audio couvrent l’ancrage 12,400 s = mesure 3 temps 2, la pause/reprise, les boucles, le REC à partir du curseur, la quantification, le ralentissement PCM, les propositions corrigées/transposées, l’insertion annulable, l’export portable, la source manquante et l’analyse hors ligne. Les tests du cœur vérifient plusieurs ancrages à tempo variable, des intervalles remplacés disjoints et des notes longues, les couches de prises, la compensation positive/négative, la durée et la fréquence du signal WSOLA, les silences, le vibrato et les sauts d’octave synthétiques.

Les textes principaux, secondaires, discrets et accents des champs sur `surface-2` ont des rapports de contraste calculés de 5,75 à 13,58 en sombre et de 4,83 à 13,26 en clair. Les menus, options natives et dialogues utilisent la palette active ; les états désactivés gardent un traitement distinct. Il ne s’agit pas d’un audit d’accessibilité exhaustif de toute la partition.

Le processus de revue React a vérifié les effets et leur nettoyage, l’annulation des workers, les états asynchrones, le chargement conditionnel des panneaux, la borne de mémoire, les étiquettes et le nom accessible des dialogues. L’import réutilise son buffer décodé pour éviter une seconde copie coûteuse. Aucune bibliothèque de composants ni service externe ajouté.

## État par phase

| Phase | État |
| --- | --- |
| A — Interface, raccourcis, précompte, Overdub/Replace | Réalisée et testée |
| B — Audio de référence et synchronisation | Réalisée et testée sur signaux contrôlés et Chromium |
| C — Transcription monodique, correction, Solfa | Réalisée et testée sur signaux contrôlés ; qualification instrumentale réelle restante |
| D — Polyphonie et séparation | Interfaces de fournisseurs préparées ; moteurs non intégrés |

Moteurs retenus : Web Audio / AudioContext commun, WSOLA local original en worker, Pitchy 4.1.0 et segmentation Vocal déjà présents. **Dépendances ajoutées : aucune.** Basic Pitch et SoundTouchJS ont été étudiés ; aucun résultat d’évaluation instrumentale non réalisé n’est annoncé.

## Publication et utilisation

La version Web/PWA conserve l’adresse https://zonampoina.github.io/soratro/. La fusion de la PR nº 2 déclenche le workflow Pages existant, qui répète compilation, tests du cœur/React et scénarios Chromium avant de publier. Le commit effectivement servi se contrôle dans https://zonampoina.github.io/soratro/version.json. Aucun APK n’est construit : le workflow Android reste manuel.

Pour commencer : Composition → Audio de référence → Importer / régler l’audio. Importez un extrait, ouvrez Synchronisation et ancrages, réglez la correspondance, choisissez la voix et la source Clavier PC/MIDI, puis REC. Pour la transcription automatique, choisissez la région, Analyser les notes, corrigez l’aperçu et validez. Ctrl+Q quantifie selon la grille actuelle. Sur téléphone, les commandes secondaires se trouvent dans Projet et paramètres. Si l’ancienne version est encore ouverte, utilisez Sauvegarder & mettre à jour.

Restent à qualifier : fichiers de saxophone/chant réels, clavier USB et téléphone Android physique, cas difficiles de vibrato/glissando, polyphonie et séparation de sources. Aucun son n’a été envoyé à un service d’analyse distant.

## Fichiers créés et modifiés


| Fichier | Opération |
| --- | --- |
| `README.md` | Modifié |
| `docs/AUDIT-AUDIO-V0.11.md` | Créé |
| `docs/RAPPORT-AUDIO-V0.11.md` | Créé |
| `docs/validation-audio-v0.11/chromium-audio-final.log` | Créé |
| `docs/validation-audio-v0.11/chromium-complete.log` | Créé |
| `docs/validation-audio-v0.11/core-and-react.log` | Créé |
| `docs/validation-audio-v0.11/pwa-upgrade.json` | Créé |
| `docs/validation-audio-v0.11/results.json` | Créé |
| `package-lock.json` | Modifié |
| `package.json` | Modifié |
| `scripts/verify-pwa-update.mjs` | Modifié |
| `src/audio/engine.ts` | Modifié |
| `src/music/model.ts` | Modifié |
| `src/recording/replacement.ts` | Créé |
| `src/recording/session.ts` | Modifié |
| `src/recording/takes.ts` | Modifié |
| `src/reference/mapping.ts` | Créé |
| `src/reference/player.ts` | Créé |
| `src/reference/reference.worker.ts` | Créé |
| `src/reference/stretch.ts` | Créé |
| `src/reference/transcription.ts` | Créé |
| `src/reference/types.ts` | Créé |
| `src/reference/worker-client.ts` | Créé |
| `src/storage/audio-bundle.ts` | Modifié |
| `src/storage/migrations.ts` | Modifié |
| `src/storage/store.ts` | Modifié |
| `src/ui/App.tsx` | Modifié |
| `src/ui/AudioTranscriptionReview.tsx` | Créé |
| `src/ui/CommandRibbon.tsx` | Modifié |
| `src/ui/Dialog.tsx` | Modifié |
| `src/ui/ProjectFiles.tsx` | Modifié |
| `src/ui/ReferenceAudioPanel.tsx` | Créé |
| `src/ui/ReferenceWaveform.tsx` | Créé |
| `src/ui/reference.css` | Créé |
| `src/ui/ribbon.css` | Modifié |
| `src/ui/style.css` | Modifié |
| `tests/e2e/a4-engraving.spec.ts` | Modifié |
| `tests/e2e/aligned-web.spec.ts` | Modifié |
| `tests/e2e/app.spec.ts` | Modifié |
| `tests/e2e/cursor.spec.ts` | Modifié |
| `tests/e2e/editing.spec.ts` | Modifié |
| `tests/e2e/export-preferences.spec.ts` | Modifié |
| `tests/e2e/helpers.ts` | Modifié |
| `tests/e2e/presentation.spec.ts` | Modifié |
| `tests/e2e/reference-audio.spec.ts` | Créé |
| `tests/e2e/ribbon.spec.ts` | Modifié |
| `tests/e2e/scanning.spec.ts` | Modifié |
| `tests/e2e/temporal-grid.spec.ts` | Modifié |
| `tests/e2e/traditional.spec.ts` | Modifié |
| `tests/e2e/vocal.spec.ts` | Modifié |
| `tests/e2e/workspace.spec.ts` | Modifié |
| `tests/fixtures/reference-audio.ts` | Créé |
| `tests/recording-replacement.test.ts` | Créé |
| `tests/reference-audio.test.ts` | Créé |
