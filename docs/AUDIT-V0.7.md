# SORATRO — Audit de la grille temporelle et de la ponctuation

Audit du 11 octobre 2026, avant toute modification du moteur.

Le dépôt `ZoNampoina/soratro` et le site public indiquent **0.6.0**, commit `fc7e4653af7bf9e4d9ac4922f7ce11cecfed3a1e`. Le checkout était propre ; aucun changement concurrent n’était présent sur `main`. Le travail reprend cette version, sur une branche dédiée.

La compilation Pages, **132 tests unitaires**, **4 tests d’interface** et **48 parcours Chromium** réussissent. Chromium a dû être réinstallé dans l’environnement de contrôle ; le premier lancement sans exécutable n’était pas un résultat de test de l’application. Le second passage complet réussit en 2 min 30 s.

## Corrections déjà présentes

- Grille commune de colonnes, avec quatre mesures par défaut.
- Dernières lignes incomplètes, sans mesure ni barre fictive.
- Un seul champ visible « Mesures par ligne » ; champ interne conservé.
- Taille Solfa exacte, avertissement de densité et blocage des exports impossibles.
- Zoom indépendant du document, pincement et double-tap.
- Éditeur de page adapté au téléphone, favoris et réglages repliables.
- Aperçu et export utilisant les mêmes préférences de densité et d’espacement.
- Partage Web, cache PWA et mise à jour précédée d’une sauvegarde.

Ces fonctions seront conservées et vérifiées par leurs tests existants.

## Causes reproduites

1. `noteX()` centre le glyphe entre l’attaque et l’ancrage suivant. Le décalage change lorsque la subdivision suivante change. Pour des attaques à 0, 1 et 1,5 noire, leurs centres sont 146,808661, 188,982283 et 217,098031 px : la distance par noire vaut successivement **42,173622** puis **56,231496** px. La grille sous-jacente proportionnelle ne suffit donc pas à garantir un placement proportionnel des notes.
2. `measureGeometry()` arrondit les instants à quatre décimales. Les tiers deviennent 1,3333 et 1,6667 au lieu de conserver les valeurs issues de 1/3 et 2/3.
3. Le mode rythmique adaptatif attribue une largeur différente à chaque intervalle. Il peut déformer les rapports 1/2, 1/4 et 1/3. L’adaptation doit porter sur les largeurs disponibles, avec une conversion temporelle affine dans chaque mesure.
4. Le moteur réserve toujours **54 px** aux voix. Sur la démonstration, masquer les noms conserve une origine musicale à **110,692913 px**, au lieu de libérer la zone à gauche.
5. Les signes textuels utilisent **72 %** de la taille Solfa et la couleur `#6c6475`. Le signe des tiers est déjà vectoriel, mais sa taille et son épaisseur sont fixes. Il n’existe pas de réglage de ponctuation enregistré dans le document.
6. Les cellules et subdivisions issues de toutes les voix sont reproduites sur chaque portée Solfa. Avec des rythmes différents, cela multiplie les signes de prolongation et les subdivisions étrangers à la voix, et impose des distances inutilement courtes. Les temps principaux doivent rester communs ; les autres signes doivent décrire le rythme de la voix.

## Intervention retenue

Une coordonnée musicale commune gouvernera les attaques et les frontières. Un décalage de présentation constant dans la mesure placera les glyphes après la frontière, avec des réserves mesurées pour les signes, octaves et paroles. La largeur minimale sera calculée à partir des collisions réelles, sans déplacement individuel d’attaque ni réduction de police.

Les modes de justification, les exceptions locales et les colonnes incomplètes seront conservés. Les noms et numéros de couplets auront une réserve calculée ; aucune réserve SATB ne subsistera quand les noms sont masqués. La ponctuation proposera Normal, Renforcé par défaut et Personnalisé, avec un rendu commun à l’écran, au PDF, au SVG et au PNG.

Le schéma musical et IndexedDB resteront en version 2. Les réglages nouveaux seront facultatifs pour les anciens fichiers. La mission concerne exclusivement le Web et la PWA.
