# SORATRO 0.5.0 — Personnalisation, Tap Tempo et composition vocale

La version 0.5 complète la base 0.4 sans recréer ses fonctions. Elle apporte les crédits multilingues et multiples, quatre profils de publication, la numérotation et la justification de lignes, la sélection éditoriale, les vignettes de symboles et leur placement/déplacement par clic ou tactile.

TAP et le raccourci B mesurent un tempo robuste dans l’unité choisie. Une application pendant REC attend la fin de la prise. La source Vocal capture localement la mélodie avec AudioWorklet et McLeod/FFT, puis utilise le transport, le Recorder, les grilles et les prises existants. Les couches SATB, Punch, boucles, verrous, timings bruts et corrections restent disponibles.

Chaque REC conserve une prise. L’audio original peut être gardé séparément et comparé aux notes. Le `.soratro` reste compatible ; la sauvegarde facultative `.soratro-audio` transporte aussi les blobs vérifiés. Les ressources de capture sont disponibles hors ligne après chargement complet. Stop et arrière-plan libèrent le micro.

L’analyse synthétique a identifié les 360 fenêtres de référence, avec une erreur maximale de 3,94 cents. Ce résultat n’est pas une mesure sur des chanteurs ou microphones physiques. La fenêtre dure 85,3 ms et la stabilisation synthétique mesurée 70 ms ; le retard matériel doit être calibré séparément.

Site : https://zonampoina.github.io/soratro/

L’APK debug de test est construite, contrôlée par lint et vérifiée sur le commit du site avant publication. Les essais matériels Android, MIDI USB, microphones/casques, veille et impression système restent à qualifier. La signature debug ne constitue pas une signature durable de distribution.

Voir [le guide](VOCAL-TAP-PRESENTATION.md), [l’audit](AUDIT-V0.5.md) et [le rapport](RAPPORT-V0.5.md).
