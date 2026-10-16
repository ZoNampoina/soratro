# Audit gravure A4 et ponctuations — 16 octobre 2026

Base : `main` au commit `1629de56df170b3484a76371d62f1345496ce6a1`, version Web 0.8.0. Les changements PWA du 15 octobre sont conservés.

## Système réutilisé

`temporal-grid.ts` calcule une grille affine par mesure, avec les contraintes d’encre des notes, octaves, ponctuations et paroles. `engraving.ts` produit un document de pages en coordonnées à 96 px/pouce. `SolfaScore`, Mise en page, l’aperçu d’export, SVG, PNG, PDF et impression consomment ce même document. Le PDF convertit explicitement les pixels en points et en millimètres.

Les colonnes des lignes incomplètes étaient déjà partagées. La taille Solfa, les marges, l’orientation, les sauts manuels et les noms de voix étaient déjà des paramètres du document. Aucun nouveau moteur n’est nécessaire.

## Causes relevées

- La virgule de tiers était une courbe entre `baseline − 0,9 × taille` et `baseline − 0,46 × taille` : elle ressemblait à une apostrophe. Le point dépendait du glyphe de la police, alors qu’une forme ronde indépendante est souhaitée.
- L’ancien curseur Espacement était une préférence de l’appareil. La justification pleine largeur absorbait une grande partie de son effet. Il manquait un réglage horizontal enregistré avec la partition.
- Lorsque les largeurs minimales dépassaient le papier, le moteur retournait ces largeurs trop grandes avec un avertissement. Le conteneur de page pouvait alors s’élargir, tandis que son SVG conservait les dimensions du papier.
- Un rejet complet de ces documents empêcherait de continuer à éditer certaines partitions anciennes. Il faut conserver un aperçu provisoire lisible, sans enregistrer une nouvelle disposition ni autoriser son export par erreur.

## Portée retenue

Densité horizontale facultative dans le schéma existant ; marges internes et espaces de sécurité ajustables ; choix de 0 (Auto) à 32 mesures ; point vectoriel rond et virgule descendante ; avertissement chiffré et aperçu provisoire pour un nombre de colonnes incompatible. Si une mesure seule ne tient pas, afficher une erreur explicite. Les identités PWA, IndexedDB, notes, timings, MIDI, REC et quantification ne changent pas.
