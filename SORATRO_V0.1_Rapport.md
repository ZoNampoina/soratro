# SORATRO V0.1 — Rapport de réalisation et de validation

Date : 7 octobre 2026. Dépôt : https://github.com/ZoNampoina/soratro

## Publication GitHub Pages

La configuration de publication cible https://zonampoina.github.io/soratro/. Le workflow GitHub Actions compile la version `/soratro/`, lance les tests puis déploie le site. Les ressources, le manifeste PWA, les icônes et le service worker utilisent le dossier de l’application. Le cache est propre à ce dossier et préserve ceux des autres applications du même domaine.

Après cette adaptation : compilation Pages réussie et **17 tests automatisés réussis**, dont la navigation à froid hors ligne à la racine et sous `/soratro/`. Les résultats ci-dessous décrivent la validation fonctionnelle initiale de V0.1.

## Fonctions réalisées

- Création, ouverture, renommage, duplication et suppression de projets. Métadonnées, tonalité, BPM, mesures, paroles et quatre pistes SATB.
- Piano virtuel polyphonique, touches PC, changement d’octave et gestion indépendante des pointeurs. Entrées Web MIDI avec sélection, connexion et déconnexion.
- Synthèse piano locale avec Web Audio, mixer SATB, volumes, Mute/Solo, transport, tête de lecture, pause/reprise, boucles et métronome accentué. Décompte de zéro, une ou deux mesures.
- Enregistrement réel des événements NOTE ON/OFF : hauteur MIDI, vélocité, secondes brutes, durée, piste et position musicale. Overdub sur la piste active avec lecture des autres voix.
- Piano Roll : ajout, déplacement, hauteur, durée, copie, suppression, zoom, grille, Undo/Redo et visualisation des autres voix.
- Quantification non destructive : aucune, noire, croche, double croche et automatique ; force réglable ; conservation et restauration du timing original.
- Do mobile dans les douze tonalités, altérations et octaves. Partition Solfa SVG avec axe temporel partagé, silences, prolongations et groupements du 6/8.
- IndexedDB et sauvegarde automatique. Préférences locales, thèmes clair/sombre, dispositions PC et téléphone.
- PWA avec manifeste, icônes et précache de tous les fichiers de production. Aucun serveur musical ni téléchargement de sons nécessaire.
- Logo provisoire plume/papier. Configuration Capacitor préparée pour une future application Android.

## Portée et fonctions partielles

La partition IRAKA sert de référence de structure et de présentation. L’étude SATB intégrée est un exemple musical, sans prétendre transcrire intégralement cette partition.

La quantification automatique utilise une heuristique simple ; le son est une synthèse légère plutôt qu’un piano échantillonné. Les paroles sont simples et ne disposent pas encore d’un alignement syllabique détaillé. La mise en page Solfa couvre la V0.1 et ne remplace pas un logiciel complet de gravure.

Le cache hors ligne est implémenté et testé automatiquement, mais le test L complet sur une PWA installée, après fermeture du navigateur et coupure réelle du réseau, reste à effectuer sur une origine HTTPS. Le navigateur de validation utilise HTTP. Le multitouch Android et un clavier MIDI physique restent à vérifier sur matériel.

## Tests effectués

Compilation TypeScript et production Vite réussies. **16 tests automatisés réussis, zéro échec**, puis **7 vérifications fonctionnelles réussies dans Chrome**.

| Test demandé | Résultat et preuve |
|---|---|
| A — Création | IRAKA, Db, 6/8, 72 BPM et SATB créés dans l’interface ; modèle également testé. |
| B — Métronome | Rendu Web Audio de 24 clics sur quatre mesures en 6/8 ; intervalle 0,416667 s et accents 1/4 vérifiés. Transport réel également exercé. |
| C — Enregistrement | Cinq notes enregistrées avec les touches PC ; hauteurs, instants et durées inspectés. Accord de trois notes enregistré dans Alto. Tests du recorder et des notes tenues. |
| D/E — Do mobile | C D E F G et Db Eb F Gb Ab donnent d r m f s. Toutes les altérations et octaves testées. |
| F — 6/8 | Six positions de croches, durée de mesure et regroupement vérifiés automatiquement. Cet essai utilise des événements contrôlés, sans prétendre être une performance tactile physique. |
| G — Quantification | Décalages volontaires, force partielle, applications répétées et restauration des originaux vérifiés. Commandes également utilisées dans l’interface. |
| H — SATB | Quatre lignes distinctes dans la démonstration ; lecture simultanée des quatre pistes avec AudioContext réel. |
| I — Mute/Solo | États testés dans l’interface et règles combinées vérifiées automatiquement. |
| J — Piano Roll | Déplacement et redimensionnement avec le pointeur réel ; hauteur, copie, suppression, Undo/Redo vérifiés dans l’interface et le store. |
| K — Sauvegarde | Onglet fermé puis rouvert : cinq notes Soprano et trois Alto intactes. Nouvelle connexion IndexedDB et restitution intégrale également testées. |
| L — Offline | Service worker compilé exécuté en environnement de test : navigation à froid et tous les fichiers disponibles avec réseau simulé indisponible. Installation et relance physique hors ligne à valider. |
| M — Android | Interface réelle testée dans des cadres 390×844 et 740×390 : transport, clavier, défilement et absence de débordement horizontal. Note enregistrée avec le pointeur dans la disposition mobile. Multitouch physique à valider. |

Les sept vérifications navigateur couvrent la synthèse et l’extinction des notes, le métronome, la lecture SATB, les boucles avec changement de tempo et pause/reprise, IndexedDB réel, le protocole MIDI simulé et les dispositions mobiles. Le banc de test est disponible en développement à `/tests/browser.html` ; il n’est pas inclus dans la version de production.

## Problèmes corrigés et limites connues

- Création de projet sous HTTP : repli sécurisé lorsque `crypto.randomUUID` n’est pas exposé.
- Démarrage audio : suppression d’un recul de la tête de lecture et d’un septième clic fictif au décompte 6/8.
- Boucles : reprise des notes tenues au bon emplacement après changement de tempo ; arrêt des notes à la limite de boucle.
- Partition dense : élargissement des mesures et points d’alignement communs pour éviter les collisions.
- Petits écrans : clavier maintenu visible en portrait et composition adaptée au paysage.

Aucune anomalie bloquante observée dans les parcours testés. L’installation PWA réelle, la suspension/reprise Android, la latence matérielle et le MIDI physique ne sont pas encore validés. Les données restent propres à l’appareil, au navigateur et à l’origine du site ; aucune synchronisation ou export de sauvegarde n’est fourni en V0.1.

## Décisions techniques

React, TypeScript et Vite ; données musicales en beats de noire ; timing brut séparé de la quantification. Web Audio planifie les événements à l’avance : l’intervalle JavaScript alimente le scheduler et ne détermine pas seul le timing sonore. En 6/8, la mesure vaut trois beats et contient six croches ; le BPM est exprimé à la noire.

IndexedDB contient projets et préférences. Le service worker précache l’éditeur et ses ressources locales. Aucune dépendance à un compte utilisateur, une base cloud ou un service de sons.

## Reporté à V0.2

APK Android/Capacitor et essais matériels ; loop recording ; export/import des projets et PDF ; alignement fin des paroles ; gravure Solfa avancée, swing/triolets et quantification plus élaborée ; sons de piano améliorés. Toute synchronisation cloud nécessitera une décision distincte.

## Lancement et premier essai

Node.js 22.18 ou supérieur, npm et Chrome/Edge récents :

```sh
npm ci
npm run dev
```

Pour la production et les tests :

```sh
npm run build
npm test
npm run preview
```

Créer IRAKA avec Do=Db, 6/8 et 72 BPM. Choisir Soprano, cliquer REC, attendre le décompte et jouer. Stop termine la prise. Quantifier ou éditer les notes, puis enregistrer Alto pendant la lecture des autres voix. Les touches A W S E D F T G Y H U J K O L P ; jouent le piano ; Z/X changent l’octave et Espace contrôle le transport.

Sur Android, ouvrir une première fois l’adresse HTTPS fournie à la livraison, attendre « Disponible hors ligne », puis installer depuis Chrome. La version compilée active le service worker ; le mode développement ne l’active pas.
