# Audit préalable — personnalisation, Tap Tempo et Vocal

10 octobre 2026. Base vérifiée : 0.4.0, commit `57d48363b089abd13b15b423ae2b7ddf7ff6ea91`.

La demande `Texte collé(4).txt` a été lue intégralement avant modification. Le README, les rapports et notes 0.3/0.4, le format portable, les composants de composition, Piano Roll, partition, mise en page, export, symboles et préférences ont été examinés, ainsi que le modèle, la timeline, navigation, gravure, audio, MIDI, enregistrement/prises, quantification, validation/stockage, PWA et Android/CI.

`main`, `origin/main` et `work/v0.4-traditional` correspondent au même commit. Le site public annonce également 0.4.0 et ce commit. Les anciennes branches 0.2/0.3 sont des étapes historiques déjà livrées. La copie de travail est propre ; aucun changement parallèle récent ou travail non finalisé n’est présent. Une branche `work/v0.5-vocal` est créée à partir de cette base.

La base a passé **88 tests Node, 4 tests React et 25 scénarios Chromium**. Le runtime Chromium local a été restauré après disparition des fichiers temporaires ; les 25 scénarios ont ensuite passé. Aucun échec fonctionnel retrouvé.

| Présent et conservé | Complément prévu |
| --- | --- |
| Champs auteur/compositeur, en-têtes/pieds de page, polices incorporées | Langue documentaire, libellés libres et contributions multiples |
| Quatre mesures par défaut, exceptions de systèmes/pages/largeurs | Saisie 1–12, justification de ligne, numérotation et sélection éditoriale |
| Catalogue de symboles, renvois réellement joués, éditeur numérique | Vignettes du moteur de gravure, favoris/récents, placement et déplacement tactile |
| Styles personnels et aperçu atomique/Undo | Quatre profils fournis, restauration et personnalisation |
| Tempo interne à la noire, unités converties, horloge AudioContext | Tap robuste, limites réglables et application différée pendant REC |
| Recorder, Punch, Overdub/Replace, Loop Recording, quantification | Source Vocal, analyse locale et prises vocales horodatées sur cette horloge |
| Notes originales/éditées/quantifiées, timings bruts | Diagnostics vocaux et compensation sans perte de l’original |
| IndexedDB 2 et fichiers .soratro format 1/schéma 2 | Audio original facultatif séparé, sauvegarde audio explicite |
| Capacitor HTTPS, arrêt en arrière-plan, APK/Pages automatiques | Permissions microphone et contrôles de la nouvelle chaîne |

Le microphone Android n’est pas encore déclaré dans le manifeste. Capacitor 8 possède déjà la demande de permission WebView pour RECORD_AUDIO/MODIFY_AUDIO_SETTINGS ; ces permissions devront être déclarées, sans remplacer son gestionnaire.

Le scénario à valider suit : crédits Malagasy/personnalisés → mise en page → Segno placé par clic → Tap → micro local → prises SATB → corrections/quantification → sauvegarde → PDF → réouverture hors ligne. Aucune recréation ni modification des hauteurs ou timings existants n’est nécessaire.

Les essais de voix seront distingués entre références synthétiques, chaîne navigateur réelle avec entrée simulée, et matériel physique. Aucun téléphone, micro de studio ou clavier USB réel n’est disponible dans cet environnement ; leur qualification ne sera pas présentée comme réalisée.
