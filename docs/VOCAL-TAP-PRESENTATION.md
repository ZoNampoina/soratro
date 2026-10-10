# Personnaliser, battre le tempo et composer avec la voix

Dans Partition → Mise en page, le dialogue prépare les modifications avant application. Annuler l’aperçu les abandonne ; Appliquer les regroupe dans une entrée Undo.

## Crédits et mise en page

En-tête propose Français, Malagasy, Abrégé et Personnalisé. Les rôles auteur, compositeur, arrangeur, harmonisateur et adaptateur ont des libellés distincts. Ajouter un contributeur conserve les personnes présentes. Chaque nom possède un rôle, un ordre, une visibilité et, si nécessaire, un libellé individuel. Le regroupement réunit les noms qui partagent le même libellé. Un changement de langue conserve les libellés saisis explicitement ; Réinitialiser les libellés permet de revenir au préréglage. La langue par défaut des nouveaux projets se choisit dans les paramètres.

Systèmes accepte Auto ou 1 à 12 mesures par ligne, avec exceptions locales. Une ligne trop dense passe à la suivante et le vérificateur explique l’écart ; aucune note n’est supprimée pour tenir dans quatre mesures. La justification Pleine, Naturelle, Centrée ou Auto agit sur la largeur de ligne, globalement ou localement. La grille rythmique régulière/adaptative reste commune aux voix.

La numérotation peut afficher chaque mesure, le début de système, le début de page ou aucun numéro. Taille, position, espacement, couleur, départ, préfixe de recueil et traitement de la levée sont réglables. Les nouveaux projets commencent avec quatre mesures par système et un numéro au début de chaque système. Les projets antérieurs sans ces paramètres gardent leur présentation historique.

Les profils Épuré, Répétition chorale, Recueil et Impression professionnelle ne modifient pas la musique. Les styles personnels peuvent être enregistrés, renommés, dupliqués, supprimés ou rétablis. En mode Mise en page, cliquer l’en-tête, le pied, un numéro, un système ou un symbole ouvre les réglages correspondants. Le mode Lecture conserve sa navigation musicale.

## Symboles

La bibliothèque présente les mêmes tracés vectoriels que la gravure, une recherche, des catégories, favoris et récents, un aperçu agrandi et la description de l’effet audio. Épingler un symbole le conserve en favoris. Placer dans la partition ferme le dialogue : cliquer ou toucher une position insère le symbole. Échap annule le placement. Le déplacement s’effectue par glissement ; cliquer le symbole permet aussi de saisir exactement sa mesure et sa position, puis de le supprimer. Undo restaure les opérations. Les liaisons demandent une sélection de notes.

Les renvois et reprises, ainsi que les changements chiffrés de tempo, agissent sur la lecture. Nuances, accents, points d’orgue et soufflets restent des indications de partition, signalées dans leur description.

## Tap Tempo

TAP ou la touche B recueille au moins trois frappes, sur une horloge monotone. La médiane limite l’effet des frappes irrégulières et une pause réinitialise la série. Une estimation stabilisée demande davantage de frappes régulières. Les limites sont réglables entre 20 et 300 BPM.

Choisir la noire, la noire pointée ou la croche détermine l’unité frappée. Par exemple, 120 frappes de noire pointée correspondent à 180 BPM internes à la noire. L’application peut viser le tempo du projet ou un changement à la mesure courante. Pendant REC, elle est mise en attente jusqu’à Stop : la prise ne change pas de tempo en cours d’enregistrement. L’option de pulsation fait battre le métronome à l’unité choisie.

## Vocal

Choisir Source → Vocal, puis REC, autorise le microphone et le décompte habituel. Activer le micro permet une vérification sans écrire de notes. Chantonner et Chanter capturent la mélodie ; les paroles se saisissent dans leur éditeur. Utiliser un casque pour écouter les autres voix évite leur reprise acoustique par le microphone.

La chaîne utilise le même AudioContext que le transport et les clics. Un AudioWorklet capture des fenêtres de 85,3 ms à 24 kHz avec leurs timestamps audio ; un worker local utilise McLeod/FFT via `pitchy 4.1.0`. Les attaques stables, notes tenues, silences, variations de hauteur et réattaques deviennent des événements du Recorder commun. La segmentation conserve les chromatismes. Les notes provisoires apparaissent dans les vues, sans les enregistrer comme notes définitives.

Réglages avancés montre forme d’onde et courbe de hauteur, microphone, gain, seuil de bruit, clarté, stabilité, durée minimum, séparation par silence, tessiture, compensation et traitements du navigateur. Brut désactive le lissage ; Stabilisé limite les fluctuations ; Assisté propose des corrections proches du Do choisi, à confirmer manuellement. Les notes incertaines sont repérées et leur hauteur peut être corrigée dans l’inspecteur. La précision dépend du chant, du bruit, du microphone et de l’écho ; une source monophonique reste nécessaire.

Les timestamps bruts, beats bruts, compensation, positions originales corrigées et positions quantifiées restent distincts. La compensation négative avance la note. Les changements de tempo et les limites de Punch/boucle sont évalués sur la même timeline. La quantification utilise les grilles existantes et ne change pas la hauteur. La calibration par clics estime aussi la réaction humaine ; elle ne mesure pas isolément le retard du micro.

Chaque REC crée une prise. Une boucle conserve un passage par prise ; Punch délimite la zone. Stop conserve la prise partielle. Choisir une prise active sa couche ; Annuler la prise retire cette couche et restaure la zone précédente en Replace. REC Replace et le choix d’une prise Replace demandent confirmation. Les autres voix restent audibles selon Mute, Solo et Volume, et les verrous protègent leurs notes.

Stop, changement de source, changement de mode, sortie du projet et arrière-plan ferment les pistes micro, le worker et les nœuds de capture. La durée maximale s’applique à la prise après le décompte. Les refus d’autorisation, le micro absent/occupé ou déconnecté sont signalés sans démarrer une prise invalide.

## Audio original et sauvegarde

Conserver l’audio original est facultatif. MediaRecorder stocke le flux original dans une base locale distincte des projets et du cache PWA. Les prises affichent leur durée/taille et permettent l’écoute Original ou Notes. Gérer les audios locaux permet une suppression explicite, y compris après suppression d’une prise ; supprimer l’audio conserve la partition et est définitif. Les copies de projet peuvent partager une référence audio.

Le fichier `.soratro` reste un JSON compatible, avec la composition et les références audio. Audio portable exporte/importe un `.soratro-audio` contenant projet, manifeste et blobs, contrôlés par SHA-256 ; l’import remappe les identifiants audio et crée une copie. L’archive est limitée à 112 Mo et chaque blob à 80 Mo. Les erreurs de capacité sont signalées, sans effacer les notes. La capacité indiquée par le navigateur est une estimation.

Après le premier chargement complet, les ressources de capture et le worker sont mis en cache : la composition et la transcription locale restent utilisables hors ligne. Une mise à jour du cache ne supprime ni projets ni audios. L’effacement volontaire des données du navigateur ou la désinstallation reste une opération distincte : conserver une sauvegarde portable.

Sur Android, Capacitor demande RECORD_AUDIO à l’activation. Le microphone est facultatif pour installer l’app. L’APK fournie reste un build debug de test ; sa compilation et son lint ne qualifient pas encore les microphones physiques, Bluetooth, casques ou retards matériels. Les signatures de test des anciennes APK peuvent demander une sauvegarde avant réinstallation ; une distribution suivie nécessite une signature durable.
