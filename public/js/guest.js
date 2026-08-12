// Guest Client Logic (Answer Text & Colors, Wake Lock API & Kick Handling)
document.addEventListener('DOMContentLoaded', () => {
  let socket = io();

  // Elements
  const viewJoin = document.getElementById('view-join');
  const viewLobby = document.getElementById('view-lobby');
  const viewQuestion = document.getElementById('view-question');
  const viewResult = document.getElementById('view-result');
  const viewGameover = document.getElementById('view-gameover');
  const viewKicked = document.getElementById('view-kicked');

  const joinForm = document.getElementById('join-form');
  const playerNameInput = document.getElementById('player-name-input');
  const lobbyPlayerName = document.getElementById('lobby-player-name');
  const btnChangeName = document.getElementById('btn-change-name');
  const btnRejoinAfterKick = document.getElementById('btn-rejoin-after-kick');

  const guestHeaderName = document.getElementById('guest-header-name');
  const guestHeaderScore = document.getElementById('guest-header-score');
  const guestGameStatus = document.getElementById('guest-game-status');

  const questionBadgeNum = document.getElementById('question-badge-num');
  const multipleBadge = document.getElementById('multiple-badge');
  const guestTimerText = document.getElementById('guest-timer-text');
  const guestChoicesContainer = document.getElementById('guest-choices-container');
  const selectionStatusBox = document.getElementById('selection-status-box');

  const resultIconContainer = document.getElementById('result-icon-container');
  const resultTitle = document.getElementById('result-title');
  const resultPoints = document.getElementById('result-points');
  const resultCorrectText = document.getElementById('result-correct-text');
  const resultYourChoiceText = document.getElementById('result-your-choice-text');
  const gameoverFinalScore = document.getElementById('gameover-final-score');

  // Color classes map (A to F)
  const choiceClasses = {
    A: 'choice-a',
    B: 'choice-b',
    C: 'choice-c',
    D: 'choice-d',
    E: 'choice-e',
    F: 'choice-f'
  };

  // Local Storage State
  let guestId = localStorage.getItem('quiz_guest_id');
  let playerName = localStorage.getItem('quiz_guest_name');
  let selectedChoices = [];
  let currentServerState = null;
  let isKicked = false;

  // Generate UUID if not present
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    localStorage.setItem('quiz_guest_id', guestId);
  }

  // ==========================================
  // WAKE LOCK API (Anti-veille écran smartphone)
  // ==========================================
  let wakeLockSentinel = null;

  async function requestWakeLock() {
    if ('wakeLock' in navigator && !isKicked) {
      try {
        if (!wakeLockSentinel) {
          wakeLockSentinel = await navigator.wakeLock.request('screen');
          console.log('⚡ [WAKE LOCK] Écran verrouillé actif (anti-veille)');
          wakeLockSentinel.addEventListener('release', () => {
            console.log('⚡ [WAKE LOCK] Écran relâché');
            wakeLockSentinel = null;
          });
        }
      } catch (err) {
        console.warn('⚠️ [WAKE LOCK] Requête ignorée ou non autorisée :', err.name, err.message);
      }
    }
  }

  // Auto re-acquire wake lock on visibility change
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && playerName && !isKicked) {
      await requestWakeLock();
    }
  });

  // View Switcher Helper
  function showView(viewToShow) {
    [viewJoin, viewLobby, viewQuestion, viewResult, viewGameover, viewKicked].forEach(view => {
      if (view) {
        if (view === viewToShow) {
          view.classList.remove('hidden');
        } else {
          view.classList.add('hidden');
        }
      }
    });
  }

  // Apply Theme Dynamically
  function applyTheme(themeName) {
    const validTheme = themeName || 'quizz-moderne';
    document.body.dataset.theme = validTheme;
  }

  // Initialize Connection
  function initUser() {
    if (playerName && playerName.trim()) {
      guestHeaderName.textContent = playerName;
      lobbyPlayerName.textContent = playerName;
      socket.emit('register_guest', { guestId, name: playerName });
      requestWakeLock();
    } else {
      showView(viewJoin);
    }
  }

  // Form Submit for Join
  joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredName = playerNameInput.value.trim();
    if (enteredName) {
      playerName = enteredName;
      isKicked = false;
      localStorage.setItem('quiz_guest_name', playerName);
      guestHeaderName.textContent = playerName;
      lobbyPlayerName.textContent = playerName;
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('register_guest', { guestId, name: playerName });
      requestWakeLock();
      showView(viewLobby);
    }
  });

  // Change Name Button
  btnChangeName.addEventListener('click', () => {
    localStorage.removeItem('quiz_guest_name');
    playerName = null;
    playerNameInput.value = '';
    showView(viewJoin);
  });

  // Rejoin After Kick Button
  if (btnRejoinAfterKick) {
    btnRejoinAfterKick.addEventListener('click', () => {
      isKicked = false;
      guestId = 'guest_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      localStorage.setItem('quiz_guest_id', guestId);
      localStorage.removeItem('quiz_guest_name');
      playerName = null;
      playerNameInput.value = '';
      guestHeaderScore.textContent = '0';
      guestHeaderName.textContent = 'Joueur';
      if (!socket.connected) {
        socket.connect();
      }
      showView(viewJoin);
    });
  }

  // Socket Events
  socket.on('guest_state', (state) => {
    if (isKicked) return;
    currentServerState = state;
    if (state.theme) applyTheme(state.theme);
    renderState(state);
  });

  socket.on('timer_tick', ({ timeRemaining }) => {
    if (isKicked) return;
    if (guestTimerText) {
      guestTimerText.textContent = `${timeRemaining}s`;
      if (timeRemaining <= 5) {
        guestTimerText.style.color = '#EF4444';
      } else {
        guestTimerText.style.color = '';
      }
    }
  });

  // Kick Event Handler (Moderation)
  socket.on('kicked', ({ message }) => {
    console.warn('[MODERATION] Vous avez été exclu :', message);
    isKicked = true;

    // Release wake lock
    if (wakeLockSentinel) {
      try { wakeLockSentinel.release(); } catch (e) {}
      wakeLockSentinel = null;
    }

    // Clear local storage data
    localStorage.removeItem('quiz_guest_id');
    localStorage.removeItem('quiz_guest_name');
    playerName = null;

    guestGameStatus.textContent = 'Exclu';
    guestGameStatus.className = 'badge badge-danger';

    showView(viewKicked);

    // Disconnect socket
    socket.disconnect();
  });

  socket.on('quiz_wiped', () => {
    if (isKicked) return;
    localStorage.removeItem('quiz_guest_name');
    playerName = null;
    guestHeaderScore.textContent = '0';
    showView(viewJoin);
  });

  // Main UI Renderer
  function renderState(state) {
    if (isKicked) return;

    if (!playerName) {
      showView(viewJoin);
      return;
    }

    if (state.player) {
      guestHeaderScore.textContent = state.player.score || 0;
    }

    switch (state.status) {
      case 'LOBBY':
        selectedChoices = [];
        guestGameStatus.textContent = 'En attente';
        guestGameStatus.className = 'badge badge-info';
        showView(viewLobby);
        break;

      case 'QUESTION':
        guestGameStatus.textContent = 'En direct';
        guestGameStatus.className = 'badge badge-warning';

        questionBadgeNum.textContent = `Question ${state.currentQuestionIndex + 1}/${state.totalQuestions}`;
        guestTimerText.textContent = `${state.timeRemaining}s`;

        if (state.player && state.player.selectedChoices) {
          selectedChoices = state.player.selectedChoices;
        }

        if (state.question) {
          if (state.question.isMultiple) {
            multipleBadge.classList.remove('hidden');
            multipleBadge.textContent = 'Plusieurs choix';
          } else {
            multipleBadge.classList.add('hidden');
          }

          // Render Choice Buttons (Text & Colors only, NO symbols)
          renderChoiceButtons(state.question.choices, state.question.isMultiple);
          updateStatusIndicator(state.question.isMultiple);
        }

        showView(viewQuestion);
        break;

      case 'REVEAL':
        guestGameStatus.textContent = 'Résultats';
        guestGameStatus.className = 'badge badge-success';
        
        if (state.reveal) {
          const currentChoices = (state.question && state.question.choices) ? state.question.choices : [];
          
          const correctFormatted = state.reveal.correctChoices.map(cid => {
            const found = currentChoices.find(c => c.id === cid);
            return found ? `${found.text}` : `Choix ${cid}`;
          }).join('  |  ');
          resultCorrectText.textContent = correctFormatted || state.reveal.correctChoices.join(', ');

          const yourFormatted = state.reveal.selectedChoices && state.reveal.selectedChoices.length > 0
            ? state.reveal.selectedChoices.map(cid => {
                const found = currentChoices.find(c => c.id === cid);
                return found ? `${found.text}` : `Choix ${cid}`;
              }).join('  |  ')
            : 'Aucun choix sélectionné';
          resultYourChoiceText.textContent = `Votre vote : ${yourFormatted}`;

          if (state.reveal.isCorrect) {
            resultIconContainer.textContent = '🎉';
            resultTitle.textContent = 'Excellente réponse !';
            resultTitle.style.color = '#34D399';
            resultPoints.textContent = `+${state.reveal.pointsEarned} pts`;
            resultPoints.style.color = '#34D399';
            if (window.launchConfetti) window.launchConfetti(2500);
          } else if (state.reveal.isPartial) {
            resultIconContainer.textContent = '✨';
            resultTitle.textContent = 'Partiellement correct !';
            resultTitle.style.color = '#F59E0B';
            resultPoints.textContent = `+${state.reveal.pointsEarned} pts`;
            resultPoints.style.color = '#F59E0B';
          } else {
            resultIconContainer.textContent = '❌';
            resultTitle.textContent = 'Mauvaise réponse...';
            resultTitle.style.color = '#EF4444';
            resultPoints.textContent = '+0 pt';
            resultPoints.style.color = '#EF4444';
          }

          showView(viewResult);
        } else {
          resultIconContainer.textContent = '⌛';
          resultTitle.textContent = 'Temps écoulé !';
          resultTitle.style.color = '#F59E0B';
          resultPoints.textContent = '+0 pt';
          resultCorrectText.textContent = state.reveal ? state.reveal.correctChoices.join(', ') : '';
          resultYourChoiceText.textContent = 'Votre vote : Aucun choix sélectionné';
          showView(viewResult);
        }
        break;

      case 'LEADERBOARD':
        guestGameStatus.textContent = 'Classement';
        guestGameStatus.className = 'badge badge-info';
        break;

      case 'GAME_OVER':
        guestGameStatus.textContent = 'Terminé';
        guestGameStatus.className = 'badge badge-success';
        gameoverFinalScore.textContent = state.player ? state.player.score : 0;
        showView(viewGameover);
        break;
    }
  }

  // Update status message
  function updateStatusIndicator(isMultiple) {
    if (selectedChoices.length > 0) {
      selectionStatusBox.innerHTML = `
        <span style="color: #34D399;">✅ Réponse sélectionnée enregistrée !</span>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">(Vous pouvez changer d'avis jusqu'au décompte)</div>
      `;
      selectionStatusBox.style.borderColor = '#10B981';
    } else {
      selectionStatusBox.innerHTML = isMultiple
        ? '👉 Touchez pour cocher vos réponses (modifiable jusqu\'à la fin)'
        : '👉 Touchez une réponse pour voter (modifiable jusqu\'à la fin)';
      selectionStatusBox.style.borderColor = 'var(--border-glass)';
    }
  }

  // Render choice buttons with TEXT ONLY (no shape symbols)
  function renderChoiceButtons(choices, isMultiple) {
    guestChoicesContainer.innerHTML = '';

    choices.forEach(c => {
      const cls = choiceClasses[c.id] || 'choice-a';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `guest-choice-btn ${cls}`;
      btn.dataset.choice = c.id;

      if (selectedChoices.includes(c.id)) {
        btn.classList.add('is-selected');
      }

      btn.innerHTML = `<span style="width: 100%; text-align: center;">${escapeHtml(c.text)}</span>`;

      btn.addEventListener('click', () => {
        if (currentServerState && currentServerState.status !== 'QUESTION') return;

        if (isMultiple) {
          if (selectedChoices.includes(c.id)) {
            selectedChoices = selectedChoices.filter(x => x !== c.id);
            btn.classList.remove('is-selected');
          } else {
            selectedChoices.push(c.id);
            btn.classList.add('is-selected');
          }
        } else {
          selectedChoices = [c.id];
          document.querySelectorAll('.guest-choice-btn').forEach(b => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
        }

        // Emit instant continuous choice to server
        socket.emit('submit_answer', { guestId, choices: selectedChoices });
        updateStatusIndicator(isMultiple);
      });

      guestChoicesContainer.appendChild(btn);
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Kickstart
  initUser();
});
