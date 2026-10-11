# SORATRO 0.7 — Grille temporelle et ponctuations

Cette version prolonge le moteur et l’interface Web existants. Elle concerne PC, téléphone, tablette et PWA. Les projets conservent le schéma musical 2 ; aucune migration de la base ni conversion des événements n’est nécessaire.

## Trois niveaux de coordonnées

Les colonnes de mesures restent communes aux systèmes d’une même famille de grille. Avec sept mesures et quatre mesures par ligne, les mesures 5, 6 et 7 reprennent les trois premières colonnes ; la quatrième reste vide. Les cas 5, 6, 7, 9, 11 et 12 restent couverts sans mesure ni barre fictive. Les exceptions de nombre de mesures peuvent définir une autre famille de colonnes.

Dans une mesure, la largeur musicale `W` exclut les réserves de début et de fin. Pour un instant `t`, le moteur utilise `X(t) = origine + W × (t − début) / durée`. Les quatre voix partagent cette conversion, quel que soit leur rythme. En 4/4, les trois deux-points sont donc à `W/4`, `W/2` et `3W/4`.

Les points et virgules suivent les frontières 1/2, 1/4 et 3/4 du temps. Les divisions en tiers conservent les valeurs de 1/3 et 2/3, sans l’ancien arrondi à quatre décimales. Le signe des tiers est une courbe vectorielle locale. Les pulsations principales restent présentes dans chaque voix ; les subdivisions secondaires décrivent le rythme propre à cette voix. Une basse tenue ne reçoit plus les subdivisions étrangères de l’Alto ou du Ténor.

Les glyphes des notes ont une compensation de présentation constante dans toute la mesure et identique entre les voix. Elle réserve la place des lettres, octaves et séparateurs après l’ancrage musical. La largeur ou la durée du glyphe suivant ne déplace plus le centre d’une note. Les métadonnées `data-time-x`, `data-track-id` et `data-rhythm-kind` permettent de contrôler les mêmes références dans l’aperçu et le SVG.

Les comparaisons du moteur utilisent une tolérance de 0,0000001 px. Les coordonnées SVG sont écrites à trois décimales ; les contrôles du centrage sérialisé admettent 0,002 px. Les contours de la police et les extrêmes de la courbe des tiers sont centrés sur les frontières, y compris après un changement de style.

Les événements non quantifiés ou arrondis gardent leur instant réel. La reconnaissance d’une division standard utilise la même tolérance temporelle que la grille, y compris en mesure composée : une valeur proche de 1/3 ne crée plus une seconde cellule presque superposée. Une subdivision irrégulière conserve son signe secondaire ; la quantification explicite permet de choisir un triolet exact sans effacer les instants originaux.

## Ponctuations rythmiques

Ouvrir **Partition → Mise en page → Typographie → Ponctuations rythmiques**. Le choix modifie immédiatement l’aperçu. Les marques d’octave restent attachées à la note, à 70 % de sa taille, indépendamment de la ponctuation.

| Style | Taille relative | Contraste | Épaisseur | Espace de sécurité |
| --- | ---: | ---: | ---: | ---: |
| Normal | 85 % | 80 % | × 1 | 1,5 px |
| Renforcé, défaut | 100 % | 100 % | × 1,35 | 2 px |
| Personnalisé | 70 à 130 % | 40 à 100 % | × 1 à 2 | 0 à 8 px |

Le contraste ajuste une teinte sombre, sans modifier les formes musicales. Les textes renforcés reçoivent un contour de la même couleur ; le signe des tiers ajuste son trait vectoriel. Les valeurs fines sont dans un volet repliable. Elles sont conservées dans le projet, les styles et les fichiers `.soratro`. Les mêmes réglages sont accessibles dans **PDF / Export → Réglages avancés**.

## Largeur et collisions

Les notes, accords, octaves, prolongations, silences et paroles fournissent une largeur minimale mesurée. Cette largeur permet de préserver les proportions au lieu de déplacer une attaque isolée. Les préférences de visibilité ne déplacent aucune note. Les modes adaptatifs ajustent les largeurs proposées ; la conversion du temps reste proportionnelle.

La taille Solfa du document reste exacte. **20 px** produit des notes à 20 px dans l’aperçu et le SVG, soit **15 points** dans le PDF. Le zoom de lecture est indépendant. Si la ligne ne tient pas, SORATRO conserve la police, signale la contrainte et bloque l’application ou l’export qui produirait une page tronquée. Choisir explicitement moins de mesures, le paysage, des marges plus petites ou une autre taille résout la contrainte.

Certaines compositions existantes peuvent nécessiter davantage de largeur avec les proportions exactes et les ponctuations renforcées. L’étude de démonstration en 6/8, quatre mesures à 17 px, nécessite par exemple le paysage ou une autre adaptation explicite. Ses événements et ses réglages sauvegardés ne sont pas modifiés automatiquement.

## Noms de voix et centrage

**Voix et paroles → Noms des voix** conserve Premier système seulement, Première ligne de chaque page, Toujours et Jamais. La réserve est calculée à partir des étiquettes réelles, avec une origine commune aux systèmes. Jamais supprime la réserve SATB. Une réserve utile aux numéros de couplets peut rester présente.

La grille remplie utilise la largeur libérée à l’intérieur des marges. La justification naturelle sans noms centre le bloc de référence complet ; la dernière ligne conserve ses premières colonnes. Les noms longs et les sauts de page sont vérifiés sans décaler un seul système.

## Mise en page sur PC et téléphone

Les sections sont Document, Mesures et alignement, Typographie, Voix et paroles, En-tête, Pied de page et Styles. Les favoris n’affichent chaque réglage qu’une fois. **Mesures par ligne** reste le seul champ de nombre de mesures, avec 4 par défaut, 0 pour Automatique et les valeurs 1 à 12. Exceptions locales, sauts, largeurs et réinitialisations restent disponibles.

Sur PC, les paramètres restent à gauche et l’aperçu à droite. Sur téléphone, l’aperçu occupe l’éditeur ; un panneau temporaire ouvre les paramètres. Appliquer reste accessible en haut, avec les commandes de réglage et de zoom adaptées au bas de l’écran. Le pincement, le double-tap, la rotation, le clavier numérique, le défilement, les menus et les vues Composition/Vocal conservent leurs comportements de la V0.6.

## Reproduire les vérifications

```sh
npm run build:pages
npm test
npx playwright install chromium
npm run test:browser
node --experimental-strip-types scripts/verify-punctuation-visuals.mjs
node scripts/verify-pwa-update.mjs chemin/dist-0.6 dist tmp/pwa-v07
node --experimental-strip-types scripts/verify-published-grid.mjs SHA_DEPLOYE
```

Les scripts utilisent le Chromium de Playwright ; `SORATRO_CHROMIUM_PATH` permet un exécutable déjà installé. Les douze variantes de ponctuation produisent de vrais SVG et PDF, avec une planche visuelle. Le contrôle de mise à jour utilise deux compilations sur la même origine, le bouton Sauvegarder & mettre à jour, puis un nouveau processus navigateur hors ligne. Les contrôles publics vérifient `version.json`, les colonnes, les frontières, les tailles, les exports et le redémarrage hors ligne.

Les tests de viewport et d’API navigateur ne remplacent pas des essais sur Android physique, un microphone, un clavier MIDI et une imprimante réels. Aucun APK, EXE ni release native n’est produit.
