
# Moteur Morphologique Arabe (Vocalized)

Ce projet est un moteur morphologique pour la langue arabe, utilisant des arbres binaires de recherche (BST) et des tables de hachage.

## 🚀 Comment lancer la version Web (Preview)

1. **Installer Node.js** : Téléchargez-le sur [nodejs.org](https://nodejs.org/).
2. **Ouvrir un terminal** (Utilisez **CMD** de préférence sur Windows pour éviter les erreurs de droits).
3. **Installer les dépendances** :
   ```bash
   npm install
   ```
4. **Lancer le serveur** :
   ```bash
   npm run dev
   ```
5. **Ouvrir le navigateur** : Allez sur `http://localhost:5173`.

---

## 🛠 Résolution des problèmes (Windows)

### Erreur "Execution of scripts is disabled" (npm.ps1)
Si vous voyez cette erreur dans PowerShell :
1. Ouvrez PowerShell en **Administrateur**.
2. Exécutez : `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Validez avec `Y`.

### Utilisation de Python (Terminal seulement)
Si vous voulez juste utiliser la version terminal noire :
```bash
python main.py
```

## 📂 Structure du projet
- `logic/` : Moteur de calcul en TypeScript (pour le web).
- `*.py` : Moteur de calcul en Python (utilisé par Pyodide dans le web ou en CLI).
- `App.tsx` : Interface utilisateur interactive.
    