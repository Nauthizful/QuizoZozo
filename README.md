# ⚡ QuizoZozo

<p align="center">
  <strong>Application Web de Quiz Multijoueur en Temps Réel (Style Kahoot) — 100% Sans Code PIN</strong><br>
  <em>Conçue en Node.js, Express, Socket.io et Vanilla HTML/CSS/JavaScript (Zéro framework lourd).</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Socket.io-v4-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io">
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/CSS3-6_Thèmes-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
</p>

---

## 📑 Sommaire
- [Aperçu du Projet](#-aperçu-du-projet)
- [Architecture des 4 Écrans](#-architecture-des-4-écrans)
- [Fonctionnalités Majeures](#-fonctionnalités-majeures)
  - [1. Système d'Avatars Vectoriels Customisables](#1--système-davatars-vectoriels-customisables-style-skribblio)
  - [2. Découpage en 2 Phases : Lecture ➔ Vote](#2--découpage-en-2-phases--lecture--vote)
  - [3. Affichage Complet sur Mobile & Message de Proximité](#3--affichage-complet-sur-mobile--message-de-proximité)
  - [4. Moteur Sonore & Statistique du Joueur le Plus Rapide](#4--moteur-sonore--statistique-du-joueur-le-plus-rapide)
  - [5. Régie Animateur & Classement Intégral Trié](#5--régie-animateur--classement-intégral-trié)
  - [6. 6 Thèmes Graphiques Radicaux](#6--6-thèmes-graphiques-radicaux)
  - [7. Import / Export Double Format (JSON & ZIP Complet)](#7--import--export-double-format-json--zip-complet)
  - [8. Maintien d'Écran Anti-Veille (Wake Lock API)](#8--maintien-décran-anti-veille-wake-lock-api)
- [Cycle de Vie d'une Question & Machine d'État](#-cycle-de-vie-dune-question--machine-détat)
- [Formule de Calcul du Score](#-formule-de-calcul-du-score)
- [Démarrage & Installation](#-démarrage--installation)
- [Déploiement en Réseau Local (Wi-Fi de Soirée / Événement)](#-déploiement-en-réseau-local-wi-fi-de-soirée--événement)
- [Structure du Projet](#-structure-du-projet)

---

## 🌟 Aperçu du Projet

**QuizoZozo** est une plateforme de quiz festive et professionnelle pensée pour les événements, mariages, soirées d'entreprise, animations pédagogiques et rassemblements entre amis.

Contrairement aux solutions traditionnelles :
- ❌ **Aucun code PIN à 6 chiffres à taper** : un simple scan de QR Code ou une URL directe connecte instantanément l'invité.
- ❌ **Aucune inscription obligatoire ni application à installer** : fonctionne directement dans le navigateur du smartphone.
- ❌ **Aucun framework frontend lourd (React/Vue/Angular)** : temps de chargement instantané (< 50ms) et consommation minimale de bande passante.
- ✅ **Reconnexion transparente automatique** : gestion par UUID et `localStorage`, insensible aux rechargements de page ou pertes temporaires de réseau.

---

## 🖥️ Architecture des 4 Écrans

| Écran | URL | Rôle & Usage |
| :--- | :--- | :--- |
| 📱 **Joueur / Invité** | `/` | Interface mobile-first : personnalisation de l'avatar, énoncé, image, vote tactile continu et score personnel en direct. |
| 🖥️ **Grand Écran** | `/display` | Vue de projection (TV / Vidéoprojecteur) : QR Code de connexion, avatars flottants du lobby, chrono circulaire, histogramme des votes, bandeau du record de vitesse et podium animé avec confettis. |
| 🎙️ **Régie Animateur** | `/admin` | Tableau de bord de contrôle : boutons d'enchaînement strict, chronomètre dynamique (+10s, pause), note d'animation/indice, classement intégral trié et modération par expulsion. |
| ✏️ **QuizoZozo Builder** | `/admin/builder` | Éditeur de questions interactif : gestion de 3 à 6 choix, réponses uniques ou multiples, timers, upload d'images et import/export ZIP complet ou JSON. |

---

## 🚀 Fonctionnalités Majeures

### 1. 🎨 Système d'Avatars Vectoriels Customisables (Style Skribbl.io)
- **Générateur SVG procédural (`avatar.js`)** :
  - **6 Formes de tête** : Cercle, Carré arrondi, Triangle, Hexagone, Ovale, Goutte.
  - **6 Expressions des yeux** : Ronds expressifs, Joyeux (^ ^), Clin d'œil (> o), Lunettes de soleil cool, Étoiles (★ ★), Concentrés.
  - **6 Expressions de bouche** : Grand sourire ouvert, Malicieux, Bouche surprise en O, Langue tirée (:P), Ligne neutre, Joues roses.
  - **8 Couleurs vives** : Palette harmonieuse (Rouge corail, Bleu azur, Vert émeraude, Jaune ambre, Violet cosmique, Rose fluo, Cyan lagon, Orange mandarine).
  - **🎲 Bouton aléatoire** : Génération instantanée d'un avatar amusant en 1 clic.
- **Affichage synchronisé** :
  - Dans le lobby de projection `/display` avec micro-animations flottantes.
  - Sur les 3 marches du podium et dans le Top 5.
  - Dans l'en-tête du smartphone du joueur `/` et dans le classement de la régie `/admin`.

---

### 2. ⏱️ Découpage en 2 Phases : Lecture ➔ Vote
Pour garantir une égalité parfaite entre les joueurs et laisser l'animateur poser l'ambiance, chaque question se découpe en 2 temps :
1. **Phase 1 : « Temps de lecture » (`READING`)**
   - L'énoncé et l'illustration apparaissent sur le Grand Écran et sur les smartphones des invités.
   - Les choix de réponses sont masqués et le chronomètre est **en pause**.
2. **Phase 2 : « Lancement du vote » (`QUESTION`)**
   - L'animateur clique sur **« 🎯 Lancer les réponses »**.
   - Les choix s'affichent instantanément sur les téléphones et sur l'écran public, et le compte à rebours démarre.

---

### 3. 📱 Affichage Complet sur Mobile & Message de Proximité
- **Autonomie sur smartphone** : L'énoncé complet et l'image associée s'affichent directement sur l'écran du participant au-dessus des choix.
- **Vote interactif et continu** : Choix modifiable librement jusqu'à l'expiration du chrono (pas de bouton de confirmation bloquant).
- **Message de proximité de score (`REVEAL`)** :
  - 👑 *Si 1er :* **« Tu es en tête de la partie ! Garde le rythme ! »**
  - 🎯 *Si suiveur :* **« Tu n'es qu'à X points de la personne devant toi ([Prénom]) ! »**

---

### 4. 🔊 Moteur Sonore & Statistique du Joueur le Plus Rapide
- **Audio Engine (`/display`)** :
  - `5secondes.mp3` : Avertissement sonore lors des 5 dernières secondes.
  - `roulement_de_tambour.wav` : Montée de suspense à 2 secondes de la fin.
  - `reponse_revelation.mp3` : Déclenchement lors de la révélation des bonnes réponses.
  - `podium_victoire.mp3` : Fanfare triomphale pour le podium et la fin de partie.
  - Bouton de contrôle audio `🔊` / `🔇` pour déverrouiller la politique *Autoplay* des navigateurs.
- **Statistique de Réactivité Éclair** :
  - Sur `/display` lors de la révélation, un bandeau doré met à l'honneur le participant qui a été le plus rapide à trouver la bonne réponse :
  > **⚡ [Avatar] [Prénom] a été le plus rapide à trouver la bonne réponse en X.X secondes !**

---

### 5. 🎙️ Régie Animateur & Classement Intégral Trié
- **Classement exhaustif de la salle** : Visualisation en direct de l'intégralité des participants connectés, **triés par ordre décroissant de score** avec badges de rang (`🥇 1`, `🥈 2`, `🥉 3`, `#4`, `#5`...), avatars, scores et indicateurs de vote en direct.
- **Modération en direct (Kick)** : Bouton rouge `✕` permettant d'exclure instantanément un participant perturbateur ou un doublon.
- **Gestion du temps** : Ajout de `+10s`, mise en `Pause/Reprise` et `Forcer la fin`.
- **Notes d'animation** : Affichage d'anecdotes privées, blagues et indices pour assister l'animateur au micro.

---

### 6. 🎨 6 Thèmes Graphiques Radicaux

Le thème sélectionné dans le Builder transforme instantanément l'univers visuel des pages **Joueur (`/`)** et **Grand Écran (`/display`)** via `data-theme` :

1. **🟣 Quizz Moderne** *(Défaut)* : Dark glassmorphism, néons Kahoot colorés, police *Outfit*.
2. **💻 Geek / IT** : Terminal CRT Hacker, phosphore vert & cyan, scanlines, police monospace *Fira Code* / *VT323*.
3. **🍂 Mariage Automnal / Whimsical** : Palette chaleureuse Terracotta, or ambré féérique, police sérif *Cinzel* & *Playfair Display*.
4. **🪟 Windows XP** : Rétro 2000s, colline Bliss, fenêtres bleu Luna et boutons 3D biseautés *Tahoma*.
5. **🕹️ Synthwave Arcade 80s** : Grille wireframe au sol, soleil couchant néon, chrome et typographie pixel *Press Start 2P*.
6. **✨ Éclipse Solaire & Étoiles Filantes** : Nuit cosmique profonde, aurores nébuleuses dorées/argentées, reflets d'étoiles scintillantes et cartes spatiales ultra-contrastées.

---

### 7. 📦 Import / Export Double Format (JSON & ZIP Complet)
- **📄 Export/Import JSON (Texte seul)** : Idéal pour partager rapidement la structure textuelle du quiz.
- **📦 Export/Import ZIP (Pack Complet)** : Génère une archive intégrant le fichier `quiz.json` **ET** l'ensemble des images téléversées dans `/uploads/`. Permet de sauvegarder et restaurer un quiz avec 100% de ses illustrations sur n'importe quelle machine sans dépendance externe.
- **Nettoyage automatique** : La réinitialisation d'un quiz depuis la régie supprime physiquement les fichiers médias du serveur pour éviter tout engorgement du disque.

---

### 8. ⚡ Maintien d'Écran Anti-Veille (Wake Lock API)
- Utilisation de l'API native `navigator.wakeLock.request('screen')` sur l'interface joueur.
- Empêche les smartphones de se mettre en veille ou de verrouiller leur écran pendant la session.
- Réactivation automatique en cas de changement d'onglet ou de retour au premier plan (`visibilitychange`).

---

## 🔄 Cycle de Vie d'une Question & Machine d'État

Le déroulement d'une session suit un flux rigoureux et sans raccourci pour préserver l'excitation de la compétition :

```text
[ 1. LOBBY ] ──────────────► Scan du QR code & création des avatars
      │
      ▼ (admin_start_game / admin_next_question)
[ 2. READING ] ────────────► Phase 1 : Lecture de l'énoncé & image (Chrono en pause)
      │
      ▼ (admin_start_voting)
[ 3. QUESTION ] ───────────► Phase 2 : Réponses actives sur mobile & décompte chrono
      │
      ▼ (fin du chrono ou admin_reveal_answer)
[ 4. REVEAL ] ─────────────► Bonnes réponses, histogramme & record de vitesse ⚡
      │
      ▼ (admin_show_leaderboard - Seule action possible)
[ 5. LEADERBOARD ] ────────► Podium provisoire Top 3 + Top 5 avec Avatars
      │
      ├────────────────────► (Si question suivante) ──► Retour à [ 2. READING ]
      │
      ▼ (Si dernière question)
[ 6. PODIUM FINAL ] ───────► Titre « PODIUM FINAL », Confettis géants & Fanfare 🏆
```

---

## 📐 Formule de Calcul du Score

Le score combine la justesse des réponses et la vitesse d'exécution :

### 1. Question à réponse unique
Pour une réponse exacte :

$$\text{Points} = \text{round}\left(1000 \times \left(1 - \frac{\text{Temps Écoulé}}{\text{Temps Total}} \times 0.5\right)\right)$$

- **Réponse instantanée ($t \approx 0$)** : **1000 points** (maximum).
- **Réponse à la dernière seconde ($t = t_{\text{max}}$)** : **500 points** (minimum garanti pour une bonne réponse).
- **Réponse fausse ou absence de réponse** : **0 point**.

---

### 2. Question à réponses multiples
Un calcul proportionnel équitable pénalise les mauvaises réponses cochées au hasard :

$$\text{Fraction} = \max\left(0, \; \frac{C_{\text{correct}} - C_{\text{wrong}}}{N_{\text{total\_correct}}}\right)$$

$$\text{Points} = \text{round}\left(\text{PointsVitesseMax} \times \text{Fraction}\right)$$

*Exemple :* Sur une question comportant 3 bonnes réponses ($N_{\text{total\_correct}} = 3$) :
- Le joueur coche 2 bonnes réponses et 0 mauvaise $\rightarrow \text{Fraction} = \frac{2 - 0}{3} = \frac{2}{3} \approx 66.7\%$ des points de vitesse.
- Le joueur coche 2 bonnes réponses et 1 mauvaise $\rightarrow \text{Fraction} = \frac{2 - 1}{3} = \frac{1}{3} \approx 33.3\%$ des points de vitesse.
- Le joueur coche 1 bonne réponse et 2 mauvaises $\rightarrow \text{Fraction} = \max(0, \frac{1 - 2}{3}) = 0\% \rightarrow 0\text{ pt}$.

---

## 💻 Démarrage & Installation

### Prérequis
- **Node.js** version 18.0.0 ou supérieure.
- **npm** (inclus avec Node.js).

### 1. Cloner le dépôt
```bash
git clone https://github.com/nauthizful/QuizoZozo.git
cd QuizoZozo
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Démarrer le serveur
```bash
npm start
```
Le serveur s'exécute par défaut sur le port `3000`.

---

## 🌐 Déploiement en Réseau Local (Wi-Fi de Soirée / Événement)

Pour utiliser QuizoZozo avec tous les smartphones connectés sur la même box Wi-Fi ou un point d'accès 4G/5G local :

1. Trouvez l'adresse IP locale de votre machine hôte :
   - **Windows** : Ouvrez un terminal et tapez `ipconfig` (recherchez l'adresse *IPv4*, ex: `192.168.1.45`).
   - **macOS / Linux** : Tapez `ifconfig` ou `ip a` (ex: `192.168.1.45`).
2. Sur la machine hôte (reliée au projecteur) :
   - Ouvrez la régie : `http://localhost:3000/admin`
   - Ouvrez le grand écran : `http://localhost:3000/display`
3. Les invités scannent simplement le QR Code affiché sur l'écran (qui pointera automatiquement sur `http://192.168.1.45:3000/`).

---

## 📁 Structure du Projet

```text
QuizoZozo/
├── package.json               # Dépendances npm (express, socket.io, multer, adm-zip)
├── server.js                  # Serveur central Express, moteur Socket.io et API REST
├── uploads/                   # Stockage local des images téléversées pour les quiz
├── public/
│   ├── index.html             # Interface mobile Joueur (avatar, question, vote continu)
│   ├── display.html           # Interface Grand Écran / Vidéoprojecteur (QR code, podium)
│   ├── admin.html             # Interface Régie Animateur (contrôles, chrono, modération)
│   ├── builder.html           # Interface QuizoZozo Builder (créateur & import/export)
│   ├── sample-quiz.json       # Modèle de quiz de démonstration
│   ├── audio/                 # Moteur sonore (5s, tambour, révélation, fanfare)
│   │   ├── 5secondes.mp3
│   │   ├── roulement_de_tambour.wav
│   │   ├── reponse_revelation.mp3
│   │   └── podium_victoire.mp3
│   ├── css/
│   │   └── style.css          # Design system complet & variables des 6 thèmes graphiques
│   └── js/
│       ├── avatar.js          # Moteur procédural vectoriel SVG pour les avatars
│       ├── guest.js           # Logique cliente Joueur (WakeLock, vote, proximité)
│       ├── display.js         # Logique cliente Grand Écran (audio, histogramme, podium)
│       ├── admin.js           # Logique cliente Régie (contrôleur 2 phases, kick, chrono)
│       ├── builder.js         # Logique cliente Builder (gestion ZIP/JSON, upload images)
│       └── confetti.js        # Moteur d'effets de particules de confettis Canvas
├── PROJECT_DOCUMENTATION_AI.md # Spécification d'architecture détaillée pour IA & développeurs
└── README.md                  # Documentation officielle du projet
```

---

## 📄 Licence
Ce projet est distribué sous licence libre **MIT**. Vous êtes libre de l'utiliser, l'adapter et l'enrichir pour tous vos événements !
