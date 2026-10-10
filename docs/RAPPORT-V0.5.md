# SORATRO 0.5.0 — rapport technique

Base auditée : 0.4.0, commit `57d48363b089abd13b15b423ae2b7ddf7ff6ea91`. La copie de travail et les branches étaient propres, le site annonçait ce commit, et les 117 contrôles de la version livrée passaient. La branche `work/v0.5-vocal` complète cette base. Aucun chantier précédent n’a été recommencé.

## Changements

| Domaine | Résultat |
| --- | --- |
| Crédits | Langue documentaire Français/Malagasy/Personnalisé, abrégé, libellés par rôle et par personne, noms multiples, ordre, visibilité et regroupement ; champs auteur/compositeur historiques conservés |
| Lignes | Auto ou 1–12 mesures, défaut quatre, exceptions locales et avertissement de densité ; justification pleine/naturelle/centrée/auto indépendante de la grille rythmique |
| Numéros | Chaque mesure, début de système, début de page ou aucun ; taille, position, couleur, espacement, préfixe, départ et levée |
| Symboles | Tracés communs à l’impression, recherche, favoris/récents persistants, aperçu et explication audio, placement par clic/tactile, glissement, position numérique, suppression et Undo |
| Édition de page | Sélection contextuelle des crédits, en-têtes/pieds, numéros, systèmes et symboles ; aperçu avant application atomique |
| Profils | Épuré, Répétition chorale, Recueil, Impression professionnelle ; styles personnels conservés |
| Tap | Horloge monotone, trois frappes minimum, médiane/rejet des anomalies, stabilisation, pause/reset, limites, conversions d’unité, projet ou mesure, application après REC |
| Vocal | Source distincte PC/MIDI/Vocal ; micro local, AudioWorklet, worker McLeod/FFT, segmentation et événements du Recorder commun |
| Correction | Timings audio/bruts/corrigés/quantifiés distincts, lissage facultatif, chromatismes conservés, suggestions de tonalité à confirmer, marqueurs d’incertitude et inspecteur |
| SATB/prises | Chaque REC conserve une prise, couches, écoute des autres voix, mixer/verrous, Punch et boucles, confirmation Replace, restauration des notes traversant une zone et des liens de paroles/phrasé |
| Audio | Conservation facultative du flux original, base blob distincte, écoute comparative, taille/durée/capacité, suppression explicite, archive portable contrôlée par SHA-256 |
| Offline/Android | Worker et capture incorporés au cache, bases conservées pendant les mises à jour, arrêt du micro en arrière-plan ; permissions Android et versionCode 5 |

Le format `.soratro` reste en version 1 et le modèle en schéma 2 ; IndexedDB des projets reste en version 2. Les fichiers antérieurs sans nouveaux réglages gardent leurs conventions. Les métadonnées audio sont des références, les blobs restent séparés. Le cache PWA ne supprime pas les bases.

## Chaîne vocale et mesures

Le clic REC autorise le micro, puis ouvre le transport existant. Les fenêtres audio portent le timestamp du même AudioContext. Le worker analyse 2048 échantillons à 24 kHz, toutes les 10 ms, soit une fenêtre de 85,33 ms. Le segmenter filtre bruit/incertitude et fluctuations ; les notes obtenues traversent le Recorder, la compensation, les grilles, les prises et la gravure Solfa existants. Les résultats retardés restent affectés au cycle correct de boucle.

`pitchy 4.1.0` est retenu pour McLeod/FFT local. Le worker évite la FFT dans le thread audio ou l’interface. Le worklet se limite à la capture filtrée et au rééchantillonnage. Le prototype YIN manuel et aubio/WASM ont été écartés au profit de cette bibliothèque compacte. Aucun service distant de reconnaissance n’est appelé.

Le benchmark reproductible `npm run benchmark:vocal` utilise 360 fenêtres monophoniques avec harmonique et bruit, réparties sur six hauteurs :

| MIDI | Fenêtres correctement classées | Erreur moyenne (cents) | Erreur maximale (cents) |
| --- | ---: | ---: | ---: |
| 36 | 60/60 | 1,37 | 3,94 |
| 48 | 60/60 | 0,93 | 2,48 |
| 61 | 60/60 | 0,40 | 1,11 |
| 69 | 60/60 | 0,27 | 0,82 |
| 84 | 60/60 | 0,10 | 0,34 |
| 96 | 60/60 | 0,56 | 0,71 |

La classification est correcte pour 360/360 fenêtres de ce jeu synthétique. Le traitement Node mesuré dans cet environnement prend 0,14–0,36 ms en moyenne par fenêtre, avec un maximum initial de 6,48 ms. La stabilité est atteinte après 70 ms dans le test de segmentation. Le navigateur avec entrée PCM simulée a indiqué 49 ms entre le centre de la fenêtre audio et le résultat reçu. Cette valeur inclut l’analyse et la fenêtre centrée ; elle exclut le retard d’un microphone physique et ne représente pas une latence générale garantie. La fréquence de rafraîchissement de l’interface ajoute son propre délai.

La calibration par clics inclut le matériel et la réaction humaine. La compensation reste manuelle/réglable ; les timestamps originaux ne sont pas écrasés. La justesse de chanteurs réels, les consonnes, vibratos très larges, glissandi rapides, réattaques peu marquées, bruit et fuites de casque demandent encore une qualification matérielle.

## Vérification

La suite complète comprend **106 tests Node, 4 tests React et 32 scénarios Chromium**, soit **142 contrôles**. Elle conserve les 117 contrôles historiques et ajoute la présentation, le Tap et le Vocal. TypeScript et les builds passent.

Les nouvelles vérifications couvrent crédits/libellés, groupement/portabilité, numérotation et levée, justification/ancrages, profils sans modification musicale, symboles/Undo, tap irrégulier et conversions, pitch harmonique/bruit/silence, vibrato, glissando, réattaque, durée minimum, chromatismes/suggestions, boucle retardée, Punch/compensation/quantification, restauration avec paroles/liaisons, blobs réouverts et corruption d’archive.

Le navigateur traverse réellement getUserMedia → AudioWorklet → worker → Recorder → IndexedDB → Piano Roll/Solfa, avec une entrée PCM synthétique. Il vérifie notes provisoires visibles, arrêt des pistes, écoute de l’original, sauvegarde et import avec remappage, refus d’autorisation simulé, changement de source, arrière-plan et reprise hors ligne. Le scénario complet prépare les crédits Malagasy/personnalisés, règle le Tap en noire pointée, enregistre quatre couches vocales, quantifie sans changer les hauteurs, exporte un PDF, importe la sauvegarde avec audio, rouvre et enregistre de nouveau hors ligne.

Les captures desktop/390×844 et les scénarios 740×390 ont été examinés. Le mode vocal compact réduit les pistes sur téléphone et suit les notes entrantes lorsque le suivi est activé. Les tests historiques de multitouch, impression noire/couleur, SVG/PNG/PDF, mise en page, polices, grands projets et restauration restent inclus.

## Publication et limites

La version est harmonisée en `0.5.0` (package, lock et modèle), avec Android `versionCode 5`. Les workflows Chromium et Android incluent la branche de travail ; `main` déclenche tests, Pages et publication de l’APK du même commit. La branche doit être validée avant son passage sur `main`. Le commit effectivement publié se lit dans le `version.json` du site ; les résultats des jobs et la release sont disponibles dans [Actions](https://github.com/ZoNampoina/soratro/actions) et [les releases](https://github.com/ZoNampoina/soratro/releases).

**Terminé et testé localement :** fonctions et parcours ci-dessus, compatibilité des projets, exports, conservation audio et transcription hors ligne dans Chromium avec entrée simulée.

**Implémenté mais partiellement vérifié :** capture sur WebView Android, autorisations natives, qualité et retard sur des microphones/chanteurs physiques, casques/Bluetooth, comportement après veille prolongée et stockage soumis à éviction réelle. Compilation et lint Android sont vérifiés par CI avant publication ; ils ne remplacent pas ces essais.

**Non terminé :** qualification matérielle sur téléphones et microphones réels. La distribution Android de production avec signature durable reste distincte de l’APK debug de test. Les fonctions de texte chanté/ASR et les indications audio non interprétées ne sont pas annoncées comme ajoutées.

L’audio original dépend du support MediaRecorder et du quota local. Les suppressions explicites sont définitives et peuvent rendre des références historiques ou partagées indisponibles. Une sauvegarde `.soratro` transporte les notes ; `.soratro-audio` transporte aussi les blobs disponibles. Les limites d’archive sont contrôlées. Ne pas confondre mise à jour du cache avec effacement des données du navigateur ou désinstallation de l’APK.
