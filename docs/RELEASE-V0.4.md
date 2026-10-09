# SORATRO 0.4.0 — Gravure traditionnelle et atelier de partition

La version 0.4 reprend le projet livré en 0.3.0 sans recréer ses fonctionnalités. Elle ajoute :

- les octaves classiques attachées, les deux-points entre temps principaux, les points, virgules et virgules inversées selon la subdivision ;
- une grille temporelle SATB commune, la justification régulière/adaptative et les réglages manuels de systèmes, pages et largeurs ;
- le texte commun des paroles et ses associations indépendantes par voix, avec regroupement lorsque les rythmes concordent ;
- les liaisons de durée, phrasé et mélisme, les respirations, la bibliothèque de symboles et les parcours D.C./D.S./Fine/Coda ;
- les sous-modes Lecture, Édition et Mise en page, le vérificateur et l’aperçu des modifications avant application ;
- les champs d’en-tête et de pied de page, les logos PNG/JPEG incorporés, douze variantes de police locales et les styles réutilisables.

L’écran, le SVG, le PNG, le PDF et l’impression utilisent le même document gravé. Les projets conservent le schéma 2 et le format portable 1 ; les anciens projets restent importables. Les données brutes d’enregistrement, les prises, la quantification, les couleurs et les verrous sont conservés.

Les renvois, reprises, changements de tempo chiffrés et liaisons de durée agissent sur la lecture. Les nuances, soufflets, accents, phrasés, points d’orgue et changements progressifs de tempo sont actuellement **des indications d’impression**, signalées comme telles dans la bibliothèque et le vérificateur.

Site : https://zonampoina.github.io/soratro/

L’APK jointe est une **APK debug de test**, vérifiée et issue du même commit que le site. La compilation, le lint et les simulations navigateur ne remplacent pas la qualification physique d’Android, du MIDI USB, de la latence, du partage et de l’impression système.

Voir `docs/AUDIT-REPRISE-V0.4.md`, `docs/RAPPORT-V0.4.md` et `docs/GRAVURE-TRADITIONNELLE.md` pour l’audit, la validation et les conventions.
