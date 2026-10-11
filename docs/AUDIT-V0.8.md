# Audit initial — SORATRO 0.8

Base examinée : version 0.7.0, commit `1c5a8b389b6e1f71d29a110c474947ff75746fda` de `ZoNampoina/soratro`. Le dépôt a été récupéré depuis GitHub ; aucun nouveau projet ni moteur musical n'a été créé.

## Situation de départ

La V0.7 fournit déjà une grille affine commune, des subdivisions propres aux voix, les ponctuations Normal/Renforcé/Personnalisé, les contours exacts de ces ponctuations et une mise en page cohérente entre écran et exports. Elle conserve la grille des colonnes des lignes incomplètes, les tailles de police demandées et les avertissements de densité des versions précédentes.

Le placement des notes emploie toutefois un décalage constant après chaque attaque. Il protège les ponctuations, mais ne correspond pas au milieu de la durée représentée. Le centre doit désormais dépendre de la cellule réelle de la voix, avec des contours qui comprennent altérations et octaves.

La partition possède une tête de lecture, des notes sélectionnables et une navigation par mesure. Le Piano Roll et la mini-timeline appellent directement `audio.seek`. Il n'existe pas de position de travail distincte : Stop revient à zéro, et une sélection ou un changement de mode ne fournit pas à lui seul un point d'insertion durable.

Le transport connaît déjà les signatures, la levée, les tempos, les reprises, les renvois et les notes tenues. Son parcours développé est initialement construit depuis le début. Le départ explicite au milieu doit initialiser ce parcours à la mesure demandée, et le métronome doit utiliser sa position musicale plutôt que la mesure correspondant au compteur développé. La pause doit conserver l'occurrence de la reprise.

## Contrôles de départ

La compilation pour `/soratro/` de la base a été refaite. Ses rapports et validations GitHub Actions antérieurs attestent 161 tests unitaires et quatre tests d'interface réussis. Le build 0.7 a été conservé pour vérifier une vraie mise à jour PWA vers 0.8. Les validations navigateur 0.7 et les rapports antérieurs sont conservés dans le dépôt ; la suite complète sera rejouée sur le changement final.

## Intégration retenue

1. Étendre les cellules de gravure avec leur fin musicale ; centrer les contours complets sur leur milieu et recalculer les contraintes de largeur.
2. Ajouter `cursorBeat` aux préférences de navigation du projet, sans changer son schéma musical ni son format portable.
3. Relier partition, Piano Roll, mini-timeline, navigation et insertion à cette source commune ; garder sélection et tête audio séparées.
4. Réutiliser la session REC et l'horloge audio. Définir le parcours initial, conserver les reprises futures et reprendre correctement les notes déjà tenues.
5. Tester les gestes tactiles réels dans le navigateur, les huit résolutions, les exports et une mise à jour suivie d'un redémarrage hors ligne.

La publication vise uniquement le Web existant. La qualification locale ne vaut pas une validation sur téléphone Android physique, matériel MIDI, microphone réel ou imprimante.
