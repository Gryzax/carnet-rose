# Carnet Rose

Application Expo hors ligne pour le suivi d'élèves : classes, ticks, croix, mérites, retenues, historique et archivage trimestriel.

## Prérequis

- Node.js LTS
- npm
- Expo Go pour le développement local

## Installation

```bash
npm install
```

## Lancement en développement

```bash
npx expo start
```

Pour vider le cache Metro :

```bash
npm run start:clear
```

L'application utilise `expo-sqlite`, donc les données restent locales à l'appareil.

## Tests

```bash
npm test
```

Objectif de couverture : 80 % minimum.

## Configuration Supabase

L'application utilise Supabase pour la connexion obligatoire Google / Apple. Ne committez jamais `.env`, une cle OAuth, une cle `service_role` ou un secret.

Variables attendues dans `.env` en local et dans GitHub Actions Variables pour la PWA :

```env
EXPO_PUBLIC_SUPABASE_URL=https://frmiyddfipejirtbzoxr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_APP_URL=https://gryzax.github.io/carnet-rose/
```

Utilisez la cle publishable Supabase `sb_publishable_...` pour `EXPO_PUBLIC_SUPABASE_ANON_KEY`. `.env.example` garde uniquement des placeholders non sensibles.

Dans Supabase Authentication -> URL Configuration :

Site URL :

```txt
https://gryzax.github.io/carnet-rose/
```

Redirect URLs :

```txt
https://gryzax.github.io/carnet-rose/
https://gryzax.github.io/carnet-rose/auth/callback
http://localhost:8081
http://localhost:19006
```

Google Cloud Authorized JavaScript origins :

```txt
https://gryzax.github.io
http://localhost:8081
http://localhost:19006
```

Google Cloud Authorized redirect URI :

```txt
https://frmiyddfipejirtbzoxr.supabase.co/auth/v1/callback
```

Le Client ID et le Client Secret Google doivent etre places dans Supabase Dashboard -> Authentication -> Providers -> Google, jamais dans le code.

Apple Sign-In necessite generalement Apple Developer. Configurez Apple Developer puis renseignez Supabase Dashboard -> Authentication -> Providers -> Apple. Callback Supabase :

```txt
https://frmiyddfipejirtbzoxr.supabase.co/auth/v1/callback
```

Voir `docs/supabase-setup.md` pour les etapes completes et `docs/supabase-schema.sql` pour le schema SQL a copier dans Supabase SQL Editor.

## Utiliser l'application sur iPhone sans Expo Go

Cette version utilise une PWA.

Elle ne nécessite pas :

- Expo Go ;
- compte Expo ;
- compte Apple Developer ;
- TestFlight ;
- App Store.

### Étapes côté utilisateur iPhone

1. Ouvrir le lien de la PWA dans Safari.
2. Appuyer sur le bouton Partager.
3. Choisir Ajouter à l'écran d'accueil.
4. Valider avec Ajouter.
5. Ouvrir l'app depuis l'icône sur l'écran d'accueil.

### Important

La première ouverture nécessite Internet.

Ensuite, l'app peut fonctionner hors ligne si les fichiers ont bien été mis en cache.

Les données sont stockées localement sur l'iPhone via IndexedDB.

## Générer une APK Android sans compte Expo

Cette méthode utilise GitHub Actions.

Elle ne nécessite pas :

- Expo Go ;
- compte Expo ;
- EAS cloud ;
- Android Studio installé localement.

### Étapes

1. Aller sur GitHub.
2. Ouvrir l'onglet **Actions**.
3. Sélectionner le workflow **Build Android APK**.
4. Cliquer sur **Run workflow**.
5. Attendre la fin du build.
6. Télécharger l'artefact **carnet-rose-debug-apk**.
7. Extraire le fichier `.zip`.
8. Installer `app-debug.apk` sur un téléphone Android.

### Emplacement de l'APK dans le workflow

```txt
android/app/build/outputs/apk/debug/app-debug.apk
```

### Note

Cette APK est une version debug. Elle suffit pour tester l'application sans Expo Go.

Pour une version production signée, il faudra configurer une signature Android release.

## Générer une APK Android avec EAS cloud

Cette méthode optionnelle permet de créer une vraie application Android installable via EAS cloud.

### Prérequis

- Node.js installé
- Compte Expo
- EAS CLI installé

```bash
npm install -g eas-cli
eas login
```

Le projet installe aussi `eas-cli` en dépendance de développement, donc les scripts npm utilisent la version locale si elle est disponible.

### Configuration EAS

```bash
eas build:configure
```

Le fichier `eas.json` contient deux profils :

- `preview` : génère un fichier `.apk` installable directement sur Android.
- `production` : génère un fichier `.aab` pour une future publication Play Store.

### Générer l'APK Android

```bash
npm run build:android:apk
```

ou directement :

```bash
eas build --platform android --profile preview
```

À la fin du build, Expo fournit un lien de téléchargement vers le fichier `.apk`.

Le fichier `.apk` peut ensuite être partagé via :

- Google Drive
- GitHub Release
- lien Expo
- mail
- clé USB

### Installer l'APK sur Android

1. Télécharger le fichier `.apk` sur le téléphone.
2. Ouvrir le fichier.
3. Autoriser l'installation depuis une source inconnue si Android le demande.
4. Installer l'application.

### Note iPhone

Sur iPhone, il n'est pas possible de partager simplement un fichier installable comme un APK Android. Il faut passer par TestFlight, App Store ou un compte Apple Developer.

## Partager l'APK via GitHub Release

1. Générer l'APK avec :

```bash
npm run build:android:apk
```

2. Télécharger le `.apk` depuis le lien EAS.
3. Aller sur GitHub > Releases.
4. Créer une nouvelle release.
5. Ajouter le fichier `.apk` comme asset.
6. Partager le lien de la release.

## Génération Android production

Pour générer un bundle Android App Bundle destiné au Play Store :

```bash
npm run build:android:production
```

## Structure

```txt
/models        requêtes SQLite et structures de données
/controllers   logique métier
/views         écrans React Native
/components    composants UI réutilisables
/database      connexion, migrations et seed demo
/hooks         hooks de chargement
/navigation    React Navigation Stack + Bottom Tabs
/constants     couleurs, textes et constantes métier
/utils         utilitaires
/__tests__     tests unitaires, database et composants
```

## Architecture MVC

Les vues rendent l'interface et délèguent les actions aux contrôleurs. Les contrôleurs appliquent les règles métier, puis appellent les modèles. Les modèles sont les seuls à accéder à SQLite, via `/database/db.js`.

## Workflow Git recommandé

```bash
git init
git checkout -b main
git checkout -b dev

git checkout -b feature/setup-project
git checkout dev
git merge feature/setup-project

git checkout -b feature/database-sqlite
git checkout dev
git merge feature/database-sqlite

git checkout main
git merge dev
```

Branches prévues :

```txt
main
dev
feature/setup-project
feature/github-setup
feature/database-sqlite
feature/mvc-architecture
feature/business-logic
feature/classes-screen
feature/class-dashboard
feature/student-detail
feature/settings-trimester-reset
feature/statistics-screen
feature-ui-components
feature/dark-mode-responsive
feature/tests
feature/readme
feature/android-apk-build
```

`main` reste stable. `dev` intègre les fonctionnalités terminées. Chaque fonctionnalité importante part de `dev` dans une branche `feature/...`, puis revient dans `dev` après tests.
