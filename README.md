# Carnet Rose

Application Expo hors ligne pour le suivi d'élèves : classes, ticks, croix, mérites, retenues, historique et archivage trimestriel.

## Prérequis

- Node.js LTS
- npm
- Expo Go sur Android ou iOS

## Installation

```bash
npm install
```

## Lancement avec Expo Go

```bash
npx expo start
```

Scannez le QR code avec Expo Go. L'application utilise `expo-sqlite`, donc les données restent locales à l'appareil.

## Tests

```bash
npx jest --coverage
```

Objectif de couverture : 80 % minimum.

## Génération APK Android

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
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
```

`main` reste stable. `dev` intègre les fonctionnalités terminées. Chaque fonctionnalité importante part de `dev` dans une branche `feature/...`, puis revient dans `dev` après tests.
