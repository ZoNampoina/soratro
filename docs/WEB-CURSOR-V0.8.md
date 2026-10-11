# SORATRO 0.8 — Cellules Solfa et position de travail

La partition emploie toujours le moteur de gravure, le transport audio et le Piano Roll existants. Cette évolution ajoute le centrage des symboles dans leurs cellules et une position de travail commune aux vues.

## Cellules musicales et centrage

Chaque voix possède ses propres limites de cellules : pulsations, subdivisions présentes dans cette voix, attaques et fins de notes. La fin d'une cellule est la prochaine limite propre à la voix, bornée par la fin de la mesure et, pour une attaque, par la fin réelle de la note. Une note longue est représentée par son attaque dans la première cellule puis les prolongations dans les cellules suivantes.

Le centre musical est `(début + fin) / 2`. Il est projeté sur la même grille affine que les frontières rythmiques. Une noire occupe le centre du temps, deux croches les positions 1/4 et 3/4, quatre doubles croches les positions 1/8, 3/8, 5/8 et 7/8, trois tiers les positions 1/6, 1/2 et 5/6. Une durée irrégulière utilise ses coordonnées réelles.

La lettre, son altération et ses marques d'octave constituent un ensemble graphique. Le placement utilise les contours horizontaux de ScoreFont.ttf, y compris les marques à 70 % de la taille Solfa. Un accord est centré comme un ensemble de notes séparées par des barres obliques. Les marques restent attachées aux lettres. La taille demandée n'est jamais réduite pour faire entrer une ligne.

Les ponctuations conservent leur centre sur les frontières. Les contraintes de largeur vérifient les symboles, les ponctuations, les limites de mesure et chaque ligne de paroles. Elles prennent aussi en compte les silences et prolongations masqués afin que les préférences de visibilité ne déplacent pas la musique. Les paroles suivent le centre de la première note liée.

Deux notes simultanées de durées différentes peuvent avoir des centres graphiques différents. Elles partagent cependant la même attaque, le même axe temporel et les mêmes frontières principales. Les subdivisions d'une autre voix ne changent pas leurs cellules.

Les opérations de gravure conservent `beat` et `timeX` pour l'attaque, et ajoutent `cellEnd` et `centerX` pour le placement visuel. SVG, PDF, PNG, aperçu et impression consomment les mêmes opérations. Aucun événement MIDI, aucune durée et aucun timing ne sont modifiés par la gravure.

## Trois états distincts

| État | Source | Effet |
| --- | --- | --- |
| Curseur de travail | `NavigationPreferences.cursorBeat`, par projet | Navigation, insertion et départ explicite |
| Sélection | Identifiants des notes sélectionnées | Inspecteur, édition et commandes de sélection |
| Tête de lecture | `AudioEngine` et son horloge audio | Suivi et surbrillance pendant lecture ou enregistrement |

Déplacer le curseur ne vide pas la sélection et ne modifie pas les notes. Pendant la lecture, le curseur de travail reste disponible ; la tête de lecture progresse séparément. Stop ramène l'affichage à la position de travail. Pause puis Play reprend la position audio et le passage courant d'une reprise. Déplacer le curseur pendant une pause définit un nouveau départ.

La position est conservée entre Composition, Partition et Répétition, dans la mini-timeline, après rechargement et dans les préférences locales. Elle n'est pas un champ musical du fichier `.soratro` et ne crée pas d'entrée Undo. Un ancien profil sans curseur démarre au début. Les valeurs non finies sont ignorées et les positions sont bornées au morceau courant.

## Navigation et édition

- Cliquer ou toucher un emplacement libre dans la partition place le curseur sur la grille active ; les attaques irrégulières existantes sont aussi des points possibles.
- Cliquer une note sélectionne cette note en Édition. En Lecture, cela place le curseur sur son attaque. Un appui prolongé place le curseur sans remplacer la sélection.
- La poignée triangulaire au-dessus du système se déplace à la souris ou au doigt. Elle utilise le zoom actuel et le même calcul musical que le clic.
- Cliquer un numéro de mesure rejoint son début. Le navigateur de partition utilise aussi la position partagée. Aller à… fait apparaître la position exacte horizontalement à fort zoom ; le suivi audio défile aussi lorsque la tête approche du bord.
- Cliquer la règle du Piano Roll choisit un temps ou une subdivision. Un simple clic dans une zone vide conserve la sélection et place le curseur ; le déplacement sur le fond conserve la sélection rectangulaire existante.
- Le bouton de position du transport ouvre **Aller à…**. Il permet de choisir mesure, temps et subdivision, puis de positionner le curseur, lire, ou insérer.
- **Lire depuis le curseur**, **Lire depuis le début** et **Lire depuis la sélection** sont explicites dans cette commande. Le bouton Play démarre au curseur lorsqu'il n'est pas en pause ; après une pause il reprend la lecture.
- **Insérer au curseur** ajoute une note à cette position, dans la voix active, avec la hauteur et la durée choisies. **Placer des notes dans la partition** active l'insertion par clic. La durée initiale vient de la grille active et reste un réglage musical, indépendant de la largeur des glyphes. Échap termine cet outil.

Les temps sont comptés dans l'unité de la signature, comme dans le transport existant : quatre noires en 4/4, six croches en 6/8. Les regroupements de la gravure et les accents du métronome restent ceux du projet. Une levée ne permet que les temps réellement présents.

| Raccourci | Action |
| --- | --- |
| Alt + gauche / droite | Temps précédent / suivant |
| Alt + Shift + gauche / droite | Subdivision précédente / suivante |
| Alt + Home | Début de la mesure |
| Alt + End | Mesure suivante |

Ces raccourcis laissent les flèches ordinaires à l'édition des notes. Ils ne s'appliquent pas dans les champs de saisie ou les boîtes de dialogue. Les déplacements et insertions sont bloqués pendant REC, le décompte et le pré-roll. Les voix verrouillées conservent leur protection.

## Départ et parcours musical

Un départ explicite au milieu du morceau construit le parcours à partir du **premier passage de la mesure choisie**. Les sections antérieures ne sont pas jouées initialement et leurs renvois ne sont pas considérés comme déjà exécutés. Les reprises et renvois rencontrés après ce départ restent actifs et peuvent revenir à une mesure antérieure, conformément à la notation. Cette règle apparaît dans la commande Aller à….

Un départ après un Fine antérieur atteint tout de même la position demandée. Les fins, D.C., D.S. et Codas suivantes sont évaluées à partir de ce nouveau départ. Une boucle manuelle utilise sa zone et remplace le parcours des reprises, comme précédemment ; un départ hors de sa zone est borné à cette zone.

Le curseur audio développé et la position dans la partition ont des coordonnées distinctes pendant les reprises. Le métronome calcule sa première pulsation à partir de la position dans la mesure, puis emploie la même horloge que les notes. Un départ à mi-temps ne produit pas de clic de début artificiel. Les notes déjà tenues à la position choisie reprennent pour leur durée restante.

REC part du curseur quand ni Punch ni Loop Recording ne définissent une autre zone. Décompte, pré-roll, latence, prises et capture vocale réutilisent la session d'enregistrement existante.

## Exports et vérification

Les curseurs, poignées et sélections appartiennent à des calques interactifs séparés. Ils n'apparaissent dans aucun export imprimable ni dans l'aperçu d'export.

Les tests unitaires vérifient les cas A à E, les durées irrégulières, SATB, les reprises, les signatures et la levée. Les tests navigateur vérifient les cas F à K, les oscillateurs réellement programmés, la phase du clic, l'insertion, Undo, les préférences, le tactile, les huit résolutions et les exports. Le rapport de qualification fournit les résultats et leurs limites.
