# Carnet Rose

Application Expo hors ligne pour le suivi d'élèves : classes, ticks, croix, mérites, retenues, historique et archivage trimestriel.

## Prérequis

- Node.js LTS
- npm
- Expo Go pour le développement local
- Compte Expo et EAS CLI pour générer une APK Android installable

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

## Générer une APK Android sans Expo Go

Cette méthode permet de créer une vraie application Android installable directement sur un téléphone.

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
