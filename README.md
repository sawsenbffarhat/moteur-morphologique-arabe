# 🧠 Moteur Morphologique Arabe (Vocalized)

Ce projet est un **moteur morphologique haute performance** pour la langue arabe, utilisant des **arbres binaires de recherche (BST)** et un **cache O(1)** par index inversé.

---

## 🚀 Lancer la version Web (Preview)

1. **Installer Node.js**  
   Téléchargez-le sur [nodejs.org](https://nodejs.org/)

2. **Ouvrir un terminal**  
   Utilisez **CMD** sur Windows pour éviter les erreurs de droits

3. **Installer les dépendances**  
   ```bash
   npm install
Lancer le serveur

bash
npm run dev
Ouvrir le navigateur
Accédez à http://localhost:5173

🐍 Version Python (Terminal)
bash
python main.py
🛠 Résolution des problèmes (Windows)
❌ Erreur "Execution of scripts is disabled" (PowerShell)
Ouvrez PowerShell en Administrateur

Exécutez la commande suivante :

powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Validez avec Y (Oui)

📂 Structure du projet
logic/ — Moteur de calcul en TypeScript (BST + cache O(1))

python/ — Moteur de calcul en Python (version CLI)

src/App.tsx — Interface utilisateur interactive (React)
