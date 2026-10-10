# SORATRO Web 0.6 — Rapport de livraison

Qualification du 10 octobre 2026. Cette évolution prolonge le dépôt existant et conserve le schéma musical 2 et IndexedDB v2.

## Versions et publication

| Élément | Résultat |
| --- | --- |
| Version initiale réellement publiée | **0.5.0**, commit `9c45672ca3e35b914a96248014145eac6168384d` |
| Version finale | **0.6.0** |
| Commit de l’implémentation | [`7ea7b66f9c757571eef7932a110125ea1016bae8`](https://github.com/ZoNampoina/soratro/commit/7ea7b66f9c757571eef7932a110125ea1016bae8) |
| Site | [SORATRO Web](https://zonampoina.github.io/soratro/) |
| Validation Chromium GitHub | [Exécution 38074709922](https://github.com/ZoNampoina/soratro/actions/runs/38074709922) — **succès** |
| Publication Pages GitHub | [Exécution 38074709860](https://github.com/ZoNampoina/soratro/actions/runs/38074709860) — **succès** |

La version applicative publiée et vérifiée est **0.6.0**, schéma 2. Le SHA effectivement déployé est donné par [version.json](https://zonampoina.github.io/soratro/version.json). Ce rapport et les preuves publiques sont ajoutés par un commit de documentation après la qualification de l’implémentation. Les jobs de compilation, tests et déploiement ont tous réussi ; les logs GitHub confirment 132 tests unitaires, 4 tests d’interface et 48 parcours Chromium réussis pour les sources finales.

L’arbre du commit d’implémentation est `a0e738c9edc91834c8e53c7bbd57f4cb090b4021`. Les sources exécutables correspondent aux fichiers validés localement ; les SHA des fichiers et de l’arbre ont été contrôlés avant publication. La mise à jour de `main` a vérifié son ancienne valeur, sans écraser de changement concurrent.

L’[audit initial](https://github.com/ZoNampoina/soratro/blob/main/docs/AUDIT-V0.6.md) détaille les causes reproduites : colonnes différentes entre lignes et police de 17 px réduite jusqu’à 1,761 px dans un cas dense. Le correctif antérieur imposant correctement le nombre de mesures a été conservé.

## Terminé et testé

**Gravure.** La grille alignée est la valeur par défaut, y compris pour les anciens projets sans le nouveau champ. Les colonnes sont calculées en commun avant le placement des systèmes. Les dernières lignes utilisent les premières colonnes de cette grille ; les emplacements manquants ne génèrent ni note, ni silence, ni numéro, ni barre fictive. Le nombre réel de mesures et les données musicales restent inchangés.

| Total, avec quatre par ligne | Répartition vérifiée | Emplacements libres sur la dernière ligne |
| --- | --- | --- |
| 5 | 4 + 1 | 3 |
| 6 | 4 + 2 | 2 |
| 7 | 4 + 3 | 1 |
| 9 | 4 + 4 + 1 | 3 |
| 11 | 4 + 4 + 3 | 1 |
| 12 | 4 + 4 + 4 | 0 |

Les comptes de 1 à 12, le mode Automatique, les paroles, reprises, sauts de page et une exception locale de trois mesures sur une grille globale de quatre sont également vérifiés. Les justifications indépendante et adaptative restent disponibles. Le mode proportionnel conserve les positions rythmiques communes SATB ; le mode adaptatif assume des espacements et des colonnes variables.

**Typographie.** Les tailles 12, 17, 20 et 24 restent exactes sur toutes les voix et pages, même quand une ligne ne tient pas. Les octaves, deux-points, points, virgules et subdivisions en tiers sont couverts. L’ancien coefficient visuel de taille ne transforme plus la police du document. Les espacements sont optimisés jusqu’à leur minimum ; un dépassement garde les caractères à leur taille, déclenche un avertissement et bloque l’application/export jusqu’à correction. Les propositions paysage, marges, nombre de mesures et mode adaptatif modifient le brouillon. La réduction de taille reste une décision manuelle.

**Mise en page.** L’aperçu reprend les mêmes préférences Solfa (espacement et densité) que Partition et Export ; un test compare toutes les positions et tailles avec un profil personnalisé. La saisie numérique accepte les valeurs intermédiaires pendant la frappe sans modifier le document validé. Un seul contrôle « Mesures par ligne » remplace le doublon, avec 4 par défaut, 0 pour Auto et les propositions 1–12. Les sections Document, Mesures et systèmes, Typographie, En-tête, Pied de page et Styles possèdent un aperçu immédiat. Les symboles utilisent leur bibliothèque dédiée. Les options avancées sont repliables ; les favoris persistent sans dupliquer les champs. La réinitialisation d’une ligne conserve la musique et les exceptions extérieures. Appliquer, Annuler et Rétablir sont vérifiés, ainsi que l’abandon d’un brouillon et la conservation des styles.

**Web mobile.** L’éditeur de page et Export occupent l’écran du téléphone. Les paramètres peuvent être ouverts puis fermés sans perdre l’aperçu. Les boutons de validation restent accessibles à faible hauteur ; un viewport de clavier réduit à 350 px a été simulé. Le zoom numérique, le pincement et le double-tap restent des préférences d’écran. La rotation conserve le document et le zoom. Le déplacement tactile ne doit pas déclencher une édition.

**Espace musical.** Les barres secondaires défilent, le piano et les pistes peuvent être rabattus, et le paysage réduit la hauteur des contrôles. Les vues existantes restent montées. Les tests conservent zoom, défilements, sélection et voix active lors de vingt changements de mode. Les menus des notes et du Tap Tempo mesurent leur taille et se replacent dans le viewport ; leurs commandes restent accessibles aux bords des huit résolutions.

**Vocal et fonctions antérieures.** Chantonner/Chanter, micro, Recorder, worker de hauteur, prises et audio original facultatif sont conservés. Les contrôles avancés restent repliés et le Piano Roll conserve une surface utilisable. Le parcours Vocal est exécuté avec les vraies API navigateur et un signal audio synthétique. Les tests couvrent également SATB, clavier, transport, métronome, Tap Tempo, édition, sélection multiple, quantification, paroles, reprises, symboles, crédits, langues, styles, sauvegarde et import/export portable.

## Résultats des tests

| Contrôle | Résultat |
| --- | --- |
| Compilation TypeScript et production Pages | Réussie |
| Tests unitaires, dont 25 nouveaux tests de gravure | **132 / 132** |
| Tests d’interface | **4 / 4** |
| Parcours Chromium | **48 / 48** sur GitHub (1 min 42 s dans le job Pages) ; les 47 autres parcours et le nouveau contrôle de fidélité ont aussi réussi localement |
| Régression et mise à jour du cache PWA | Réussies |
| Erreurs JavaScript dans le contrôle de mise à jour | Aucune |

La matrice vérifie composition, Piano Roll, source Vocal, menus, dialogues, modification des paramètres, aperçu, absence de débordement global et téléchargement PDF :

| Résolution | Résultat Chromium |
| --- | --- |
| 360 × 640 | Réussi |
| 390 × 844 | Réussi |
| 412 × 915 | Réussi |
| 740 × 390, paysage | Réussi |
| 800 × 1280, tablette | Réussi |
| 1366 × 768 | Réussi |
| 1440 × 900 | Réussi |
| 1920 × 1080 | Réussi |

Le scénario principal vérifie 7 mesures, 4 par ligne, 112 notes à 20 px et un zoom de 150 % qui ne modifie pas le projet musical. Les exports PDF, SVG et PNG sont effectivement téléchargés. Le PDF vectoriel utilise 15 points pour les notes de 20 px ; son rendu et le PNG ont été inspectés visuellement. Les polices sont incorporées. Le chemin HTML d’impression utilise la même gravure et est couvert par les tests navigateur.

Le benchmark de 100 mesures SATB, 2 400 notes, huit couplets et 1 600 syllabes produit 25 systèmes sur 13 pages : 307,2 ms au premier calcul, médiane chaude 222,2 ms et maximum chaud 259,7 ms sur Node 24.19 dans cet environnement. Ces chiffres ne constituent pas une mesure sur téléphone.

## PWA, exports et preuves

Le contrôle complémentaire sert deux compilations réelles de 0.5.0 et 0.6.0 sous la même origine, active **Sauvegarder & mettre à jour**, puis compare les projets IndexedDB. Les **96 notes**, le projet complet, une préférence de contrôle et le zoom 120 % sont conservés. Le redémarrage à froid hors ligne et l’export PDF hors ligne réussissent. Les 37 ressources de la compilation propre sont toutes précachées ; le cache précédent reste disponible pour les onglets anciens.

- [Preuve de mise à jour PWA](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/pwa-update-result.json)
- [Mise en page PC 1366 × 768](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/desktop-1366-layout.png)
- [Mise en page téléphone 360 × 640](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/mobile-360-layout.png)
- [Mise en page paysage 740 × 390](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/landscape-740-layout.png)
- [Export paysage](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/landscape-740-export.png)
- [Composition Vocal 390 × 844](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/mobile-390-vocal.png)
- [PDF de sept mesures](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/seven-bars.pdf), [SVG](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/seven-bars.svg), [PNG](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/seven-bars.png)

Les captures sont des partitions de contrôle synthétiques. Les rapports et captures complets sont conservés dans l’artifact `Chromium-validation-7ea7b66f9c757571eef7932a110125ea1016bae8` du workflow Chromium (6,75 Mo, expiration prévue le 9 novembre 2026). Le [guide utilisateur](https://github.com/ZoNampoina/soratro/blob/main/docs/WEB-LAYOUT-V0.6.md) explique les réglages et les commandes de vérification.

## Vérification directe du site public

Un nouveau contexte Chromium tactile de 390 × 844 a ouvert directement l’URL GitHub Pages. Le contrôle a relevé 0.6.0 et le commit de l’implémentation, importé sept mesures, vérifié les sept rectangles de mesures et les 112 notes à 20 px, puis réglé le zoom à 150 % sans changement du projet. Un PDF a été téléchargé depuis le site public. Après activation du cache public `0c1a478920ce`, le réseau a été coupé : rechargement à froid, conservation du projet et second PDF hors ligne ont réussi, sans erreur JavaScript.

[Résultat public](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/published-result.json) · [Capture publique de mise en page](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/published-mobile-layout.png) · [PDF produit hors ligne sur le site public](https://github.com/ZoNampoina/soratro/blob/main/docs/validation-v0.6/published-offline.pdf).

## Implémenté mais partiellement vérifié

L’adaptation Android Web est vérifiée dans Chromium avec écrans tactiles simulés. Aucun appareil Android physique n’était accessible. Le comportement du clavier virtuel est simulé par `visualViewport` ; les variations réelles de barres du navigateur, encoches, installation et lancement de la PWA nécessitent un appareil réel.

Web Share est vérifié avec simulations d’API pour partage accepté, repli téléchargement et annulation. Le dialogue de partage Android réel n’a pas été utilisé. L’impression papier, le microphone matériel, sa latence, le chant humain et un clavier MIDI USB réel restent à qualifier. Les sorties numériques, le signal Vocal synthétique et la logique MIDI sont couverts automatiquement.

## Non terminé et anomalies restantes

Aucune anomalie bloquante connue ne subsiste dans les parcours critiques testés. La qualification physique Android et des périphériques ci-dessus reste à effectuer. La compilation émet toujours un avertissement non bloquant sur la taille du bundle principal supérieure à 500 kB.

Aucun APK ni EXE n’a été créé ou publié. Le workflow Android est manuel ; le job de release APK a été retiré de Pages. Le projet Capacitor reste disponible pour une mission native ultérieure.
