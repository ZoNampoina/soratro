# Audit initial — 7 octobre 2026

Base : `17b58d40e104a3a869b2af1e4d4c5e29d3792ff7`, GitHub `ZoNampoina/soratro`.
Checkout distinct, branche locale `work/v0.2`. Le projet précédent n’a pas été réinitialisé.

`npm ci`, `npm run build:pages` et les 17 tests V0.1 passent avant modification. La page publique répond HTTP 200 et charge ses ressources sous `/soratro/`. Le bundle compilé correspond à la version publiée.

Architecture conservée : React/Vite/TypeScript ; modules séparés music, recording, quantization, audio, midi, score et storage. IndexedDB `soratro` v1 contient projects/preferences. Le service worker précache le build et isole les caches par chemin. Le workflow Pages compile, teste puis déploie.

Écarts prioritaires : pas d’import/export portable ni d’historique ; erreurs de flush masquées ; identifiants SATB et rendu quatre voix fixes ; paroles libres sans liens ; rythme unique et tempo noir dans tous les morceaux ; chromatisme `li` au lieu de `ta` ; MIDI sans CC64 ; capacités Android seulement déclarées dans une configuration.

Risques : pertes d’anciennes compositions lors d’une migration ; offsets entre beats et secondes ; prise en cours affectée par une modification structurelle ; décalage des paroles lors de copie/suppression ; mise à jour PWA au milieu d’une session ; rendu et lecture d’un morceau long.

La migration conserve les identifiants, événements, valeurs temporelles brutes et BPM historiques. Les fonctionnalités nouvelles seront testées par lots. Les tests matériels (MIDI USB, latence physique, Android réel, verrouillage d’écran) doivent être distingués des simulations et builds.
