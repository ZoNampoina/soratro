# SORATRO 0.9.0 — gravure Solfa et largeur A4

## Modifications

Le moteur SVG existant reste la source de l’éditeur, de l’aperçu, du PDF, du PNG et de l’impression. Les feuilles conservent leurs dimensions physiques ; le zoom ne modifie pas la partition exportée.

Dans **Mise en page → Mesures et alignement**, le curseur **Densité horizontale** va de 70 % (aéré) à 150 % (compact). Il agit sur les marges internes des mesures, les espaces de sécurité et les largeurs préférées, sans réduire la taille des notes. Il est aussi disponible dans PDF / Export et reste enregistré avec la partition. Le nombre de mesures par ligne accepte 0 pour Auto, ou 1 à 32. En Auto, la densité influe sur le nombre de colonnes compatibles avec le papier.

Les temps et subdivisions utilisent toujours la même conversion proportionnelle : demis égaux, tiers égaux, notes centrées et séparateurs SATB alignés. La grille partage ses colonnes entre les lignes. Dans les modes indépendant et adaptatif, une ligne incomplète reprend les colonnes de la ligne complète voisine. Les emplacements manquants restent blancs ; ils ne deviennent pas de fausses mesures.

Le point de demi-temps est un cercle vectoriel placé sur la ligne de base. La virgule de tiers est un petit tracé descendant, avec extrémités arrondies, au lieu de l’ancienne courbe en hauteur. Les marques d’octave restent attachées à leurs notes. Les positions et significations musicales ne changent pas.

## Contraintes de largeur

Les collisions sont évitées à partir des dimensions réelles des caractères et des paroles. Une demande incompatible indique les millimètres nécessaires et disponibles, la mesure concernée et les réglages possibles.

Si les mesures peuvent tenir séparément, un aperçu provisoire utilise moins de colonnes afin que la partition reste consultable et éditable. Il ne remplace pas les réglages enregistrés ; Appliquer et Exporter restent désactivés tant que la contrainte subsiste. Le générateur PDF refuse aussi ce document provisoire. Si une mesure seule dépasse la zone utile, une erreur explicite remplace l’aperçu.

## Vérifications

- Compilation Pages : `npm run build:pages`.
- 193 tests métier et 5 tests d’interface : `npm test`.
- 78 scénarios Chromium : `npm run test:browser`, dont écrans tactiles de 360 × 640 à 800 × 1280, paysage mobile et ordinateurs jusqu’à 1920 × 1080.
- Une voix et SATB ; 2/4, 3/4, 4/4 et 6/8 ; demis, tiers, notes uniques, octaves, paroles longues ; réglages de marges, polices, orientation, densité et nombre de mesures ; lignes complètes, incomplètes et documents multipages.
- Les scénarios existants couvrent aussi l’édition, Undo/Redo, la sélection, le curseur temporel, Web Audio, MIDI, REC, quantification, paroles, export/import et fonctionnement hors ligne.
- Comparaison des vrais opérateurs PDF et des coordonnées SVG avec le document commun : 897 textes en portrait, 899 en paysage, plus les points et virgules vectoriels. Écart maximal inférieur à 0,00005 point. Les deux fichiers A4 comptent respectivement 2 et 3 pages ; la dernière ligne garde trois colonnes sur quatre.
- Mise à jour réelle d’une compilation 0.8.0 vers 0.9.0 sur une même origine : 96 notes, projet et marqueur de préférence conservés exactement ; zoom et curseur conservés ; fermeture du processus navigateur, redémarrage à froid hors ligne puis export PDF réussis.
- Banc de 100 mesures SATB, 2 400 notes et huit couplets : médiane de gravure d’environ 364 ms sur l’environnement de vérification.

Les résultats et exemples sont dans [validation-v0.9](validation-v0.9/). Les contrôles Android utilisent l’émulation tactile Chromium ; aucun téléphone physique ni clavier MIDI matériel n’a été connecté pendant cette intervention.

## Conservation des données et publication

Le schéma IndexedDB et les identités PWA ne changent pas. `horizontalDensity` est facultatif : une ancienne partition sans ce champ garde 100 % sans être réécrite à l’ouverture. Les sauvegardes `.soratro`, préférences et styles restent compatibles. Aucune suppression des données locales n’est prévue ou nécessaire.

Le workflow [Publish SORATRO to GitHub Pages](https://github.com/ZoNampoina/soratro/actions/workflows/pages.yml) recompile, lance les tests métier et navigateur, puis publie `main` sur l’[adresse Web existante](https://zonampoina.github.io/soratro/). Il ne produit pas d’APK.

Dans une PWA déjà ouverte, utiliser **Sauvegarder & mettre à jour** lorsque la nouvelle version est proposée.

### Reproduire la comparaison des exports

```sh
node --experimental-strip-types scripts/verify-a4-export.mjs
python scripts/verify-a4-pdf.py
```

La seconde commande utilise `pypdf`. Pour le passage PWA entre deux compilations : `scripts/verify-pwa-update.mjs` accepte les chemins de l’ancienne et de la nouvelle compilation.
