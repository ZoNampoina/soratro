# Audit — audio de référence, 29 octobre 2026

Source : ZoNampoina/soratro, main `96a758af0944cf849b1c55cfbd0898234f10a452`, version 0.10.1. Derniers changements : atelier de numérisation, correction de la finalisation bloquée et des libellés de la première voix. Aucune PR ouverte lors du contrôle. Copie Git de cette source propre ; les anciennes copies de travail et le Site séparé ne sont pas utilisés comme base. Branche dédiée : `feat/reference-audio-0.11`.

Le document joint Markdown collé(1).md, le README, le rapport initial, les audits Vocal/Tap et ruban, les modules audio/transport/MIDI/Recorder/prises, les tests, les curseurs, la quantification, le stockage et le format portable ont été examinés. Le précompte 0/1/2/4, Punch, Overdub, les prises en boucle, les raccourcis usuels et le stockage audio séparé existent déjà. Ctrl+Q manque. Replace enlève toute la durée passée, même sans nouvelle note. Le ruban garde encore le transport sous le logo. Les couleurs natives des options ne sont pas explicites.

Décision : réutiliser ces mécanismes et corriger leurs limites. Extension optionnelle du projet, sans hausse du schéma 2 ni migration destructive. Le moteur de gravure Solfa et les formats PDF/SVG restent conservés. Les audios ne sont pas transmis à un service.

## Choix des moteurs

- Détection : Pitchy 4.1.0, McLeod/FFT déjà présent (licence MIT, voir dépendance). Segmentation et hystérésis Vocal existantes, exécutées dans un worker pour les fichiers. Priorité au monodique. Les paramètres rapides/approfondis changent la fréquence et la fenêtre d’analyse.
- Basic Pitch TypeScript : extension polyphonique envisageable, Apache-2.0, TensorFlow.js et modèle à distribuer/préparer. Documentation examinée : https://github.com/spotify/basic-pitch-ts. Aucun modèle ni résultat polyphonique ajouté ou revendiqué. Des extraits instrumentaux de référence restent nécessaires avant sélection définitive d’un moteur avancé.
- SoundTouchJS : bibliothèque étudiée, traitement de tempo dans un AudioWorklet, contraintes LGPL-2.1 et latence/tampons à qualifier. Documentation : https://github.com/cutterbl/SoundTouchJS. Aucun code de cette bibliothèque repris.
- Traitement retenu pour cette étape : WSOLA local original, rendu dans un worker, puis AudioBufferSourceNode sur la même horloge AudioContext que les notes. Segments découpés aux ancrages et changements de tempo ; cache de rendu invalidé par les paramètres de synchronisation. Aucun simple changement de playbackRate qui transposerait le son.
- Séparation : interfaces de fournisseurs prévues, aucun fournisseur distant ou modèle lourd activé. Une piste isolée peut être importée comme référence.

## Vérification

La phase A a passé 224 tests du cœur (dont 3 nouveaux sur Replace) et 5 tests React, ainsi que la compilation Pages. La base historique comprend donc 221 tests du cœur. Les nouveaux essais audio utilisent des signaux PCM synthétiques identifiés comme tels. Aucun saxophone, chanteur, clavier USB ou téléphone Android physique n’est disponible ici. La reconnaissance sur de vrais instruments et les performances sur téléphone physique restent à qualifier.
