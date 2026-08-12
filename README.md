# ⚡ Quiz en Temps Réel (Kahoot-Style Sans PIN)

Application web interactive de quiz multijoueur en direct sans code PIN, développée en Node.js, Express, Socket.io et Vanilla HTML/CSS/JS.

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- **Node.js** (v18 ou supérieur recommandé) et **npm** installés.

### 2. Installation des dépendances
Ouvrez un terminal dans le dossier du projet :
```bash
npm install
```

### 3. Lancement du serveur
```bash
npm start
# ou
node server.js
```

Le serveur démarre par défaut sur le port **3000** :
- 📱 **Page Joueur / Invité** : [http://localhost:3000/](http://localhost:3000/)
- 🖥️ **Page Grand Écran (Projo)** : [http://localhost:3000/display](http://localhost:3000/display)
- 🎙️ **Page Régie Animateur** : [http://localhost:3000/admin](http://localhost:3000/admin)
- ✏️ **Créateur de Quiz (Builder)** : [http://localhost:3000/admin/builder](http://localhost:3000/admin/builder)

---

## 🎯 Fonctionnalités Clés

### 1. Page Invité (`/`) - Mobile First
- **Reconnexion transparente** : Identifiant unique `guestId` et prénom stockés dans `localStorage` (aucun code PIN nécessaire, reconnexion automatique en cas de rechargement F5).
- **4 Interfaces dynamiques synchronisées** :
  1. *Lobby* : Message d'accueil et attente du top départ.
  2. *Question active* : 4 gros boutons tactiles colorés (▲ Rouge, ◆ Bleu, ● Jaune, ■ Vert).
  3. *Attente après vote* : Confirmation visuelle instantanée du choix.
  4. *Résultat personnel* : Écran avec points gagnés selon la justesse et la vitesse de réponse.

### 2. Page Grand Écran / Vidéoprojecteur (`/display`)
- **QR Code dynamique** généré automatiquement pointant vers la racine du serveur pour un scan rapide depuis les smartphones.
- **Grille des joueurs connectés** en direct dans le lobby.
- **Compte à rebours circulaire animé** (changement de couleur vert $\rightarrow$ orange $\rightarrow$ rouge).
- **Histogramme de répartition des réponses** lors de la révélation.
- **Podium interactif animé (Top 5)** avec confettis pour célébrer la victoire !

### 3. Page Régie Animateur (`/admin`)
- **Jauge de réponses en direct** (`18/42 ont répondu`) avec barre de progression temps réel.
- **Aperçu complet de la question active** avec la bonne réponse en vert, la note d'animation / blague et l'indice pour le public.
- **Aperçu de la question suivante ($N+1$)**.
- **Contrôles du jeu** : Lancer la partie, Révéler la bonne réponse, Afficher le classement, Question suivante.
- **Gestion du chrono** : Pause / Reprendre, +10 secondes, Forcer la fin.
- **Bouton rouge "SUPPRIMER LE QUIZZ"** avec modale de confirmation : vide la mémoire `gameState` et supprime physiquement les fichiers dans `/uploads/`.

### 4. Créateur de Quiz (`/admin/builder`)
- Formulaire pour créer / modifier des questions.
- Téléversement d'illustrations (images) via **Multer** dans `/uploads/`.
- Réglage du chronomètre par question (5s, 10s, 15s, 20s, 30s, 60s).
- Réordonnancement des questions (Monter / Descendre) et suppression.
- **Import / Export JSON** (`quiz.json`) pour sauvegarder ou charger des sessions prêtes à jouer.

---

## 📐 Formule de Score
Pour une bonne réponse :
$$\text{Points} = \text{Math.round}\left(1000 \times \left(1 - \frac{\text{TempsÉcoulé}}{\text{TempsTotal}} \times 0.5\right)\right)$$
Une mauvaise réponse rapporte 0 point.

---

## 📂 Structure du Projet
```text
realtime-quiz/
├── package.json          # Configuration et dépendances npm
├── server.js             # Serveur Express, Socket.io, Multer et moteur de jeu
├── uploads/              # Dossier de stockage des images uploadées
├── public/
│   ├── index.html        # Page joueur (Invité)
│   ├── display.html      # Page Grand Écran / Vidéoprojecteur
│   ├── admin.html        # Page Régie Animateur
│   ├── builder.html      # Page Créateur de Quiz
│   ├── sample-quiz.json  # Modèle de quiz exemple
│   ├── css/
│   │   └── style.css     # Design system, glassmorphism & thème Kahoot
│   └── js/
│       ├── guest.js      # Logique client Joueur
│       ├── display.js    # Logique client Grand Écran
│       ├── admin.js      # Logique client Régie
│       ├── builder.js    # Logique client Créateur
│       └── confetti.js   # Moteur de confettis
└── README.md             # Documentation et guide de démarrage
```
