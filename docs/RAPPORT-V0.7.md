# SORATRO 0.7 — Rapport de livraison Web

Livraison du 11 octobre 2026. L’application existante a été améliorée dans son dépôt ; aucun nouveau projet, APK, EXE ni release native n’a été créé.

| Référence | Résultat |
| --- | --- |
| Version initiale | 0.6.0, `fc7e4653af7bf9e4d9ac4922f7ce11cecfed3a1e` |
| Version finale | **0.7.0** |
| Commit du moteur validé | [`e6fa8f3eae5d6ef1bc320564a565f2681e0ca1ab`](https://github.com/ZoNampoina/soratro/commit/e6fa8f3eae5d6ef1bc320564a565f2681e0ca1ab) |
| Application publiée | [SORATRO Web](https://zonampoina.github.io/soratro/) |
| Schéma musical / IndexedDB / fichier portable | 2 / 2 / 1, inchangés |
| Déploiement du moteur | GitHub Pages réussi, version et commit contrôlés sur le site public |

Ce rapport et les preuves publiques sont ajoutés après validation du commit du moteur. Le commit documentaire suivant conserve exactement son code exécutable ; `version.json.commit` identifie la révision effectivement publiée.

## Gravure et alignement

La grille de colonnes de la V0.6 est conservée. Les mesures correspondantes ont les mêmes frontières dans les systèmes d’une même famille de grille. Les dernières lignes restent dans leurs premières colonnes ; les emplacements manquants ne dessinent ni mesure ni barre fictive. Un seul champ **Mesures par ligne** reste visible, avec 4 par défaut, Automatique = 0, 1 à 12 et les exceptions locales existantes.

| Mesures réelles | Disposition à quatre mesures par ligne | Emplacements libres sur la dernière ligne |
| ---: | --- | ---: |
| 5 | 4 + 1 | 3 |
| 6 | 4 + 2 | 2 |
| 7 | 4 + 3 | 1 |
| 9 | 4 + 4 + 1 | 3 |
| 11 | 4 + 4 + 3 | 1 |
| 12 | 4 + 4 + 4 | 0 |

Le changement principal porte sur le temps à l’intérieur des mesures. Une conversion affine commune transforme l’instant musical en coordonnée graphique. En 4/4, les trois deux-points se trouvent à W/4, W/2 et 3W/4 de la largeur musicale. Ces références restent identiques pour Soprano, Alto, Ténor et Basse, avec des notes longues, des silences et des subdivisions différentes. Les signatures 2/4, 3/4, 6/8, 9/8 et 12/8, les groupes personnalisés et la pulsation composée sélectionnée sont contrôlés.

Les demi-temps suivent 1/2 ; les quarts suivent 1/4, 1/2 et 3/4 ; les tiers suivent 1/3 et 2/3. Le signe des tiers utilise une courbe vectorielle locale. Les temps ne subissent plus l’ancien arrondi à quatre décimales. Les subdivisions propres à une voix ne créent plus de prolongations ou de signes étrangers dans les autres voix.

Les centres des notes suivent la même conversion, avec une compensation typographique constante dans la mesure et commune aux voix. Ils ne dépendent plus du prochain ancrage, de la longueur du texte suivant ou de la durée d’une autre voix. L’adaptation porte sur la largeur proposée ; elle ne déforme aucun rapport de subdivision.

Le contrôle final a aussi identifié et corrigé un cas d’instants proches de divisions standards : des valeurs enregistrées ou arrondies pouvaient provoquer une cellule presque superposée et une largeur minimale excessive. La reconnaissance rythmique et la grille utilisent désormais la même tolérance temporelle. Les instants réels restent conservés ; une subdivision irrégulière garde son signe secondaire jusqu’à une quantification explicitement choisie.

Les tests du moteur admettent une erreur inférieure à **0,0000001 px**. La sérialisation SVG écrit trois décimales ; ses tests de centrage admettent **0,002 px**. Sur le site public, l’erreur maximale de l’ancrage sérialisé du témoin SATB est **0.000408871 px**.

## Typographie, ponctuations et centrage

**Mise en page → Typographie → Ponctuations rythmiques** propose Normal, Renforcé par défaut et Personnalisé. Normal utilise 85 % de la taille Solfa, Renforcé 100 %. Le contraste est plus sombre que le rendu précédent. L’épaisseur est réglable par un contour du même ton et par le trait vectoriel des tiers. Les réglages fins repliables couvrent taille relative, contraste, épaisseur et espace de sécurité. Le changement se voit immédiatement dans l’aperçu et les mêmes commandes sont disponibles dans les réglages avancés de l’export.

Le centre prend en compte le contour réel de la police, particulièrement la virgule, et les extrêmes de la courbe des tiers. Renforcer un signe ne déplace donc pas sa frontière. Les marques **d', d'', d, et d,,** restent proches de leur lettre et à 70 % de la taille Solfa. Elles ne reçoivent pas le traitement des séparateurs.

Les tailles **12, 17, 20 et 24 px** sont testées avec les trois styles. Une taille Solfa de 20 reste 20 dans le SVG et l’aperçu, soit 15 points dans le PDF ; les octaves sont à 14 px. Aucun compactage ni zoom ne réduit silencieusement le document. Une ligne trop dense conserve sa taille, affiche une contrainte et bloque l’application ou l’export tronqué. Les corrections restent des choix explicites : paysage, marges, nombre de mesures ou taille.

La réserve SATB n’est plus fixée à 54 px. Elle est calculée à partir des noms réels et disparaît avec **Jamais**. Les numéros de couplets peuvent conserver leur réserve utile. Premier système seulement, Première ligne de chaque page et Toujours conservent une origine commune. Masquer les noms libère la largeur ; la justification naturelle centre le bloc de référence complet sans recentrer isolément la dernière ligne. Noms longs, paroles, marges et sauts de page sont couverts.

## Mise en page et ergonomie Web

Les sections sont Document, Mesures et alignement, Typographie, Voix et paroles, En-tête, Pied de page et Styles. Les noms, l’espacement des voix et la présentation des textes liés sont regroupés dans Voix et paroles. Les favoris et volets avancés évitent les doublons. Sauts, exceptions, largeurs manuelles, réinitialisations locales, crédits multilingues et profils de publication sont conservés.

Sur PC, les réglages restent à gauche et l’aperçu à droite. Sur téléphone, l’aperçu occupe le panneau principal et les paramètres s’ouvrent temporairement ; Appliquer reste accessible en haut. Les réglages fins et leurs saisies décimales ont été exercés sur huit résolutions. Les fonctions tactiles de la V0.6 ont été conservées et vérifiées : pincement, double-tap, déplacement, sélection, rotation et maintien du projet et du zoom. Le test du clavier réduit le viewport visible et confirme l’accès à la validation.

| Écrans contrôlés dans Chromium | Portée |
| --- | --- |
| 360 × 640, 390 × 844, 412 × 915 | Portrait téléphone |
| 740 × 390 | Paysage téléphone |
| 800 × 1280 | Tablette |
| 1366 × 768, 1440 × 900, 1920 × 1080 | PC |

Composition, ruban et panneaux rabattables, clavier virtuel, Piano Roll, menus contextuels, transport, Tap Tempo, Vocal, Partition, export et sauvegarde restent couverts. Ces essais sont une émulation de viewport et de toucher ; aucun téléphone Android physique n’a été utilisé.

## Tests, exports et compatibilité

L’audit initial passe **132 tests unitaires, 4 tests d’interface et 48 parcours Chromium**. Après modification, **161 tests unitaires, 4 tests d’interface et 58 parcours Chromium** passent. Les 29 nouveaux tests du moteur couvrent notamment temps exacts, glyphes, signatures, instants non quantifiés, masquage SATB, tolérances, compatibilité et rendu vectoriel. Les dix nouveaux parcours navigateur contrôlent les préférences de ponctuation sur huit écrans, les exports et l’annulation d’un ancien projet.

Le témoin final contient **sept mesures, 116 notes SATB, quatre mesures par ligne, des croches, doubles-croches, triolets et une basse tenue**, avec taille 20 et ponctuation personnalisée. Ses deux lignes occupent 4 + 3 colonnes, les temps principaux sont communs aux voix et aucune huitième mesure n’existe. À 150 % de zoom, les vecteurs exportés et le projet restent identiques.

PDF et SVG utilisent les mêmes opérations vectorielles que l’aperçu ; PNG rasterise ce SVG avec les polices incorporées. Les vrais téléchargements PDF/SVG/PNG ont réussi localement et sur le site public. La planche des douze variantes, le PDF à 20 px et le PDF complet du témoin ont été inspectés visuellement, après rendu Poppler pour les PDF. Les signes sont visibles, les octaves distinctes, les colonnes alignées et les marges respectées. Impression et partage Web conservent leurs parcours automatisés.

Les anciens projets peuvent omettre le nouveau champ `layout.punctuation` : le rendu Renforcé s’applique sans ajout au projet ni migration de base. Les fichiers `.soratro` et styles conservent les nouvelles valeurs lorsqu’elles existent. L’application et l’export restent annulables ; Undo/Redo restaure les présentations en une modification. Notes, prises, timing original et quantifié, tempo, tonalité, paroles, liens, reprises et indications sont conservés.

La non-régression couvre également édition, audio Web, métronome, Tap Tempo, enregistrement, quantification, composition vocale, audio portable, paroles et symboles. Les API AudioWorklet, Worker, MediaRecorder et Web Audio sont réellement exercées dans Chromium, avec une entrée audio synthétique. Les tests ne qualifient pas un microphone ou un clavier MIDI physique.

Le benchmark de 100 mesures SATB, 2 400 notes, huit couplets et 1 600 syllabes produit 25 systèmes sur 13 pages : **508,2 ms** au premier calcul, médiane chaude **415,8 ms**, maximum chaud **474,5 ms** sur Node 24.19. La gravure respecte le seuil existant de quatre secondes et la limite mémoire testée. Elle effectue davantage de contrôles que la V0.6 ; ces chiffres ne sont pas une mesure de performance sur téléphone.

## PWA, GitHub Actions et publication

Le passage réel **0.6.0 → 0.7.0** a été exercé avec deux compilations sur une même origine et le bouton **Sauvegarder & mettre à jour**. Une comparaison exacte des projets et d’un marqueur de préférences confirme la conservation des **96 notes** de l’étude et du zoom Piano Roll à 120 %. Le paysage avait été choisi explicitement avant le snapshot. Un nouveau processus Chromium utilisant le même profil a ensuite démarré hors ligne et exporté un PDF, sans erreur JavaScript. Le cache conserve la version courante et une précédente selon sa politique existante.

Sur l’adresse publique HTTPS, `version.json` confirme 0.7.0 et le commit du moteur. Le témoin SATB et ses réglages sont importés, la grille et les tailles contrôlées, puis PDF/SVG/PNG téléchargés. Le service worker contrôle la page ; une relance de page hors ligne conserve le projet et permet encore l’export PDF. Les preuves distinguent ce contrôle public de page du redémarrage complet de processus testé sur l’origine locale.

| Workflow GitHub du moteur | Statut | Exécution |
| --- | --- | --- |
| Publish SORATRO to GitHub Pages | **success**, build et déploiement | [38111053185](https://github.com/ZoNampoina/soratro/actions/runs/38111053185) |
| Validate SORATRO in Chromium | **success**, contrôles navigateur | [38111053161](https://github.com/ZoNampoina/soratro/actions/runs/38111053161) |

Le workflow Pages vérifie compilation, tests unitaires/interface et Chromium avant le déploiement. Les workflows natifs n’ont pas été lancés. La publication est un avancement de `main`, sans écrasement de travail concurrent.

## État de livraison et limites

| État | Fonctions |
| --- | --- |
| Terminées et contrôlées automatiquement | Grille de colonnes, lignes incomplètes, conversion temporelle SATB, demis/quarts/tiers, ponctuations et préférences, centrage et marges, tailles exactes, mise en page, contrôles responsive/tactiles, exports, compatibilité, sauvegarde, Undo/Redo, mise à jour et fonctionnement hors ligne, Actions et Pages |
| Partiellement qualifiées | Expérience sur Android réel, clavier virtuel du système, installation et cycle de vie de la PWA installée, micro réel et latence matérielle, MIDI matériel, Web Share entre applications et impression physique |
| Hors périmètre, non produites | APK final, EXE Windows, packaging et release native |

Aucun échec critique connu ne subsiste dans les tests exécutés. Les compositions trop denses peuvent demander une adaptation explicite : l’étude de démonstration 6/8 en portrait, quatre mesures à 17 px, nécessite par exemple le paysage. La musique et la mise en page sauvegardées ne sont pas réécrites automatiquement. Les essais matériels et la performance sur téléphone restent à compléter ; aucune validation physique n’est revendiquée.

Les preuves sont dans [validation-v0.7](validation-v0.7/) : [résultats locaux](validation-v0.7/local-result.json), [journal Chromium](validation-v0.7/chromium.log), [mise à jour PWA](validation-v0.7/pwa-update.json), [contrôle public](validation-v0.7/public-result.json), [PDF du témoin](validation-v0.7/mixed-rhythms.pdf), [planche typographique](validation-v0.7/punctuation-matrix.png) et [douze variantes PDF/SVG](validation-v0.7/typography-variants.tar.xz). Le [guide Web](WEB-LAYOUT-V0.7.md), [l’audit](AUDIT-V0.7.md) et [le format portable](FORMAT-SORATRO.md) permettent de reproduire les contrôles.
