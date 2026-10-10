# Android SORATRO

Capacitor 8, appId `mg.soratro.app`, nom SORATRO, version 0.5.0 / versionCode 5. Android API 24 minimum, compilation/target API 36, Java 21, Gradle Wrapper fourni. Orientation libre, dispositions portrait/paysage et icône issue de l’identité existante. Les ressources Web, la police et les sons sont incorporés, sans serveur musical.

```sh
npm ci
npm run build
npm test
npx cap sync android
cd android
./gradlew assembleDebug lintDebug
```

Le SDK Android et Java 21 sont requis. `android.yml` compile sur GitHub Actions et conserve l’APK et le rapport lint comme artifacts pendant 30 jours. `assets/public` est généré. Ne pas utiliser `build:pages` avant `cap sync` : l’APK utilise la racine locale.

`SoratroFiles` et `SoratroMidi` sont enregistrés dans MainActivity. Fichiers : Storage Access Framework, import UTF-8 limité à 32 Mo, ACTION_CREATE_DOCUMENT / ACTION_OPEN_DOCUMENT, réception du MIME `application/x-soratro`, impression du PDF vectoriel. Le partage utilise un fichier temporaire du cache et le FileProvider Capacitor. Aucune permission d’accès à tous les fichiers n’est demandée.

Les ports MIDI de sortie des périphériques Android deviennent des entrées SORATRO. Les octets passent par le même décodeur que Web MIDI : NOTE ON/OFF, vélocité, CC64, déconnexion/reconnexion et PANIC. Le MIDI Bluetooth n’est pas configuré.

L’arrière-plan arrête transport/notes, relâche les touches et termine l’autosave. Les événements MIDI natifs sont ignorés pendant la pause. La lecture reprend par un geste utilisateur. Retour Android ferme d’abord un dialogue, revient aux projets, puis minimise l’app.

L’APK `debug` est un build d’essai, signé par la clé de test du runner. Ce n’est pas une release Android de production. Une signature durable, conservée hors Git, devra être configurée avant distribution suivie. Exporter les compositions avant un changement de signature ou une réinstallation.

Essais encore matériels : portrait/paysage, gestes simultanés, PWA installée, avion sans réseau, export/ouverture/partage Android, USB OTG et pédale CC64, déconnexion/reconnexion, verrouillage plusieurs minutes, AudioContext après veille et stabilité de calibration. Une compilation ne qualifie pas ces essais.

Le manifeste déclare RECORD_AUDIO et MODIFY_AUDIO_SETTINGS, avec un microphone facultatif. Le gestionnaire WebView de Capacitor demande la permission à l’activation de Vocal. L’analyse AudioWorklet/McLeod s’exécute localement ; Stop, changement de source et arrière-plan libèrent le micro. Le stockage audio est distinct du cache des ressources Web. Voir [le guide Vocal](VOCAL-TAP-PRESENTATION.md).
