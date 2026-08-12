const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AdmZip = require('adm-zip');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration for Images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'quiz-img-' + uniqueSuffix + ext);
  }
});

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|svg/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.toLowerCase();
  if (allowedTypes.test(ext) || allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images (PNG, JPG, WEBP, GIF, SVG) sont autorisées'));
  }
};

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFileFilter
});

// Multer for ZIP Uploads (in memory buffer)
const uploadZip = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Default sample questions (3 to 6 choices, single & multiple correct answers)
const defaultQuestions = [
  {
    id: 'q-1',
    prompt: 'Quelle planète est la plus proche du Soleil ?',
    image: null,
    choices: [
      { id: 'A', text: 'Vénus' },
      { id: 'B', text: 'Mercure' },
      { id: 'C', text: 'Mars' },
      { id: 'D', text: 'Jupiter' }
    ],
    correctChoices: ['B'],
    timer: 20,
    hostNote: 'Astuce : Même si Mercure est la plus proche, Vénus est en réalité la plus chaude en raison de son effet de serre !',
    hint: 'Son nom est aussi associé à un métal liquide et au messager des dieux.'
  },
  {
    id: 'q-2',
    prompt: 'Quels langages parmi les suivants s\'exécutent nativement dans les moteurs web ? (Plusieurs réponses)',
    image: null,
    choices: [
      { id: 'A', text: 'JavaScript' },
      { id: 'B', text: 'Python' },
      { id: 'C', text: 'WebAssembly (Wasm)' },
      { id: 'D', text: 'C++' },
      { id: 'E', text: 'Ruby' }
    ],
    correctChoices: ['A', 'C'],
    timer: 25,
    hostNote: 'JavaScript et WebAssembly sont les deux seuls formats d\'exécution standardisés et intégrés directement aux navigateurs.',
    hint: 'Il y a 2 technologies web incontournables.'
  },
  {
    id: 'q-3',
    prompt: 'Quel est le plus grand océan de la Terre ? (3 choix)',
    image: null,
    choices: [
      { id: 'A', text: 'Océan Atlantique' },
      { id: 'B', text: 'Océan Indien' },
      { id: 'C', text: 'Océan Pacifique' }
    ],
    correctChoices: ['C'],
    timer: 15,
    hostNote: 'Il couvre plus de 30% de la surface du globe, plus vaste que toutes les terres émergées réunies.',
    hint: 'Son nom évoque le calme et la tranquillité.'
  },
  {
    id: 'q-4',
    prompt: 'Quels animaux sont des mammifères marins ? (Plusieurs réponses possibles)',
    image: null,
    choices: [
      { id: 'A', text: 'Le Dauphin' },
      { id: 'B', text: 'Le Requin blanc' },
      { id: 'C', text: 'La Baleine bleue' },
      { id: 'D', text: 'Le Thon rouge' },
      { id: 'E', text: 'Le Morse' },
      { id: 'F', text: 'La Raie Manta' }
    ],
    correctChoices: ['A', 'C', 'E'],
    timer: 25,
    hostNote: 'Dauphins, baleines et morses respirent de l\'air à la surface et allaitent leurs petits.',
    hint: 'Pensez à ceux qui ont des poumons et allaitent leurs petits !'
  },
  {
    id: 'q-5',
    prompt: 'Quel élément chimique a pour symbole « Au » ?',
    image: null,
    choices: [
      { id: 'A', text: 'Argent' },
      { id: 'B', text: 'Or' },
      { id: 'C', text: 'Aluminium' },
      { id: 'D', text: 'Argon' }
    ],
    correctChoices: ['B'],
    timer: 15,
    hostNote: 'Provient du latin « Aurum » qui signifie étincelant ou éclatant.',
    hint: 'Le métal précieux le plus convoité pour les médailles de 1ère place.'
  }
];

// Helper to normalize question structure
function normalizeQuestion(q, idx = 0) {
  let choices = q.choices;
  if (!Array.isArray(choices) || choices.length < 3) {
    choices = [
      { id: 'A', text: 'Choix A' },
      { id: 'B', text: 'Choix B' },
      { id: 'C', text: 'Choix C' },
      { id: 'D', text: 'Choix D' }
    ];
  } else {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    choices = choices.slice(0, 6).map((c, i) => ({
      id: letters[i],
      text: typeof c === 'string' ? c : (c.text || `Choix ${letters[i]}`)
    }));
  }

  let correctChoices = [];
  if (Array.isArray(q.correctChoices) && q.correctChoices.length > 0) {
    correctChoices = q.correctChoices;
  } else if (q.correctChoice) {
    correctChoices = [q.correctChoice];
  } else {
    correctChoices = ['A'];
  }

  const validIds = choices.map(c => c.id);
  correctChoices = correctChoices.filter(id => validIds.includes(id));
  if (correctChoices.length === 0) correctChoices = [validIds[0]];

  return {
    id: q.id || `q-${Date.now()}-${idx}`,
    prompt: q.prompt || `Question ${idx + 1}`,
    image: q.image || null,
    choices,
    correctChoices,
    timer: parseInt(q.timer, 10) || 20,
    hostNote: q.hostNote || '',
    hint: q.hint || ''
  };
}

// In-Memory Game State
let gameState = {
  status: 'LOBBY', // 'LOBBY' | 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | 'GAME_OVER'
  title: 'QuizoZozo en Direct !',
  theme: 'quizz-moderne', // 'quizz-moderne' | 'geek-it' | 'mariage-automne' | 'windows-xp' | 'synthwave-arcade'
  currentQuestionIndex: 0,
  timeRemaining: 20,
  totalQuestionTime: 20,
  isTimerPaused: false,
  questionStartTime: null,
  questions: defaultQuestions.map((q, idx) => normalizeQuestion(q, idx)),
  players: {}, // guestId -> { id, name, score, isConnected, socketId, currentAnswer: { choices: [], timeTaken, pointsEarned } }
  history: []
};

let timerInterval = null;

// ==========================================
// GAME HELPER FUNCTIONS
// ==========================================

function getCurrentQuestion() {
  if (gameState.currentQuestionIndex >= 0 && gameState.currentQuestionIndex < gameState.questions.length) {
    return gameState.questions[gameState.currentQuestionIndex];
  }
  return null;
}

function getNextQuestion() {
  const nextIdx = gameState.currentQuestionIndex + 1;
  if (nextIdx < gameState.questions.length) {
    return gameState.questions[nextIdx];
  }
  return null;
}

function getConnectedPlayersCount() {
  return Object.values(gameState.players).filter(p => p.isConnected).length;
}

function getAnsweredPlayersCount() {
  return Object.values(gameState.players).filter(p => p.isConnected && p.currentAnswer && p.currentAnswer.choices && p.currentAnswer.choices.length > 0).length;
}

function calculateAnswerDistribution() {
  const currentQ = getCurrentQuestion();
  const dist = { total: 0 };
  if (currentQ) {
    currentQ.choices.forEach(c => {
      dist[c.id] = 0;
    });
  }

  Object.values(gameState.players).forEach(p => {
    if (p.currentAnswer && Array.isArray(p.currentAnswer.choices)) {
      p.currentAnswer.choices.forEach(ch => {
        if (dist[ch] !== undefined) {
          dist[ch]++;
        }
      });
      if (p.currentAnswer.choices.length > 0) {
        dist.total++;
      }
    }
  });
  return dist;
}

function getLeaderboard(limit = 10) {
  return Object.values(gameState.players)
    .map(p => ({
      id: p.id,
      name: p.name,
      score: p.score || 0,
      isConnected: p.isConnected,
      lastPoints: p.currentAnswer ? p.currentAnswer.pointsEarned : 0
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Data projection filters
function getGuestView(guestId) {
  const currentQ = getCurrentQuestion();
  const player = gameState.players[guestId];

  let revealData = null;
  if ((gameState.status === 'REVEAL' || gameState.status === 'LEADERBOARD' || gameState.status === 'GAME_OVER') && currentQ) {
    if (player && player.currentAnswer && player.currentAnswer.choices && player.currentAnswer.choices.length > 0) {
      const correctSet = new Set(currentQ.correctChoices);
      const playerChoices = player.currentAnswer.choices || [];
      const isExactMatch = playerChoices.length === correctSet.size && playerChoices.every(c => correctSet.has(c));
      const hasSomeCorrect = playerChoices.some(c => correctSet.has(c));

      revealData = {
        isCorrect: isExactMatch,
        isPartial: !isExactMatch && hasSomeCorrect && player.currentAnswer.pointsEarned > 0,
        pointsEarned: player.currentAnswer.pointsEarned,
        correctChoices: currentQ.correctChoices,
        selectedChoices: playerChoices,
        totalScore: player.score
      };
    } else {
      revealData = {
        isCorrect: false,
        isPartial: false,
        pointsEarned: 0,
        correctChoices: currentQ.correctChoices,
        selectedChoices: [],
        totalScore: player ? player.score : 0
      };
    }
  }

  return {
    status: gameState.status,
    title: gameState.title,
    theme: gameState.theme || 'quizz-moderne',
    currentQuestionIndex: gameState.currentQuestionIndex,
    totalQuestions: gameState.questions.length,
    timeRemaining: gameState.timeRemaining,
    totalQuestionTime: gameState.totalQuestionTime,
    player: player ? {
      id: player.id,
      name: player.name,
      score: player.score,
      hasAnswered: !!(player.currentAnswer && player.currentAnswer.choices && player.currentAnswer.choices.length > 0),
      selectedChoices: player.currentAnswer ? (player.currentAnswer.choices || []) : []
    } : null,
    question: currentQ ? {
      id: currentQ.id,
      choices: currentQ.choices,
      isMultiple: currentQ.correctChoices.length > 1,
      timer: currentQ.timer
    } : null,
    reveal: revealData
  };
}

function getDisplayView() {
  const currentQ = getCurrentQuestion();
  return {
    status: gameState.status,
    title: gameState.title,
    theme: gameState.theme || 'quizz-moderne',
    currentQuestionIndex: gameState.currentQuestionIndex,
    totalQuestions: gameState.questions.length,
    timeRemaining: gameState.timeRemaining,
    totalQuestionTime: gameState.totalQuestionTime,
    isTimerPaused: gameState.isTimerPaused,
    connectedCount: getConnectedPlayersCount(),
    answeredCount: getAnsweredPlayersCount(),
    playersList: Object.values(gameState.players).map(p => ({
      id: p.id,
      name: p.name,
      isConnected: p.isConnected,
      score: p.score
    })),
    question: currentQ ? {
      id: currentQ.id,
      prompt: currentQ.prompt,
      image: currentQ.image,
      choices: currentQ.choices,
      isMultiple: currentQ.correctChoices.length > 1,
      timer: currentQ.timer
    } : null,
    distribution: (gameState.status === 'REVEAL' || gameState.status === 'LEADERBOARD' || gameState.status === 'GAME_OVER') ? calculateAnswerDistribution() : null,
    correctChoices: (gameState.status === 'REVEAL' || gameState.status === 'LEADERBOARD' || gameState.status === 'GAME_OVER') && currentQ ? currentQ.correctChoices : null,
    leaderboard: getLeaderboard(5)
  };
}

function getAdminView() {
  const currentQ = getCurrentQuestion();
  const nextQ = getNextQuestion();
  return {
    status: gameState.status,
    title: gameState.title,
    theme: gameState.theme || 'quizz-moderne',
    currentQuestionIndex: gameState.currentQuestionIndex,
    totalQuestions: gameState.questions.length,
    timeRemaining: gameState.timeRemaining,
    totalQuestionTime: gameState.totalQuestionTime,
    isTimerPaused: gameState.isTimerPaused,
    connectedCount: getConnectedPlayersCount(),
    answeredCount: getAnsweredPlayersCount(),
    question: currentQ ? {
      id: currentQ.id,
      prompt: currentQ.prompt,
      image: currentQ.image,
      choices: currentQ.choices,
      correctChoices: currentQ.correctChoices,
      isMultiple: currentQ.correctChoices.length > 1,
      timer: currentQ.timer,
      hostNote: currentQ.hostNote,
      hint: currentQ.hint
    } : null,
    nextQuestion: nextQ ? {
      id: nextQ.id,
      prompt: nextQ.prompt,
      image: nextQ.image,
      choices: nextQ.choices,
      correctChoices: nextQ.correctChoices
    } : null,
    distribution: calculateAnswerDistribution(),
    leaderboard: getLeaderboard(10),
    allPlayers: Object.values(gameState.players).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isConnected: p.isConnected,
      hasAnswered: !!(p.currentAnswer && p.currentAnswer.choices && p.currentAnswer.choices.length > 0)
    }))
  };
}

function broadcastFullState() {
  io.sockets.sockets.forEach(socket => {
    if (socket.guestId) {
      socket.emit('guest_state', getGuestView(socket.guestId));
    }
  });
  io.to('display').emit('display_state', getDisplayView());
  io.to('admin').emit('admin_state', getAdminView());
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startQuestionTimer() {
  stopTimer();
  gameState.isTimerPaused = false;
  gameState.questionStartTime = Date.now();

  timerInterval = setInterval(() => {
    if (gameState.isTimerPaused) return;

    if (gameState.timeRemaining > 0) {
      gameState.timeRemaining--;
      io.to('display').emit('timer_tick', {
        timeRemaining: gameState.timeRemaining,
        totalQuestionTime: gameState.totalQuestionTime
      });
      io.to('admin').emit('timer_tick', {
        timeRemaining: gameState.timeRemaining,
        totalQuestionTime: gameState.totalQuestionTime
      });
      io.to('guests').emit('timer_tick', {
        timeRemaining: gameState.timeRemaining,
        totalQuestionTime: gameState.totalQuestionTime
      });

      if (gameState.timeRemaining <= 0) {
        stopTimer();
        handleReveal();
      }
    }
  }, 1000);
}

function handleReveal() {
  stopTimer();
  gameState.status = 'REVEAL';

  const currentQ = getCurrentQuestion();
  if (currentQ) {
    const correctSet = new Set(currentQ.correctChoices);
    const totalCorrect = correctSet.size;

    // Calculate and apply points
    Object.values(gameState.players).forEach(p => {
      if (p.currentAnswer && p.currentAnswer.choices && p.currentAnswer.choices.length > 0) {
        const playerChoices = p.currentAnswer.choices || [];
        const correctCount = playerChoices.filter(c => correctSet.has(c)).length;
        const wrongCount = playerChoices.filter(c => !correctSet.has(c)).length;

        const fraction = Math.max(0, (correctCount - wrongCount) / totalCorrect);
        
        if (fraction > 0) {
          const speedFactor = Math.min(1, Math.max(0, p.currentAnswer.timeTaken / (gameState.totalQuestionTime || 20)));
          const maxPoints = Math.round(1000 * (1 - speedFactor * 0.5));
          p.currentAnswer.pointsEarned = Math.round(maxPoints * fraction);
          p.score = (p.score || 0) + p.currentAnswer.pointsEarned;
        } else {
          p.currentAnswer.pointsEarned = 0;
        }
      } else {
        if (p.currentAnswer) p.currentAnswer.pointsEarned = 0;
      }
    });
  }

  broadcastFullState();
}

// ==========================================
// HTTP ROUTES & API
// ==========================================

// Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/builder', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'builder.html'));
});

// Image Upload Endpoint (Multer)
app.post('/api/upload', (req, res) => {
  uploadImage.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl, filename: req.file.filename });
  });
});

// Get Quiz Data for Builder
app.get('/api/quiz/data', (req, res) => {
  res.json({
    title: gameState.title,
    theme: gameState.theme || 'quizz-moderne',
    questions: gameState.questions
  });
});

// 1. Export Quiz JSON (Text only)
app.get('/api/quiz/export/json', (req, res) => {
  const exportData = {
    title: gameState.title,
    theme: gameState.theme || 'quizz-moderne',
    exportedAt: new Date().toISOString(),
    version: '2.0',
    questions: gameState.questions
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="quiz.json"');
  res.send(JSON.stringify(exportData, null, 2));
});

// Backward compatible export
app.get('/api/quiz/export', (req, res) => {
  res.redirect('/api/quiz/export/json');
});

// 2. Export Quiz ZIP (Complete Package: quiz.json + all images)
app.get('/api/quiz/export/zip', (req, res) => {
  try {
    const zip = new AdmZip();

    const quizMetadata = {
      title: gameState.title,
      theme: gameState.theme || 'quizz-moderne',
      exportedAt: new Date().toISOString(),
      version: '2.0',
      questions: gameState.questions
    };

    // Add quiz.json
    zip.addFile('quiz.json', Buffer.from(JSON.stringify(quizMetadata, null, 2), 'utf-8'));

    // Add all referenced images from /uploads
    const addedFiles = new Set();
    gameState.questions.forEach(q => {
      if (q.image && q.image.startsWith('/uploads/')) {
        const filename = path.basename(q.image);
        const diskPath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(diskPath) && !addedFiles.has(filename)) {
          zip.addLocalFile(diskPath, 'uploads');
          addedFiles.add(filename);
        }
      }
    });

    const zipBuffer = zip.toBuffer();
    const cleanTitle = (gameState.title || 'quiz').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="quiz_${cleanTitle}_complet.zip"`);
    res.send(zipBuffer);
  } catch (err) {
    console.error('Erreur export ZIP:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du ZIP : ' + err.message });
  }
});

// 3. Import Quiz JSON (Text only)
app.post('/api/quiz/import/json', (req, res) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
      return res.status(400).json({ error: 'Structure JSON invalide : tableau de questions requis.' });
    }

    const sanitizedQuestions = data.questions.map((q, idx) => normalizeQuestion(q, idx));

    gameState.title = data.title || gameState.title;
    gameState.theme = data.theme || 'quizz-moderne';
    gameState.questions = sanitizedQuestions;
    gameState.currentQuestionIndex = 0;
    gameState.status = 'LOBBY';

    // Clear answers
    Object.values(gameState.players).forEach(p => {
      p.score = 0;
      p.currentAnswer = null;
    });

    broadcastFullState();
    res.json({ success: true, count: sanitizedQuestions.length, title: gameState.title, theme: gameState.theme });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'importation : ' + error.message });
  }
});

// Backward compatible import
app.post('/api/quiz/import', (req, res) => {
  return app._router.handle({ ...req, url: '/api/quiz/import/json', originalUrl: '/api/quiz/import/json' }, res);
});

// 4. Import Quiz ZIP (Complete Package: restores quiz.json + images into /uploads)
app.post('/api/quiz/import/zip', uploadZip.single('zipfile'), (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Aucun fichier ZIP fourni.' });
    }

    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();

    let quizJsonEntry = null;
    zipEntries.forEach(entry => {
      if (entry.entryName === 'quiz.json' || entry.name === 'quiz.json') {
        quizJsonEntry = entry;
      }
    });

    if (!quizJsonEntry) {
      return res.status(400).json({ error: 'Le fichier ZIP ne contient pas de quiz.json valide.' });
    }

    // Extract all image files directly into /uploads/
    zipEntries.forEach(entry => {
      if (!entry.isDirectory && entry.name !== 'quiz.json') {
        const destPath = path.join(UPLOADS_DIR, entry.name);
        fs.writeFileSync(destPath, entry.getData());
      }
    });

    // Parse quiz.json
    const rawJson = quizJsonEntry.getData().toString('utf8');
    const data = JSON.parse(rawJson);

    if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
      return res.status(400).json({ error: 'quiz.json dans le ZIP ne contient pas de questions valides.' });
    }

    const sanitizedQuestions = data.questions.map((q, idx) => normalizeQuestion(q, idx));

    gameState.title = data.title || gameState.title;
    gameState.theme = data.theme || 'quizz-moderne';
    gameState.questions = sanitizedQuestions;
    gameState.currentQuestionIndex = 0;
    gameState.status = 'LOBBY';

    // Clear answers
    Object.values(gameState.players).forEach(p => {
      p.score = 0;
      p.currentAnswer = null;
    });

    broadcastFullState();
    res.json({ success: true, count: sanitizedQuestions.length, title: gameState.title, theme: gameState.theme });
  } catch (err) {
    console.error('Erreur import ZIP:', err);
    res.status(500).json({ error: 'Erreur lors de l\'extraction du ZIP : ' + err.message });
  }
});

// Save Questions & Theme from Builder
app.post('/api/quiz/save', (req, res) => {
  try {
    const { title, theme, questions } = req.body;
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Liste de questions invalide' });
    }

    gameState.title = title || gameState.title;
    gameState.theme = theme || gameState.theme || 'quizz-moderne';
    gameState.questions = questions.map((q, idx) => normalizeQuestion(q, idx));
    broadcastFullState();
    res.json({ success: true, count: gameState.questions.length, theme: gameState.theme });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Sample Quiz
app.post('/api/quiz/sample', (req, res) => {
  gameState.questions = defaultQuestions.map((q, idx) => normalizeQuestion(q, idx));
  gameState.title = 'QuizoZozo en Direct !';
  gameState.theme = 'quizz-moderne';
  gameState.status = 'LOBBY';
  gameState.currentQuestionIndex = 0;
  Object.values(gameState.players).forEach(p => {
    p.score = 0;
    p.currentAnswer = null;
  });
  broadcastFullState();
  res.json({ success: true, questions: gameState.questions, theme: gameState.theme });
});

// ==========================================
// SOCKET.IO REALTIME ENGINE
// ==========================================

io.on('connection', (socket) => {

  // 1. Guest Registration
  socket.on('register_guest', ({ guestId, name }) => {
    if (!guestId) return;

    socket.guestId = guestId;
    socket.join('guests');

    if (!gameState.players[guestId]) {
      gameState.players[guestId] = {
        id: guestId,
        name: (name || 'Joueur').trim().substring(0, 25),
        score: 0,
        isConnected: true,
        socketId: socket.id,
        currentAnswer: null
      };
    } else {
      gameState.players[guestId].isConnected = true;
      gameState.players[guestId].socketId = socket.id;
      if (name && name.trim()) {
        gameState.players[guestId].name = name.trim().substring(0, 25);
      }
    }

    socket.emit('guest_state', getGuestView(guestId));
    io.to('display').emit('display_state', getDisplayView());
    io.to('admin').emit('admin_state', getAdminView());
  });

  // 2. Display Registration
  socket.on('register_display', () => {
    socket.join('display');
    socket.emit('display_state', getDisplayView());
  });

  // 3. Admin Registration
  socket.on('register_admin', () => {
    socket.join('admin');
    socket.emit('admin_state', getAdminView());
  });

  // 4. Guest Answer Selection (Continuous & Realtime update without locking)
  socket.on('submit_answer', ({ guestId, choices, choice }) => {
    if (gameState.status !== 'QUESTION') return;
    const player = gameState.players[guestId];
    if (!player) return;

    const currentQ = getCurrentQuestion();
    if (!currentQ) return;

    let selectedList = [];
    if (Array.isArray(choices)) {
      selectedList = choices;
    } else if (choice) {
      selectedList = [choice];
    }

    const timeTaken = Math.max(0.1, (Date.now() - (gameState.questionStartTime || Date.now())) / 1000);

    if (selectedList.length > 0) {
      player.currentAnswer = {
        choices: selectedList,
        timeTaken: parseFloat(timeTaken.toFixed(2)),
        pointsEarned: 0
      };
    } else {
      player.currentAnswer = null;
    }

    const answeredCount = getAnsweredPlayersCount();
    const connectedCount = getConnectedPlayersCount();

    io.to('admin').emit('answer_update', {
      answeredCount,
      connectedCount,
      distribution: calculateAnswerDistribution()
    });

    io.to('display').emit('answer_update', {
      answeredCount,
      connectedCount
    });
  });

  // 5. Admin Controls
  socket.on('admin_start_game', () => {
    if (gameState.questions.length === 0) return;
    gameState.currentQuestionIndex = 0;
    gameState.status = 'QUESTION';

    Object.values(gameState.players).forEach(p => {
      p.score = 0;
      p.currentAnswer = null;
    });

    const currentQ = getCurrentQuestion();
    const qTimer = currentQ ? (currentQ.timer || 20) : 20;
    gameState.timeRemaining = qTimer;
    gameState.totalQuestionTime = qTimer;

    startQuestionTimer();
    broadcastFullState();
  });

  socket.on('admin_next_question', () => {
    const nextIdx = gameState.currentQuestionIndex + 1;
    if (nextIdx < gameState.questions.length) {
      gameState.currentQuestionIndex = nextIdx;
      gameState.status = 'QUESTION';

      Object.values(gameState.players).forEach(p => {
        p.currentAnswer = null;
      });

      const currentQ = getCurrentQuestion();
      const qTimer = currentQ ? (currentQ.timer || 20) : 20;
      gameState.timeRemaining = qTimer;
      gameState.totalQuestionTime = qTimer;

      startQuestionTimer();
      broadcastFullState();
    } else {
      stopTimer();
      gameState.status = 'GAME_OVER';
      broadcastFullState();
    }
  });

  socket.on('admin_reveal_answer', () => {
    handleReveal();
  });

  socket.on('admin_show_leaderboard', () => {
    stopTimer();
    gameState.status = 'LEADERBOARD';
    broadcastFullState();
  });

  socket.on('admin_pause_timer', () => {
    gameState.isTimerPaused = true;
    io.emit('timer_paused', { isTimerPaused: true });
    io.to('admin').emit('admin_state', getAdminView());
  });

  socket.on('admin_resume_timer', () => {
    gameState.isTimerPaused = false;
    io.emit('timer_resumed', { isTimerPaused: false });
    io.to('admin').emit('admin_state', getAdminView());
  });

  socket.on('admin_add_time', ({ seconds = 10 }) => {
    gameState.timeRemaining += seconds;
    gameState.totalQuestionTime += seconds;
    io.emit('timer_tick', {
      timeRemaining: gameState.timeRemaining,
      totalQuestionTime: gameState.totalQuestionTime
    });
    io.to('admin').emit('admin_state', getAdminView());
  });

  socket.on('admin_force_end', () => {
    handleReveal();
  });

  // 6. Admin Kick Player (Moderation)
  socket.on('admin_kick_player', ({ guestId, playerId }) => {
    const targetId = guestId || playerId;
    if (!targetId || !gameState.players[targetId]) return;

    const kickedPlayer = gameState.players[targetId];
    console.log(`[MODERATION] Expulsion du joueur : ${kickedPlayer.name} (${targetId})`);

    // Delete player from gameState
    delete gameState.players[targetId];

    // Emit 'kicked' to target sockets and clean up
    io.sockets.sockets.forEach(s => {
      if (s.guestId === targetId || (kickedPlayer.socketId && s.id === kickedPlayer.socketId)) {
        s.emit('kicked', { message: 'Vous avez été exclu de la partie par l\'animateur.' });
        s.leave('guests');
        delete s.guestId;
      }
    });

    // Broadcast updated state to all screens
    broadcastFullState();
  });

  // 6. Delete / Wipe Quiz (PHYSICALLY DELETES ALL FILES IN /UPLOADS/)
  socket.on('admin_delete_quiz', async () => {
    stopTimer();

    // 1. Physically delete all files in /uploads
    try {
      if (fs.existsSync(UPLOADS_DIR)) {
        const files = await fs.promises.readdir(UPLOADS_DIR);
        for (const file of files) {
          const filePath = path.join(UPLOADS_DIR, file);
          try {
            await fs.promises.unlink(filePath);
            console.log(`[NETTOYAGE] Fichier supprimé : ${file}`);
          } catch (err) {
            console.error(`Erreur suppression fichier ${file}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('Erreur lecture dossier uploads:', err);
    }

    // 2. Reset Game State in memory
    gameState = {
      status: 'LOBBY',
      title: 'Quiz Réinitialisé',
      theme: 'quizz-moderne',
      currentQuestionIndex: 0,
      timeRemaining: 20,
      totalQuestionTime: 20,
      isTimerPaused: false,
      questionStartTime: null,
      questions: [],
      players: {},
      history: []
    };

    io.emit('quiz_wiped', { message: 'Le quiz a été totalement réinitialisé et les images supprimées.' });
    broadcastFullState();
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    if (socket.guestId && gameState.players[socket.guestId]) {
      gameState.players[socket.guestId].isConnected = false;
      io.to('display').emit('display_state', getDisplayView());
      io.to('admin').emit('admin_state', getAdminView());
    }
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 SERVEUR QUIZOZOZO DÉMARRÉ SUR LE PORT ${PORT}`);
  console.log(`📱 Page Invité (Joueurs)     : http://localhost:${PORT}/`);
  console.log(`🖥️  Page Grand Écran (Projo)  : http://localhost:${PORT}/display`);
  console.log(`🎙️  Page Régie Admin (Host)   : http://localhost:${PORT}/admin`);
  console.log(`✏️  QuizoZozo Builder         : http://localhost:${PORT}/admin/builder`);
  console.log(`====================================================`);
});
