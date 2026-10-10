# Préparer une partition dans SORATRO Web 0.6

## Mesures et typographie

Dans **Partition → Mise en page**, « Mesures par ligne » est le réglage global unique. La valeur par défaut est 4. Saisir 0 active **Automatique** ; les propositions 1 à 12 permettent un choix rapide ou une saisie directe. Le champ technique `measuresPerSystem` est conservé dans les anciens projets.

| Alignement des mesures | Comportement |
| --- | --- |
| Grille alignée, par défaut | Colonnes communes aux lignes de même grille. Sept mesures à quatre par ligne donnent quatre mesures, puis trois et un emplacement blanc. Aucune mesure 8 n’est ajoutée. |
| Justification indépendante | Chaque ligne calcule ses propres largeurs. La justification de ligne peut être pleine, naturelle, centrée ou automatique. |
| Adaptative | Les espaces suivent la densité des notes et des paroles. Les colonnes et les distances rythmiques peuvent différer entre lignes. |

Un nombre local plus petit respecte la grille globale autant que possible. Un nombre local plus grand utilise une grille distincte. Les sauts volontaires restent enregistrés dans le projet et ne deviennent pas des mesures fictives.

La **Taille Solfa** est exprimée en pixels du document : 96 px = 1 pouce, donc 20 px = 15 points dans le PDF. Les octaves conservent une proportion de 70 % et les signes rythmiques leurs proportions propres. La densité ne réduit pas la police. Le moteur réduit d’abord les espaces superflus ; si la largeur minimale reste trop grande, il conserve les notes et affiche un avertissement.

Les boutons de l’avertissement proposent paysage, marges plus petites, moins de mesures ou mode adaptatif. La taille Solfa peut être réduite manuellement. L’application et l’export d’une mise en page trop dense restent bloqués jusqu’à correction, afin d’éviter un fichier coupé.

## Mise en page

Les sections sont **Document**, **Mesures et systèmes**, **Typographie**, **En-tête**, **Pied de page** et **Styles**. Les crédits et langues restent dans En-tête. Les symboles musicaux s’éditent dans leur bibliothèque dédiée.

Les étoiles déplacent les contrôles fréquemment utilisés dans une section **Favoris** repliable. Un contrôle épinglé n’est pas présenté une deuxième fois dans son onglet. Les favoris sont conservés sur l’appareil. Les espacements avancés, la présentation des numéros et les exceptions locales se déplient à la demande.

Dans les exceptions, choisir une mesure identifie la ligne concernée. **Réinitialiser cette ligne** supprime ses largeurs, nombres, sauts, justification et espacement locaux ; les autres exceptions et la musique restent conservées. **Appliquer** enregistre le brouillon en une seule opération, réversible avec **Annuler / Rétablir**. Fermer l’aperçu abandonne les changements de présentation.

Sur ordinateur, les réglages restent à gauche et l’aperçu à droite. Sur téléphone, l’éditeur occupe l’écran. **Paramètres** ouvre une vue de réglages ; **Retour à l’aperçu** la ferme. **Appliquer** reste dans l’en-tête. Les boutons s’adaptent à la hauteur disponible lorsque le clavier virtuel réduit le viewport.

## Zoom et espace musical

Le champ de pourcentage, les cadrages, le pincement à deux doigts et le double-tap modifient uniquement le zoom d’écran. Le double-tap ajuste à la largeur. Un doigt fait défiler la partition ; un déplacement ou un pincement ne doit pas éditer une note. Les pages, le défilement et les préférences restent séparés de la musique et des dimensions du PDF.

En Composition, la liste des pistes, le ruban et le clavier peuvent être rabattus avec les commandes existantes. Les barres secondaires défilent horizontalement. Le mode paysage réduit leur hauteur. Le Piano Roll conserve son zoom, sa sélection et ses défilements lors des changements de mode. La source Vocal conserve Chantonner/Chanter, le micro, les prises et les options audio repliables.

## Export et mise à jour

PDF, SVG, PNG et impression partagent le même document vectoriel. Le PDF contient toutes les pages de la portée choisie ; SVG et PNG utilisent la page affichée. Les polices sont locales et incorporées. **Partager** utilise Web Share lorsque le navigateur accepte les fichiers, sinon télécharge le fichier. L’annulation du partage conserve le brouillon sans le signaler comme un export réussi.

Pour la mise à jour PWA, utiliser **Sauvegarder & mettre à jour** lorsqu’une nouvelle version est prête. La sauvegarde termine avant l’activation. Le cache précédent reste disponible pour les onglets encore ouverts sur l’ancienne version. Ne pas effacer les données du navigateur.

## Vérification reproductible

```sh
npm ci
npm run build:pages
npm test
npx playwright install chromium
npm run test:browser
```

Le contrôle complémentaire de mise à jour emploie deux compilations réelles servies sous la même origine, active le bouton de mise à jour, compare les projets IndexedDB et redémarre hors ligne :

```sh
node scripts/verify-pwa-update.mjs ancien-dist dist tmp/pwa-update
```

Les dimensions mobiles sont simulées dans Chromium. La qualification physique du clavier Android, du partage natif, du micro, du MIDI USB et de l’installation PWA sur téléphone reste à effectuer sur un appareil réel.
