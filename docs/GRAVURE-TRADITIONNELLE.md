# Gravure traditionnelle, données et impression

## Notation

Les syllabes et altérations du convertisseur Do mobile existant sont conservées. Les octaves sont des apostrophes en haut et des virgules en bas, attachées à la syllabe, sans numéro d’octave. Les métadonnées de hauteur restent MIDI : la gravure n’altère pas les notes.

Une mesure de 4/4 comporte trois `:`, une 3/4 deux, une 2/4 un. En 6/8, les groupes 3+3 produisent deux temps principaux, donc un `:`. Le même principe s’applique à 9/8 et 12/8. Les groupements personnalisés sont respectés ; les pulsations secondaires peuvent être affichées dans Mise en page.

Le point divise un temps en deux ; les virgules encadrent les quarts, séparés au milieu par le point ; les deux virgules inversées divisent un temps en trois. Ces dernières sont des tracés SVG/PDF, indépendants d’un caractère disponible dans une police. Le tiret représente la continuation et `0` le silence. Des micro-intervalles inférieurs à un trente-deuxième de temps avant la prochaine attaque ne créent pas de séparateur supplémentaire ; aucune donnée temporelle n’est modifiée.

Référence de la convention : John Curwen, *The Standard Course of Lessons and Exercises in the Tonic Sol-fa Method*, sections « Divisions of time », « Quarters » et « Thirds » : https://archive.org/stream/standardcourseof00curw/standardcourseof00curw_djvu.txt

## Grille et pages

Tous les événements SATB partagent la même grille par mesure. Les notes sont placées entre les limites de subdivision, les séparateurs sur ces limites. Le placement est calculé à partir du temps musical, sans alignement par des espaces de texte.

La justification régulière donne une largeur commune aux mesures comparables et des distances proportionnelles. Si des subdivisions mixtes très proches ne tiennent pas, le minimum d’espace est réparti localement ; la justification adaptative peut aussi être choisie. Les mesures denses réduisent automatiquement le nombre de mesures par système. Une mesure impossible à graver proprement signale une erreur et propose de réduire la taille ou de changer de format.

Les sauts, nombres de mesures par ligne, facteurs de largeur et espacements peuvent être forcés dans l’aperçu. La réinitialisation supprime ces exceptions. L’application produit une seule entrée d’historique. Les liaisons et les prolongements des mélismes sont dessinés à travers les systèmes ; les notes restent entières dans le modèle.

Les en-têtes et pieds utilisent des champs répartis à gauche, au centre de la page et à droite, avec retour à la ligne dans leur zone. Le titre est centré sur toute la page quand il occupe seul sa ligne. La pagination est calculée avant le remplacement de `{page}` et `{pages}`. Les marges horizontales sont respectées et les décalages verticaux excessifs sont signalés par le vérificateur.

## Paroles et liaisons

`sharedLyrics` contient le texte et les syllabes communs ; chaque `LyricLine` garde ses liens vers les notes de sa propre voix. Les corrections se propagent à toutes les voix du groupe. Un redécoupage conserve les associations des syllabes reconnues ; les nouvelles syllabes restent à lier. Le réalignement complet est une commande explicite. Les groupes sont libres, les couplets et refrains restent indépendants.

Un alignement compatible affiche une seule ligne sous la dernière voix du groupe. Si les rythmes divergent, chaque voix retrouve ses liens et sa ligne ; l’interface signale ce choix, même si « sous l’ensemble » est demandé. Forcer un placement ne falsifie jamais les associations musicales.

Les liaisons de durée réunissent des notes contiguës de même hauteur et suppriment la réattaque audio. Les liaisons de phrasé et de mélisme sont des objets distincts. Les associations de syllabes portant sur plusieurs notes restent également disponibles.

## Parcours de lecture et vérification

Les reprises et fins sont développées d’abord. D.C./D.S. se produisent à la fin de la mesure ; la seconde traversée omet les reprises. Fine arrête le renvoi al Fine ; To Coda ne saute qu’après un renvoi al Coda. Les destinations explicites sont respectées. Un renvoi est exécuté au plus une fois et le parcours est limité à 100 000 mesures. Un changement de navigation pendant la lecture l’arrête pour éviter de réutiliser une horloge devenue invalide.

Les signes de navigation sans destination sont conservables pendant l’édition, mais la lecture refuse le parcours incomplet. Une boucle manuelle de répétition reste indépendante. Les mesures entières sont l’unité des renvois ; le champ de position du symbole agit sur sa gravure.

Le vérificateur recherche les destinations absentes, les durées et chevauchements, les associations de paroles, les liaisons invalides, les symboles hors mesure, les collisions et les dépassements des marges. Il distingue erreurs, avertissements et informations, indique mesure/voix et propose une action sans modifier le morceau. Cliquer une entrée rejoint la mesure. Une information de silence implicite ou d’indication non jouée peut être volontaire.

## Police et compatibilité

Les douze polices d’en-tête/pied sont des sous-ensembles DejaVu Sans, Serif et Sans Mono : regular, bold, oblique et bold-oblique. Les obliques sont dérivées localement par inclinaison des glyphes ; elles ne prétendent pas être les dessins italiques originaux. Les métriques correspondent aux fichiers incorporés. Voir `FONT-LICENSE.txt` et `scripts/generate-print-fonts.py`.

Les exports incorporent les polices utilisées et les logos ; aucun service tiers de police n’est requis. Le même ensemble d’opérations vectorielles sert l’écran, le SVG, le PDF, le PNG rasterisé et l’impression. Le cache hors ligne inclut les douze fichiers. Les styles personnels contiennent uniquement `PageSettings`, avec les champs et logos éventuels ; ils sont enregistrés dans les préférences locales, séparées de la composition.

Les extensions sont optionnelles : schéma de projet 2, fichier `.soratro` version 1, IndexedDB version 2. La validation contrôle les nouvelles structures. Le copier/coller de mesures remappe les notes, les syllabes communes, les liaisons et les destinations internes de navigation. Les notes et horodatages originaux ne sont pas réécrits par la gravure.
