# SORATRO 0.11.0 — audio de référence

État en cours de qualification sur `feat/reference-audio-0.11`, base 0.10.1 `96a758a`.

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

## Validation et publication

Les résultats définitifs et le commit publié seront ajoutés après les scénarios Chromium. Tests prévus : synchronisation et reprise, PCM ralenti, MIDI/Replace sans décompte, correction et transposition, portable et reprise hors ligne, disposition PC/mobile, raccourcis, non-régression complète.
