# ⚡ QuizoZozo - Quiz Multijoueur Temps Réel (Kahoot-Style Sans PIN)

**QuizoZozo** est une application web moderne et interactive de quiz en direct sans code PIN, développée en Node.js, Express, Socket.io et Vanilla HTML/CSS/JS (aucun framework lourd).

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- **Node.js** (v18 ou supérieur recommandé) et **npm**.

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
- 🖥️ **Page Grand Écran (Vidéoprojecteur)** : [http://localhost:3000/display](http://localhost:3000/display)
- 🎙️ **Page Régie Animateur** : [http://localhost:3000/admin](http://localhost:3000/admin)
- ✏️ **QuizoZozo Builder (Créateur de Quiz & Thèmes)** : [http://localhost:3000/admin/builder](http://localhost:3000/admin/builder)

---

## 🎯 Fonctionnalités Clés

### 1. 📱 Page Invité (`/`) - Mobile First & Épurée
- **Reconnexion transparente** : Identifiant unique `guestId` et prénom stockés dans `localStorage` (aucun code PIN nécessaire, reconnexion automatique en cas de rechargement F5).
- **Attention focalisée sur l'écran de projection** : L'image et l'énoncé sont masqués sur le smartphone du joueur pour inciter à regarder le vidéoprojecteur.
- **Boutons tactiles texte + couleur** : Grands boutons ergonomiques avec le texte de la réponse centré.
- **Vote instantané & continu** : La sélection est mise en valeur en temps réel (contour lumineux `✓`) et reste modifiable jusqu'à l'expiration du chrono.
- **Résultat personnel synchrone** : Calcul des points et affichage du résultat uniquement lors de la révélation par l'animateur ou la fin du temps.

### 2. 🖥️ Page Grand Écran / Vidéoprojecteur (`/display`)
- **QR Code dynamique** généré automatiquement pointant vers l'URL du serveur pour un scan rapide depuis les smartphones.
- **Grille des joueurs connectés** en direct dans le lobby.
- **Compte à rebours circulaire animé** (vert $\rightarrow$ orange $\rightarrow$ rouge).
- **Grille de réponses adaptative** de 3 à 6 choix (A, B, C, D, E, F).
- **Histogramme de répartition des réponses** lors de la révélation.
- **Podium animé (Top 5)** avec célébration confettis !

### 3. 🎨 5 Thèmes Graphiques Radicaux (User & Display)
1. **🟣 Quizz Moderne** *(Défaut)* : Dark glassmorphism, néon Kahoot, dégradés radiaux fluides, police *Outfit*.
2. **💻 Geek / IT** : Terminal CRT Hacker, phosphore vert & cyan, scanlines, police monospace *Fira Code* / *VT323*.
3. **🍂 Mariage Automnal / Whimsical** : Palette chaleureuse Terracotta, or ambré féérique, police sérif *Cinzel* & *Playfair Display*.
4. **🪟 Windows XP** : Rétro 2000s, colline Bliss, fenêtres bleues Luna et boutons 3D biseautés.
5. **🕹️ Synthwave Arcade 80s** : Grille wireframe, soleil couchant néon, chrome et typographie pixel *Press Start 2P*.

### 4. 🎙️ Page Régie Animateur (`/admin`)
- **Jauge de réponses en direct** (`18/42 ont répondu`) avec barre de progression temps réel.
- **Aperçu complet de la question active** avec la bonne réponse en vert, la note d'animation / blague et l'indice pour le public.
- **Aperçu de la question suivante ($N+1$)**.
- **Contrôles du jeu** : Lancer la partie, Afficher la réponse (Révélation prioritaire), Afficher le classement, Question suivante.
- **Gestion du chrono** : Pause / Reprendre, +10 secondes, Forcer la fin.
- **Bouton rouge "SUPPRIMER LE QUIZZ"** : vide la mémoire `gameState` et supprime physiquement tous les fichiers dans `/uploads/`.

### 5. ✏️ QuizoZozo Builder (`/admin/builder`)
- Configuration du titre et du **thème visuel**.
- Support de **3 à 6 choix de réponses** et **réponses correctes multiples**.
- Téléversement d'illustrations (images) via **Multer** dans `/uploads/`.
- Réglage du chronomètre par question (5s, 10s, 15s, 20s, 25s, 30s, 60s).
- Réordonnancement des questions (Monter / Descendre) et suppression.
- **Double format Export/Import** :
  - 📄 **JSON (Texte seul)** : export/import de la structure textuelle.
  - 📦 **ZIP (Complet)** : archive intégrant `quiz.json` ET toutes les images associées pour sauvegarder et restaurer un quiz avec toutes ses illustrations.

---

## 📐 Formule de Score
Pour une bonne réponse :
$$\text{Points} = \text{Math.round}\left(1000 \times \left(1 - \frac{\text{TempsÉcoulé}}{\text{TempsTotal}} \times 0.5\right)\right)$$

Pour les questions à choix multiples, un calcul proportionnel est appliqué :
$$\text{Fraction} = \max\left(0, \; \frac{C_{\text{correct}} - C_{\text{wrong}}}{N_{\text{total\_correct}}}\right)$$

---

## 📂 Structure du Projet
```text
quizozozo/
├── package.json               # Configuration et dépendances npm
├── server.js                  # Serveur Express, Socket.io, Multer et moteur de jeu
├── uploads/                   # Dossier de stockage des images uploadées
├── public/
│   ├── index.html             # Page joueur (Invité /)
│   ├── display.html           # Page Grand Écran / Vidéoprojecteur (/display)
│   ├── admin.html             # Page Régie Animateur (/admin)
│   ├── builder.html           # Page QuizoZozo Builder (/admin/builder)
│   ├── sample-quiz.json       # Modèle de quiz exemple
│   ├── css/
│   │   └── style.css          # Design system & styles des 5 thèmes graphiques
│   └── js/
│       ├── guest.js           # Logique client Joueur (vote continu, thème)
│       ├── display.js         # Logique client Grand Écran (QR code, podium)
│       ├── admin.js           # Logique client Régie (dashboard, chrono)
│       ├── builder.js         # Logique client Builder (ZIP/JSON, images)
│       └── confetti.js        # Moteur de confettis Canvas
├── PROJECT_DOCUMENTATION_AI.md # Spécification technique complète pour IA & Devs
└── README.md                  # Documentation et guide de démarrage QuizoZozo
```
