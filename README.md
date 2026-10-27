# Codamon

Application web développée avec **Angular, Tailwind CSS et Supabase**.
Collectionnez des cartes dans le thème de l'école **CODA_** et échangez-les!

## Contribution au projet

Ce projet est ouvert à la collaboration et a pour objectif de permettre aux élèves de **CODA_** de s'exercer au travail sur un projet **Open Source**.

N'hésitez pas à :

- Identifier et signaler des bugs ;
- Proposer de nouvelles fonctionnalités ;
- Ouvrir des *issues* pour discuter d'améliorations ;
- Soumettre des *Pull Requests* pour contribuer au projet.

Toutes les contributions sont les bienvenues et constituent une excellente occasion de découvrir les bonnes pratiques du développement collaboratif.

## Prérequis

Installer les outils suivants :

- **Git** : https://git-scm.com/
- **Node.js** : https://nodejs.org/
- **npm** : installé automatiquement avec Node.js.
- **Angular CLI** : interface en ligne de commande d'Angular.
- Un éditeur de code, idéalement Visual Studio Code : https://code.visualstudio.com/

Vérifier l'installation dans un terminal :

```bash
git --version
node --version
npm --version
```

Utiliser une version de Node.js compatible avec la version d'Angular du projet.

## 1. Installer Angular CLI

Angular CLI permet de générer des composants, des services, des interfaces, des guards et d'autres éléments du projet.

### macOS

Ouvrir le Terminal et exécuter :

```bash
npm install -g @angular/cli
```

### Windows

Ouvrir PowerShell ou le terminal de Visual Studio Code et exécuter :

```powershell
npm install -g @angular/cli
```

Si PowerShell bloque l'exécution de `ng.ps1`, consulter la documentation officielle Angular sur les problèmes d'installation Windows avant de modifier la stratégie d'exécution.

### Vérifier l'installation

```bash
ng version
```

**Important :** la CLI globale permet d'utiliser `ng` depuis le terminal. Le projet possède également sa propre version locale d'Angular CLI dans ses dépendances. Après l'installation des dépendances du projet, privilégier cette version locale pour éviter les différences entre développeurs.

## 2. Cloner le dépôt GitHub

```bash
git clone https://github.com/nathanael-lcr/Codamon.git
cd Codamon
```

Installer les dépendances :

```bash
npm install
```

Cette commande installe les packages définis dans `package.json`.

Ne pas ajouter manuellement des dépendances déjà présentes dans le projet.

## 3. Configurer Supabase

Codamon utilise Supabase pour les fonctionnalités liées à la base de données et à l'authentification.

### Accéder au projet

Le propriétaire du projet doit inviter le collaborateur dans l'organisation Supabase et lui attribuer les permissions nécessaires.

Le collaborateur pourra ensuite accéder au projet depuis son propre compte Supabase.

### Configuration locale

Récupérer l'URL du projet Supabase et sa clé publique depuis le tableau de bord Supabase.

Renseigner ces valeurs dans le fichier d'environnement attendu par l'application.

Exemple de configuration :

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'URL_DU_PROJET',
  supabaseKey: 'CLE_PUBLIQUE'
};
```

Cet exemple est indicatif : conserver les noms de propriétés et la structure réellement utilisés par Codamon.

Vérifier les fichiers d'environnement existants dans `src/environments/` et le remplacement configuré dans `angular.json`.

**Sécurité :**
- Ne jamais commiter de secrets ou de clés privées.
- Ne jamais exposer une clé `service_role` ou `sb_secret_...` dans Angular.
- La clé publique peut être utilisée côté client si les permissions et politiques RLS sont correctement configurées.
- Ne pas commiter les fichiers de configuration locaux contenant des informations qui doivent rester privées.

Si le projet utilise des fichiers locaux ignorés par Git, transmettre les instructions pour les créer sans partager de secrets dans le dépôt.

## 4. Lancer l'application

Depuis la racine du projet :

```bash
ng serve
```

Ouvrir l'adresse indiquée dans le terminal, généralement :

http://localhost:4200

L'application se recharge automatiquement lors des modifications du code.

## 5. Utiliser Angular CLI

Exécuter les commandes depuis la racine du projet.

### Générer un composant

```bash
ng generate component components/nom-du-composant
```

Version courte :

```bash
ng g c components/nom-du-composant
```

### Générer un service

```bash
ng generate service services/nom-du-service
```

### Générer une interface TypeScript

```bash
ng generate interface models/nom-du-modele
```

### Générer un pipe

```bash
ng generate pipe pipes/nom-du-pipe
```

Utiliser `ng` pour invoquer la CLI locale du projet plutôt que de dépendre de la version globale installée.

## 6. Tailwind CSS

Tailwind CSS est déjà intégré au projet.

Utiliser les classes utilitaires dans les templates Angular :

```html
<div class="rounded-xl bg-white p-4 shadow">
  <h2 class="text-xl font-bold">Mon composant</h2>
</div>
```

Ne pas réinstaller ni reconfigurer Tailwind sans nécessité. Respecter la configuration existante du projet.

## 7. Collaborer avec Git et GitHub

Ne pas développer directement sur `main`. Créer une branche par fonctionnalité ou correction.

### Créer une branche

```bash
git switch main
git pull
git switch -c feat/nom-de-la-fonctionnalite
```

### Enregistrer les modifications

```bash
git add .
git commit -m "feat: description de la fonctionnalité"
git push -u origin feat/nom-de-la-fonctionnalite
```

Créer ensuite une Pull Request sur GitHub pour faire relire les changements avant leur fusion dans `main` ou `preprod`.

### Pour les contributeurs externes

Si vous n'êtes pas collaborateur du dépôt, vous ne pourrez pas pousser directement de branche vers le dépôt principal.

Vous pouvez néanmoins contribuer en :

1. Identifiant un bug ou une amélioration potentielle ;
2. Ouvrant une Issue sur GitHub pour la décrire ;
3. Forkant le dépôt si vous souhaitez proposer une correction ou une nouvelle fonctionnalité ;
4. Soumettant une Pull Request depuis votre fork.

Les *Issues* permettent de discuter des évolutions du projet, d'éviter le travail en double et de coordonner les contributions.

### Conventions de commit

- `feat:` ajout d'une fonctionnalité.
- `fix:` correction d'un bug.
- `refactor:` restructuration du code.
- `style:` modifications de présentation.
- `docs:` documentation.
- `chore:` maintenance.

### Bonnes pratiques

- Toujours synchroniser `main` avant de commencer une nouvelle tâche.
- Ne pas commiter `node_modules/`.
- Ne pas commiter les clés secrètes ni les fichiers locaux privés.
- Ne pas écraser les modifications d'un autre développeur.
- Résoudre les conflits Git avant de fusionner une branche.
- Vérifier que l'application fonctionne avant d'ouvrir une Pull Request.

### Problème de dépendances

Vérifier la version de Node.js et le fichier `package-lock.json`.

Pour réinstaller exactement les dépendances verrouillées par le dépôt :

```bash
npm ci
```

Cette commande remplace le dossier `node_modules` et nécessite un fichier `package-lock.json` cohérent avec `package.json`.

### Supabase ne fonctionne pas

Vérifier :
- L'URL et la clé publique.
- Le fichier d'environnement utilisé en développement.
- Les permissions d'accès au projet.
- Les politiques RLS.
- Les erreurs dans la console du navigateur.

## Documentation officielle

- Angular : https://angular.dev/
- Angular CLI : https://angular.dev/tools/cli
- Tailwind CSS : https://tailwindcss.com/docs
- Supabase : https://supabase.com/docs
- Git : https://git-scm.com/doc

