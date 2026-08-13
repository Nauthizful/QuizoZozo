// Admin Control Room Client Logic (2-Phase Workflow, Avatars, Strict Podium Progression)
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // Header & Status
  const adminStatusBadge = document.getElementById('admin-status-badge');
  const adminConnectedCount = document.getElementById('admin-connected-count');
  const adminAnsweredText = document.getElementById('admin-answered-text');
  const adminTimerText = document.getElementById('admin-timer-text');
  const adminGaugeFill = document.getElementById('admin-gauge-fill');

  // Question Card
  const adminQuestionIndex = document.getElementById('admin-question-index');
  const adminMultipleIndicator = document.getElementById('admin-multiple-indicator');
  const adminQuizTitle = document.getElementById('admin-quiz-title');
  const adminQuestionEmpty = document.getElementById('admin-question-empty');
  const adminQuestionActive = document.getElementById('admin-question-active');
  const adminQuestionPrompt = document.getElementById('admin-question-prompt');
  const adminChoicesList = document.getElementById('admin-choices-list');
  const adminCorrectChoiceText = document.getElementById('admin-correct-choice-text');
  const adminHostNoteBox = document.getElementById('admin-host-note-box');
  const adminHostNoteText = document.getElementById('admin-host-note-text');
  const adminHintBox = document.getElementById('admin-hint-box');
  const adminHintText = document.getElementById('admin-hint-text');

  // Next Question Card
  const adminNextQPrompt = document.getElementById('admin-next-q-prompt');
  const adminNextQAnswer = document.getElementById('admin-next-q-answer');

  // Players Moderation List
  const adminPlayersList = document.getElementById('admin-players-list');
  const adminPlayersBadge = document.getElementById('admin-players-badge');

  // Buttons
  const btnStartGame = document.getElementById('btn-start-game');
  const btnStartVoting = document.getElementById('btn-start-voting');
  const btnRevealAnswer = document.getElementById('btn-reveal-answer');
  const btnShowLeaderboard = document.getElementById('btn-show-leaderboard');
  const btnNextQuestion = document.getElementById('btn-next-question');

  const btnTogglePause = document.getElementById('btn-toggle-pause');
  const btnAddTime = document.getElementById('btn-add-time');
  const btnForceEnd = document.getElementById('btn-force-end');

  // Delete Modal Elements
  const btnOpenDeleteModal = document.getElementById('btn-open-delete-modal');
  const modalDeleteConfirm = document.getElementById('modal-delete-confirm');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  let currentState = null;
  let isPaused = false;

  // Register as admin
  socket.emit('register_admin');

  // Socket Events
  socket.on('admin_state', (state) => {
    currentState = state;
    renderAdmin(state);
  });

  socket.on('timer_tick', ({ timeRemaining }) => {
    if (currentState && currentState.status === 'QUESTION') {
      adminTimerText.textContent = `${timeRemaining}s`;
      if (timeRemaining <= 5) {
        adminTimerText.style.color = '#EF4444';
      } else {
        adminTimerText.style.color = '#F59E0B';
      }
    }
  });

  socket.on('answer_update', ({ answeredCount, connectedCount }) => {
    updateGauge(answeredCount, connectedCount);
  });

  socket.on('timer_paused', () => {
    isPaused = true;
    btnTogglePause.textContent = '▶️ Reprendre';
  });

  socket.on('timer_resumed', () => {
    isPaused = false;
    btnTogglePause.textContent = '⏸️ Pause';
  });

  socket.on('quiz_wiped', () => {
    adminTimerText.textContent = '0s';
    updateGauge(0, 0);
  });

  // Action Button Handlers
  btnStartGame.addEventListener('click', () => {
    socket.emit('admin_start_game');
  });

  btnStartVoting.addEventListener('click', () => {
    socket.emit('admin_start_voting');
  });

  btnRevealAnswer.addEventListener('click', () => {
    socket.emit('admin_reveal_answer');
  });

  btnShowLeaderboard.addEventListener('click', () => {
    socket.emit('admin_show_leaderboard');
  });

  btnNextQuestion.addEventListener('click', () => {
    socket.emit('admin_next_question');
  });

  btnTogglePause.addEventListener('click', () => {
    if (isPaused) {
      socket.emit('admin_resume_timer');
    } else {
      socket.emit('admin_pause_timer');
    }
  });

  btnAddTime.addEventListener('click', () => {
    socket.emit('admin_add_time', { seconds: 10 });
  });

  btnForceEnd.addEventListener('click', () => {
    socket.emit('admin_force_end');
  });

  // Delete Modal Handlers
  btnOpenDeleteModal.addEventListener('click', () => {
    modalDeleteConfirm.classList.add('show');
  });

  btnCancelDelete.addEventListener('click', () => {
    modalDeleteConfirm.classList.remove('show');
  });

  btnConfirmDelete.addEventListener('click', () => {
    socket.emit('admin_delete_quiz');
    modalDeleteConfirm.classList.remove('show');
  });

  // Gauge Progress Updater
  function updateGauge(answered, total) {
    adminAnsweredText.textContent = `${answered} / ${total} ont répondu`;
    const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
    adminGaugeFill.style.width = `${percent}%`;
  }

  // Global Kick Function exposed on window
  window.kickPlayer = (guestId, name) => {
    if (confirm(`Voulez-vous vraiment exclure le joueur « ${name} » de la partie ?`)) {
      socket.emit('admin_kick_player', { guestId });
    }
  };

  // Render Admin UI
  function renderAdmin(state) {
    adminQuizTitle.textContent = state.title || 'QuizoZozo';
    adminConnectedCount.textContent = state.connectedCount || 0;
    adminStatusBadge.textContent = state.status;
    isPaused = state.isTimerPaused;
    btnTogglePause.textContent = isPaused ? '▶️ Reprendre' : '⏸️ Pause';

    updateGauge(state.answeredCount || 0, state.connectedCount || 0);

    // Manage Action Toolbar Visibility (Strict Workflow)
    btnStartGame.classList.add('hidden');
    btnStartVoting.classList.add('hidden');
    btnRevealAnswer.classList.add('hidden');
    btnShowLeaderboard.classList.add('hidden');
    btnNextQuestion.classList.add('hidden');

    switch (state.status) {
      case 'LOBBY':
        adminStatusBadge.className = 'badge badge-info';
        adminTimerText.textContent = '--';
        adminQuestionEmpty.classList.remove('hidden');
        adminQuestionActive.classList.add('hidden');
        btnStartGame.classList.remove('hidden');
        break;

      case 'READING':
        // Phase 1: Question is shown, timer is paused, host reads question
        adminStatusBadge.className = 'badge badge-info';
        adminStatusBadge.textContent = 'LECTURE';
        adminTimerText.textContent = 'Pause';
        adminQuestionEmpty.classList.add('hidden');
        adminQuestionActive.classList.remove('hidden');
        
        btnStartVoting.classList.remove('hidden');
        btnStartVoting.textContent = '🎯 Lancer les réponses';
        renderQuestionData(state);
        break;

      case 'QUESTION':
        // Phase 2: Voting is active and timer is running
        adminStatusBadge.className = 'badge badge-warning';
        adminStatusBadge.textContent = 'VOTE EN COURS';
        adminTimerText.textContent = `${state.timeRemaining || 0}s`;
        adminQuestionEmpty.classList.add('hidden');
        adminQuestionActive.classList.remove('hidden');
        
        btnRevealAnswer.classList.remove('hidden');
        btnRevealAnswer.textContent = '👁️ Afficher la réponse';
        renderQuestionData(state);
        break;

      case 'REVEAL':
        adminStatusBadge.className = 'badge badge-success';
        adminStatusBadge.textContent = 'RÉPONSE RÉVÉLÉE';
        adminTimerText.textContent = '0s';
        adminQuestionEmpty.classList.add('hidden');
        adminQuestionActive.classList.remove('hidden');

        // STRICT FLOW: Only "Afficher le classement" (or "Afficher le Podium Final") is allowed!
        btnShowLeaderboard.classList.remove('hidden');
        if (state.isLastQuestion) {
          btnShowLeaderboard.textContent = '🏆 Afficher le Podium Final';
        } else {
          btnShowLeaderboard.textContent = '🏆 Afficher le classement';
        }
        renderQuestionData(state);
        break;

      case 'LEADERBOARD':
        adminStatusBadge.className = 'badge badge-info';
        adminStatusBadge.textContent = 'CLASSEMENT';
        adminTimerText.textContent = '--';
        btnNextQuestion.classList.remove('hidden');
        btnNextQuestion.textContent = '➡️ Question suivante';
        break;

      case 'GAME_OVER':
        adminStatusBadge.className = 'badge badge-success';
        adminStatusBadge.textContent = 'PODIUM FINAL / TERMINÉ';
        adminTimerText.textContent = 'Fin';
        break;
    }

    // Render Next Question (N+1) Card
    if (state.nextQuestion) {
      adminNextQPrompt.textContent = state.nextQuestion.prompt;
      const correctText = (state.nextQuestion.correctChoices || []).map(cid => {
        const found = state.nextQuestion.choices.find(c => c.id === cid);
        return `${cid} (${found ? found.text : ''})`;
      }).join(', ');
      adminNextQAnswer.innerHTML = `Bonne(s) réponse(s) : <strong style="color: #34D399;">${correctText}</strong>`;
    } else {
      adminNextQPrompt.textContent = 'Dernière question atteinte ou aucune question suivante.';
      adminNextQAnswer.textContent = 'Fin du quiz.';
    }

    // Render Players Moderation List
    renderPlayersList(state.allPlayers || []);
  }

  function renderPlayersList(players) {
    if (!adminPlayersList) return;

    adminPlayersBadge.textContent = `${players.length}`;

    if (players.length === 0) {
      adminPlayersList.innerHTML = `
        <div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1.25rem 0;">
          Aucun joueur connecté pour le moment.
        </div>
      `;
      return;
    }

    adminPlayersList.innerHTML = players.map(p => {
      const connIcon = p.isConnected ? '🟢' : '⚪';
      const answeredBadge = p.hasAnswered
        ? `<span style="font-size: 0.75rem; color: #34D399; font-weight: 700;">✅ Voté</span>`
        : `<span style="font-size: 0.75rem; color: var(--text-muted);">⏳ En attente</span>`;

      const avatarSvg = window.QuizoAvatar ? window.QuizoAvatar.renderSvg(p.avatar, 28) : '';
      
      let rankBadge = `<span style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); min-width: 24px;">#${p.rank || '-'}</span>`;
      if (p.rank === 1) {
        rankBadge = `<span style="font-size: 0.85rem; font-weight: 900; color: #F59E0B; min-width: 24px;">🥇 1</span>`;
      } else if (p.rank === 2) {
        rankBadge = `<span style="font-size: 0.85rem; font-weight: 900; color: #94A3B8; min-width: 24px;">🥈 2</span>`;
      } else if (p.rank === 3) {
        rankBadge = `<span style="font-size: 0.85rem; font-weight: 900; color: #D97706; min-width: 24px;">🥉 3</span>`;
      }

      return `
        <div class="player-admin-row">
          <div class="flex-row items-center gap-2" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${rankBadge}
            <span title="${p.isConnected ? 'En ligne' : 'Déconnecté'}">${connIcon}</span>
            <div style="width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; min-width: 28px;">
              ${avatarSvg}
            </div>
            <strong style="color: #FFF; font-size: 0.95rem;">${escapeHtml(p.name)}</strong>
          </div>

          <div class="flex-row items-center gap-3">
            <span style="color: var(--text-accent); font-size: 0.9rem; font-weight: 800;">${p.score || 0} pts</span>
            ${currentState && currentState.status === 'QUESTION' ? answeredBadge : ''}
            <button type="button" class="btn-kick" onclick="window.kickPlayer('${p.id}', '${escapeHtml(p.name)}')" title="Exclure ce joueur de la session">
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderQuestionData(state) {
    if (!state.question) return;

    adminQuestionIndex.textContent = `Question ${state.currentQuestionIndex + 1} / ${state.totalQuestions}`;
    if (state.question.isMultiple) {
      adminMultipleIndicator.classList.remove('hidden');
    } else {
      adminMultipleIndicator.classList.add('hidden');
    }

    adminQuestionPrompt.textContent = state.question.prompt;

    const correctSet = new Set(state.question.correctChoices || []);

    // Render Choices List (3 to 6)
    adminChoicesList.innerHTML = state.question.choices.map(c => {
      const isCorrect = correctSet.has(c.id);
      const count = state.distribution ? (state.distribution[c.id] || 0) : 0;
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 1rem; border-radius: 8px; background: ${isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)'}; border: 1px solid ${isCorrect ? '#10B981' : 'transparent'};">
          <div style="font-weight: 700; color: ${isCorrect ? '#34D399' : '#FFF'};">
            ${c.id}. ${c.text} ${isCorrect ? '✅' : ''}
          </div>
          <span style="font-size: 0.85rem; color: var(--text-secondary);">${count} vote(s)</span>
        </div>
      `;
    }).join('');

    // Highlight Box for Correct Choices
    const correctDetails = (state.question.correctChoices || []).map(cid => {
      const found = state.question.choices.find(c => c.id === cid);
      return `${cid} : ${found ? found.text : ''}`;
    }).join('  |  ');
    adminCorrectChoiceText.textContent = correctDetails || 'Aucune';

    // Host Note
    if (state.question.hostNote && state.question.hostNote.trim()) {
      adminHostNoteText.textContent = state.question.hostNote;
      adminHostNoteBox.classList.remove('hidden');
    } else {
      adminHostNoteBox.classList.add('hidden');
    }

    // Hint
    if (state.question.hint && state.question.hint.trim()) {
      adminHintText.textContent = state.question.hint;
      adminHintBox.classList.remove('hidden');
    } else {
      adminHintBox.classList.add('hidden');
    }
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
});
