# SORATRO V0.3 — rapport technique et validation

## Versions et périmètre

Version initiale réellement servie : **0.2.0**, commit `887479fc387be680e4f9c885fafe12fb13088dd3`. Version livrée : **0.3.0**, référence immuable [v0.3.0](https://github.com/ZoNampoina/soratro/tree/v0.3.0). Le SHA complet du build Web figure dans [version.json](https://zonampoina.github.io/soratro/version.json), également incorporé dans l’APK de test. La confirmation des workflows et de la version publique est jointe au rapport de livraison après publication.

L’évolution est incrémentale. Le moteur musical, le format `.soratro` version 1, le schéma 2, IndexedDB v2, l’appId Android et l’adresse https://zonampoina.github.io/soratro/ sont conservés. Aucun projet utilisateur n’est supprimé ou réinitialisé.

## Résultats des vingt améliorations

« Terminé et testé » désigne ici les tests automatiques et inspections réellement effectués en Chromium sur PC et en simulation tactile. Les essais Android physiques ont leur propre statut ci-dessous.

| Demande | État | Vérification |
|---|---|---|
| 1. Masquer les 0 | Terminé et testé | Option désactivée par défaut, retour des symboles, coordonnées/rythme/modèle identiques |
| 2. Retour au Piano Roll | Terminé et testé | 20 allers-retours Composition/Partition/Répétition, zoom 120 %, deux scrolls et sélection conservés |
| 3. Scroll Partition complet | Terminé et testé | Dernière page d’une partition de 17 pages, navigation et scroll internes ; suivi suspendu manuellement puis repris |
| 4. Ctrl/Cmd, Shift et Multi | Terminé et testé | Notes 1/4/7, retrait, drag de groupe, Undo exact ; rectangle et clavier conservés ; Multi tactile essayé |
| 5. Panneaux rabattables | Terminé et testé | Pistes ouvertes/réduites/masquées, clavier, ruban, en-tête, outils et inspecteur ; espace récupéré |
| 6. Immersion | Terminé et testé | F10/Échap, transport essentiel, restauration exacte de dimensions personnalisées |
| 7. Redimensionnement | Terminé et testé | Pistes, piano et partage par séparateurs, limites/retour standard ; export PC redimensionné |
| 8. Mémoire des dispositions | Terminé et testé | Préférences d’appareil et navigation/zoom/scroll par projet, rouverture et reprise hors ligne |
| 9. Synchronisation | Terminé et testé | Identifiants communs, surlignage dans les deux vues, navigation facultative, presse-papiers partagé |
| 10. Zoom sélection | Terminé et testé | Bornes de temps et hauteur, marges ; toutes les notes choisies restent dans le viewport après resize |
| 11. Cadrages automatiques | Terminé et testé | Sélection/mesure/quatre mesures/composition et manuel ; largeur/hauteur/page/deux pages côté Solfa |
| 12. Navigateur | Terminé et testé | Pages, systèmes, miniatures légères, mesures, repères, position et retour lecture |
| 13. Verrouillage | Terminé et testé | Alto protégé contre drag, suppression, durée, transposition, quantification, prises et REC ; sélection/mixer autorisés |
| 14. Couleurs | Terminé et testé | Palette, couleur personnalisée, restauration ; voix/pistes/roll/timeline/miniatures ; export noir par défaut |
| 15. Alignements | Terminé et testé | Débuts/fins/durée/répartition/grille, multivoix, Undo en une transaction, hauteurs et jeu brut inchangés |
| 16. Préférences Solfa | Terminé et testé | Silences, nombres, repères, prolongations, taille, espacement, densité, séparateurs et trois préréglages |
| 17. Partition plein écran | Terminé et testé en Chromium | API native et refus simulé avec repli interne, sortie et restauration de la disposition |
| 18. Préécoute | Terminé et testé en Web Audio | Fréquence réelle correspondant au MIDI choisi, extinction, désactivation, silence en Ctrl/Multi, annulation d’une initialisation tardive |
| 19. Édition directe | Terminé et testé | m→f en Do=Db produit MIDI 66 ; degré/octave/altération, timing, groupe, source commune et Undo/Redo |
| 20. Fenêtre d’export | Terminé et testé | PC/téléphone portrait/paysage, resize, aperçu dynamique, pied accessible, erreurs/retry, fermeture/focus et mémoire |

## Architecture et fichiers principaux

- `storage/ui-preferences.ts`, `ui/usePreference.ts`, `ui/useRollViewport.ts` : normalisation, persistence différée dans le stockage existant, navigation et cadrages séparés de la musique.
- `ui/WorkspaceControls.tsx`, `ui/ResizeHandle.tsx`, `ui/DisplayPreferences.tsx` et `ui/workspace.css` : états des panneaux, préréglages et propriétaire unique des dimensions. Les vues restent montées avec des clés différentes.
- `music/note-editing.ts`, `music/selection-editing.ts` : sélection stable, presse-papiers commun et transformations atomiques de groupes qui conservent les données brutes.
- `music/locks.ts`, `storage/store.ts`, `recording/session.ts` : protection des pistes au point de transaction et avant REC, y compris les outils antérieurs.
- `ui/TrackStrip.tsx`, `ui/NoteInspector.tsx` : mixer/couleurs/cadenas et édition contextuelle Solfa. `ui/App.tsx` conserve l’orchestration existante sans absorber ces services.
- `score/display.ts`, `score/engraving.ts`, `ui/SolfaScore.tsx` : options visuelles, identifiants individuels des notes d’accord, navigation/zoom, contenu SVG mémorisé et couche de sélection/lecture.
- `ui/PrintPreview.tsx`, `ui/Dialog.tsx`, `score/export.ts` : dialogue borné, paramètres et aperçu scrollables séparément, gravure mémorisée indépendamment du format et de la taille de fenêtre, export commun et import d’impression corrigé.
- Version dans `package.json`, `package-lock.json`, modèle et Android ; workflows conservés et notes de release Android adaptées à la version courante.

## Validation locale complète

La dernière exécution réussit **61 tests Node + 4 tests React/JSDOM + 18 parcours Playwright Chromium = 83 tests**, sans échec ni test ignoré. Le banc Web Audio réel, inclus dans un des parcours, contient aussi sept assertions fonctionnelles de synthèse/métronome/transport/offline historiques. La compilation TypeScript/Vite Pages et le contrôle des imports inutilisés passent.

Commandes : `npm run build:pages`, `npm test`, `npm run test:browser`, `npx tsc --noEmit --noUnusedLocals`. La compilation native utilise `npm run build` puis `npx cap sync android`. Les sources des essais se trouvent dans `tests/advanced-editing.test.ts`, `tests/display.test.ts`, les tests antérieurs conservés et `tests/e2e/`.

### Scénarios A à N

A : symboles masqués/réaffichés, modèle et géométrie conservés. B : 20 changements de mode. C : 17 pages et suivi/scroll manuel. D : 1/4/7, retrait, déplacement et Undo. E/F : espace libéré et retour exact d’Immersion. G : taille des pistes retrouvée après reload. H/I : sélection commune et cadrage de notes éloignées. J : Alto verrouillé, message explicite, pas de changement partiel. K : fréquence, extinction et préécoute désactivée. L : MIDI/Solfa/roll, source de lecture et Undo/Redo. M : cinq alignements, raw timing et Undo. N : migration V0.1, export/import exact, paroles/prises/repères conservés et préférences séparées.

### Exports 1 à 10

Ouverture centrée, deux colonnes PC, adaptation téléphone, redimensionnement manuel, paramètres et aperçu indépendants, pied visible, multipage, papier/orientation/marges/notes/paroles/systèmes dynamiques, fermeture/Échap/focus et rouverture testés. Une requête de police volontairement bloquée déclenche un message, garde les réglages et libère l’état occupé ; l’export réussit à la nouvelle tentative.

PDF vectoriel valide avec police locale, SVG embarquant la police et PNG à signature valide sont téléchargés et examinés. L’impression crée les mêmes pages SVG, notes et dimensions que l’aperçu depuis le bundle de production. Le dialogue système d’impression est remplacé uniquement dans le test automatisé ; une imprimante physique n’a pas été utilisée.

L’essai de 100 mesures a **17 pages A4** avec réglages initiaux. Après A5 paysage, marges de 10 mm et deux mesures par système, l’aperçu et le PDF ont **50 pages**, de **210 × 148 mm**. Les pages 1 et 50 ont été rendues avec Poppler et inspectées : notes, deux couplets par voix, mesures 99–100, marges et pagination correctes. Les PDF de reprise après erreur et de travail hors ligne ont également été lus. Aucun moteur PDF n’a été remplacé.

### Offline

Service worker contrôlant la page, réseau coupé, reload à froid : composition et préférences retrouvées, Immersion quittée sans réafficher les panneaux masqués, édition Solfa sauvegardée, Play/Stop, PDF puis second reload validés. Les tests de cache à `/` et `/soratro/` sont conservés. Il s’agit d’un redémarrage navigateur sous service worker ; l’installation manuelle d’une PWA sur un téléphone physique n’a pas été réalisée.

### Visuel et performance

Captures inspectées en sombre et clair à 1360×960, smartphone 390×844 et paysage 740×390 ; resize à 1024×768 dans le scénario de cadrage. Les mêmes règles répondent au format tablette, mais aucune tablette physique n’a été employée. La fenêtre d’export et ses contrôles restent accessibles ; le mode Page entière recadre la page courante après resize. L’inspecteur se replie sur plusieurs lignes et les poignées ne capturent pas une sélection Multi.

`npm run benchmark` : 100 mesures, quatre voix, 2 400 notes, huit couplets et 1 600 syllabes liées, 17 pages / 34 systèmes. Sous Node v24.19.0 dans cet environnement : premier rendu **206,3 ms**, médiane de cinq rendus suivants **159,5 ms**, maximum **170,7 ms**. Ces chiffres portent sur la gravure, pas sur une garantie de FPS sur Android. Le parcours navigateur mesure aussi le chargement et pratique mode, scroll, zoom, sélection, panneaux et export sur ce grand projet.

## Android et publication

**Terminé et testé localement** : synchronisation Capacitor, cinq plugins existants conservés, ressources incorporées, version 0.3.0 / versionCode 3 et simulations tactiles Chromium portrait/paysage. Le build APK/Gradle/lint est exécuté par le workflow Android avec Java 21 et SDK Android ; le poste de travail local ne possède pas ce SDK.

**Implémenté mais partiellement vérifié** : qualification Android réelle de rotation, scrolling tactile sur WebView, séparateurs, plein écran natif/repli, préécoute/latence, sélecteur de fichiers, partage et impression Android, MIDI USB et PWA installée. Aucun essai sur appareil physique ou émulateur Android n’est présenté comme effectué.

La publication utilise les workflows existants [Pages](https://github.com/ZoNampoina/soratro/actions/workflows/pages.yml), [Chromium](https://github.com/ZoNampoina/soratro/actions/workflows/browser.yml) et [Android](https://github.com/ZoNampoina/soratro/actions/workflows/android.yml). Le job de release attend l’APK réussi du même SHA et vérifie son `assets/public/version.json` avant publication. Le rapport de livraison indique les runs effectivement observés, leur conclusion, le SHA public et les contrôles après mise à jour.

## Limites et travaux reportés

Aucune des vingt commandes demandées n’est laissée factice ou non implémentée. La qualification matérielle ci-dessus reste **non effectuée** faute de téléphone, tablette, imprimante ou clavier MIDI physique accessible. Firefox/Safari, les performances sur téléphones anciens et les variations d’API Fullscreen/WebView restent à qualifier. L’APK est une version debug de test ; signature de production et Play Store restent hors du périmètre de cette publication.

Pour transférer la musique, utiliser `.soratro`. Les choix d’affichage et dispositions restent volontairement propres à l’appareil. PNG/SVG exportent la page affichée ; PDF/impression exportent la portée sélectionnée, comme indiqué dans le dialogue.
