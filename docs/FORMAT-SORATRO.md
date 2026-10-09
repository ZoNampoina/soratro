# Format .soratro — version 1

Un fichier `.soratro` est un JSON UTF-8 lisible, sans archive ni ressources externes.

Enveloppe : `format: "SORATRO"`, `formatVersion: 1`, `appVersion`, `exportedAt` (ISO 8601), `checksum: {algorithm: "SHA-256", value}`, `project`.

Le checksum porte sur `JSON.stringify(project)` en UTF-8, avant migration. Il détecte une copie incomplète ou une modification accidentelle ; ce n’est pas une signature d’authenticité. L’import est limité à 32 Mo et vérifie les valeurs, identifiants, liens et versions avant de toucher IndexedDB. Un identifiant déjà présent produit une copie importée, jamais un écrasement silencieux.

`project.schemaVersion: 2` : id, titre, auteur, compositeur, tonalité mobile, signature initiale, tempo interne en noires/minute, dates, pistes flexibles, événements, paroles et liens syllabiques, marqueurs, prises, changements de tempo/signature, reprises, indications, mise en page et préférences musicales. Tous ces champs voyagent dans le fichier ; les préférences de l’appareil restent locales.

Chaque note conserve `originalStart/originalDuration` en beats (une noire = un beat), les éventuelles valeurs quantifiées, les secondes NOTE ON/OFF, la vélocité et le tempo d’origine. `rawStartBeat/rawDurationBeats/compensationMs` permettent le diagnostic de latence sans réécrire les données brutes. Les prises conservent leurs propres événements.

Les projets V0.1 `schemaVersion: 1` sont migrés en mémoire vers le schéma 2 par ajout de valeurs par défaut. La musique et les secondes enregistrées ne sont pas réinterprétées. Un JSON V0.1 brut est également importable. Les versions futures sont refusées avec un message explicite.

IndexedDB passe de version 1 à 2 en conservant projects/preferences et en ajoutant versions, indexé par projectId. Un état courant et son éventuel checkpoint sont écrits dans une transaction atomique. Cadence automatique : cinq minutes si le contenu a changé ; rétention récente, horaire, puis quotidienne, 30 jours et 48 versions maximum. L’historique local n’alourdit pas le fichier portable.

Depuis la V0.3, une piste peut porter `locked: true` et sa couleur personnalisée. `locked` est un booléen optionnel du schéma 2 : l’absence du champ signifie déverrouillée, ce qui conserve les anciens projets sans réécriture des événements. La validation refuse une valeur de verrouillage d’un autre type. Les états des panneaux, zooms, cadrages, défilements, sélection et mode de travail résident dans preferences, séparément du JSON musical et de son historique. Ils ne voyagent pas dans le fichier `.soratro`.
