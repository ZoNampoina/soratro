# SORATRO 0.2.0

Évolution du dépôt existant : sauvegarde portable `.soratro`, historique et migration V0.1, Punch/prises/calibration, édition de mesures, paroles liées aux notes, mise en page et PDF vectoriel, mode Répétition et MIDI amélioré.

Site : https://zonampoina.github.io/soratro/

Le rapport détaillé, le format portable et les limites sont dans `docs/RAPPORT-V0.2.md`, `docs/FORMAT-SORATRO.md` et `docs/ANDROID.md` du commit associé à cette release. GitHub Pages est publié après TypeScript, tests du moteur/interface et parcours Chromium ; l’APK est joint uniquement après compilation Android et lint réussis pour ce même commit.

## APK Android de test

`SORATRO-0.2.0-debug.apk` est installable sur Android 7/API 24 ou ultérieur. Il embarque les ressources musicales et graphiques pour fonctionner sans réseau. Le fichier `SHA256SUMS.txt` permet de contrôler le téléchargement.

Ce build utilise une signature debug, sans qualification sur téléphone physique ni clavier USB OTG. Il ne constitue pas une release Play Store. Une signature Android durable reste à configurer hors du dépôt. Exportez vos compositions `.soratro` avant réinstallation ou changement de signature.

## Première mise à jour PWA

Pour passer de V0.1 à V0.2, fermez tous les onglets SORATRO et la PWA, puis rouvrez le site. Ne supprimez pas les données du navigateur. Les prochaines mises à jour proposent « Sauvegarder & mettre à jour ».
