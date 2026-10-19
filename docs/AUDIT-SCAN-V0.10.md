# Audit initial — atelier de numérisation Solfa

État examiné le 19 octobre 2026 : `origin/main` e791d78, SORATRO 0.9.1. Branche dédiée : `work/score-scanning-v0.10`.

## Réutilisation et protection

- App / ProjectFiles : points d’entrée depuis l’accueil et l’import, sans quatrième onglet. Un atelier modal chargé à la demande laisse les éditeurs montés et suspend le transport.
- Modèle musical : `createProject`, `makeNote`, `choirTracks`, `convertSolfa`, `signatureInfo`, `measureAt`, validation et fichiers `.soratro` existants. Aucun nouveau schéma de partition.
- Gravure : SolfaScore et moteur SVG/PDF existants. Aucune seconde gravure.
- Import de mesures : `copyMeasures` / `pasteBlock` préservent les déplacements de notes, paroles, structures et signatures. Import transactionnel par `store.update`, une entrée Undo ; refus des voix verrouillées et aperçu préalable.
- Stockage : `soratro` IndexedDB v2, historique et `soratro-audio` inchangés. Base indépendante `soratro-scans` pour les sources, pages, brouillons, corrections et profils. Pas de suppression ou migration de projets existants.
- Export et partage : `encodeProject` et `saveFile` existants. Les sources d’image ne sont pas ajoutées aux projets musicaux.
- PWA : assets PDF locaux, import différé ; cache de l’application existant conservé. Aucun service de reconnaissance distant ni clé API.

## Conventions réellement prises en charge

Le convertisseur utilise d, di, r, ri, m, f, fi, s, si, l, ta, t ; l’octave est relative à `60 + index chromatique de la tonalité`. Il ne faut donc pas appliquer des registres SATB arbitraires. Les temps sont en noires ; en 6/8 le regroupement peut être 3+3. Points, virgules de subdivision, virgules d’octave et apostrophes doivent être distingués par leur géométrie et par validation. La saisie de correction emploie `_1` pour une octave basse, afin de ne pas confondre la virgule rythmique avec l’octave.

## Choix technique initial

PDF.js 6.4.299 (Apache-2.0) pour rasteriser les PDF localement, dans un worker, avec originaux conservés. Les fontes standard et ressources nécessaires sont livrées localement.

Solutions évaluées :

- Tesseract / Tesseract.js (Apache-2.0) : texte imprimé généraliste ; documentation explicite sur l’absence de prise en charge réelle des manuscrits. Essai CLI 5.3.4 / eng, premier système FITIAVANA agrandi, whitelist Solfa : lettres partiellement reconnues, ponctuations et octaves non fiables. Cet essai ne constitue pas une mesure de précision de Tesseract.js 7 ; il suffit à exclure une conversion musicale fondée sur un OCR textuel brut.
- OpenCV.js : utile pour le prétraitement, mais n’apporte pas de modèle Solfa. Les opérations nécessaires peuvent rester en TypeScript dans un worker sans ajouter un second gros runtime.
- Modèles OMR classiques : centrés sur les portées, ne fournissent pas directement les conventions Solfa de cette application. Aucun modèle spécialisé validé sur les documents de l’utilisateur disponible.
- Reconnaissance distante : non activée. Elle nécessiterait un serveur et un consentement distinct avant tout envoi.

Première implémentation : segmentation locale, comparaison de glyphes imprimés avec des formes de référence, ponctuation interprétée par position, grammaire rythmique et validation humaine. Les distances de formes ne sont pas des probabilités de réussite. Les exemples corrigés peuvent enrichir un profil local ; ce mécanisme de comparaison n’est pas un entraînement de réseau neuronal.

Références primaires :
- https://github.com/naptha/tesseract.js/blob/master/docs/faq.md
- https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html
- https://mozilla.github.io/pdf.js/examples/

## Document privé de référence

L’image FITIAVANA a été retrouvée et examinée : photo d’une page imprimée, fond et lumière irréguliers, quatre voix, signes petits et serrés, couplets et renvois. Le B♭ est visible ; la signature n’est pas suffisamment explicite pour fabriquer une référence complète. Les essais réels restent locaux ; l’image personnelle n’est pas publiée dans le dépôt. Seuls des jeux synthétiques et les résultats de tests seront versionnés.
