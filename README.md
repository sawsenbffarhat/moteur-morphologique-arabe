# 🧠 Moteur Morphologique Arabe (Vocalized)

Ce projet est un **moteur morphologique haute performance** pour la
langue arabe, utilisant des **arbres binaires de recherche (BST)** et un
**cache O(1)** basé sur un index inversé.

------------------------------------------------------------------------

## 🚀 Lancer la version Web (Preview)

### 1️⃣ Installer Node.js

Téléchargez-le sur : https://nodejs.org/

### 2️⃣ Ouvrir un terminal

Sur Windows, utilisez **CMD** pour éviter les erreurs de permissions.

### 3️⃣ Installer les dépendances

``` bash
npm install
```

### 4️⃣ Lancer le serveur

``` bash
npm run dev
```

### 5️⃣ Ouvrir le navigateur

Accédez à :\
http://localhost:5173

------------------------------------------------------------------------

## 🐍 Version Python (Terminal)

Pour exécuter la version CLI :

``` bash
python main.py
```

------------------------------------------------------------------------

## 🛠 Résolution des problèmes (Windows)

### ❌ Erreur : "Execution of scripts is disabled" (PowerShell)

1.  Ouvrez **PowerShell en tant qu'Administrateur**
2.  Exécutez la commande suivante :

``` powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3.  Validez avec `Y` (Yes)

------------------------------------------------------------------------

## 📂 Structure du projet

    logic/         → Moteur de calcul en TypeScript (BST + cache O(1))
    python/        → Moteur de calcul en Python (version CLI)
    src/App.tsx    → Interface utilisateur interactive (React)
