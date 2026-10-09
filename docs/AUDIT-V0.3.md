# Audit SORATRO — évolution V0.3

## État initial vérifié

Le site public servait **0.2.0**, commit `887479fc387be680e4f9c885fafe12fb13088dd3`, également tête de `main`. Les workflows Pages et Android de ce commit avaient réussi. L’audit a précédé les modifications : README, rapports antérieurs, architecture musicale, UI, gravure, exports, stockage/migrations, tests, PWA, workflows et Capacitor ont été lus.

Le socle initial passe 53 tests Node, 4 parcours React/JSDOM et 4 parcours Chromium. La compilation `/soratro/` fonctionne. REC, synthèse, métronome, MIDI, quantification non destructive, SATB, prises/Punch, paroles, historique et fichiers portables sont déjà opérationnels et conservés.

## Défauts reproduits et causes

| Défaut | Reproduction avant modification | Cause | Correction |
|---|---|---|---|
| Retour au Piano Roll | Zoom 120 % devenu 100 %, scroll horizontal 120/150 devenu 0, scroll vertical 1200/1400 revenu à 1130 après Partition → Composition | Rendu conditionnel qui démonte les vues, état local perdu, effets qui recentrent la hauteur | Vues montées avec clés distinctes et masquées sans espace résiduel ; préférences par projet et restauration explicite |
| Défilement Partition | Conteneurs dont les dimensions se disputent l’espace disponible ; page longue et zones comprimées | Règles CSS superposées et mauvaise propagation de `min-height: 0`/overflow | Propriétaire unique de l’espace de travail ; chaque éditeur a son viewport scrollable |
| Export étroit | Fenêtre d’environ 540 px sur un écran de 1360 px, hauteur excessive, aperçu comprimé et commandes difficiles à atteindre | `wide-dialog` sans largeur effective et absence de corps borné avec pied indépendant | Dialogue responsive à trois zones, deux colonnes sur PC, paramètres repliables sur téléphone, pied fixe interne |
| Ctrl + clic | Amorçage du drag partagé avec la sélection ; état primaire fragile lors du retrait | Mélange de gestes et modification des identifiants sélectionnés | Fonction de sélection stable, Ctrl/Cmd/Shift résolus avant capture et drag |
| Impression compilée | Détectée par le nouveau parcours d’impression : « r is not a function » | Import dynamique circulaire de la gravure transformé en import d’une exportation renommée dans le bundle | Import statique du rendu SVG dans le module d’export ; vérification sur le bundle de production |

## Risques surveillés

Les positions brutes et quantifiées doivent rester distinctes. Le masquage des silences ne touche que les opérations de dessin. Les préférences d’appareil ne doivent pas entrer dans le projet musical ni dans Undo. Les éditions de groupes doivent être atomiques, notamment avec une voix verrouillée. La gravure, le PDF, le SVG, le PNG et l’impression doivent partager les mêmes coordonnées et la même police locale.

Le verrouillage est donc vérifié aussi au point de transaction `ProjectStore.update`, ce qui protège les outils existants et les modifications de prises. REC vérifie la piste avant son armement. Undo/Redo reste une restauration explicite de l’historique. La mise à jour du service worker conserve IndexedDB ; seule la gestion des caches applicatifs reste en place.

## Décision de version

L’évolution est **0.3.0** et non une recréation. Le format portable reste version 1 et le schéma musical reste 2 : `Track.locked` est optionnel, absent = déverrouillé. La migration V0.1 et la validation des anciens fichiers restent inchangées dans leur interprétation musicale. Android passe à versionCode 3. L’URL, l’appId, le manifest, les ressources locales et la base `/soratro/` sont conservés.
