// Display / Grand Screen Client Logic (Theme-aware & Dynamic 3-6 Choices)
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // DOM Elements
  const displayQuizTitle = document.getElementById('display-quiz-title');
  const displayConnectedCount = document.getElementById('display-connected-count');
  const displayAnsweredBadge = document.getElementById('display-answered-badge');
  const displayAnsweredCount = document.getElementById('display-answered-count');
  const displayTotalCount = document.getElementById('display-total-count');

  // Views
  const viewLobby = document.getElementById('display-view-lobby');
  const viewQuestion = document.getElementById('display-view-question');
  const viewLeaderboard = document.getElementById('display-view-leaderboard');

  // Lobby Elements
  const lobbyTitleText = document.getElementById('lobby-title-text');
  const qrcodeContainer = document.getElementById('qrcode-container');
  const joinUrlText = document.getElementById('join-url-text');
  const lobbyPlayersCount = document.getElementById('lobby-players-count');
  const lobbyPlayersGrid = document.getElementById('lobby-players-grid');

  // Question Elements
  const displayQuestionNumber = document.getElementById('display-question-number');
  const displayMultipleBadge = document.getElementById('display-multiple-badge');
  const displayTimerText = document.getElementById('display-timer-text');
  const displayTimerCircle = document.getElementById('display-timer-circle');
  const displayQuestionPrompt = document.getElementById('display-question-prompt');
  const displayImageContainer = document.getElementById('display-image-container');
  const displayQuestionImage = document.getElementById('display-question-image');
  const displayChoicesGrid = document.getElementById('display-choices-grid');

  const histogramSection = document.getElementById('display-histogram-section');
  const displayHistogramBars = document.getElementById('display-histogram-bars');

  // Podium Elements
  const leaderboardTitle = document.getElementById('leaderboard-title');
  const podiumName1 = document.getElementById('podium-name-1');
  const podiumScore1 = document.getElementById('podium-score-1');
  const podiumName2 = document.getElementById('podium-name-2');
  const podiumScore2 = document.getElementById('podium-score-2');
  const podiumName3 = document.getElementById('podium-name-3');
  const podiumScore3 = document.getElementById('podium-score-3');
  const leaderboardExtraList = document.getElementById('leaderboard-extra-list');

  // Shapes & Colors Map (3 to 6)
  const choiceMetadata = {
    A: { shape: '▲', cls: 'choice-a', color: 'var(--color-red)' },
    B: { shape: '◆', cls: 'choice-b', color: 'var(--color-blue)' },
    C: { shape: '●', cls: 'choice-c', color: 'var(--color-yellow)' },
    D: { shape: '■', cls: 'choice-d', color: 'var(--color-green)' },
    E: { shape: '★', cls: 'choice-e', color: 'var(--color-purple)' },
    F: { shape: '✦', cls: 'choice-f', color: 'var(--color-cyan)' }
  };

  // Generate Dynamic QR Code
  const joinUrl = window.location.origin + '/';
  if (joinUrlText) joinUrlText.textContent = joinUrl;

  if (qrcodeContainer) {
    qrcodeContainer.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrcodeContainer, {
        text: joinUrl,
        width: 220,
        height: 220,
        colorDark: '#0B0E14',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      qrcodeContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(joinUrl)}" alt="QR Code" style="width:220px;height:220px;border-radius:10px;">`;
    }
  }

  // Register display socket
  socket.emit('register_display');

  function showSection(sectionToShow) {
    [viewLobby, viewQuestion, viewLeaderboard].forEach(sec => {
      if (sec) {
        if (sec === sectionToShow) {
          sec.classList.remove('hidden');
        } else {
          sec.classList.add('hidden');
        }
      }
    });
  }

  function applyTheme(themeName) {
    const validTheme = themeName || 'quizz-moderne';
    document.body.dataset.theme = validTheme;
  }

  // Socket Events
  socket.on('display_state', (state) => {
    if (state.theme) applyTheme(state.theme);
    renderDisplay(state);
  });

  socket.on('timer_tick', ({ timeRemaining, totalQuestionTime }) => {
    updateTimerVisual(timeRemaining, totalQuestionTime);
  });

  socket.on('answer_update', ({ answeredCount, connectedCount }) => {
    displayAnsweredCount.textContent = answeredCount;
    displayTotalCount.textContent = connectedCount;
  });

  socket.on('quiz_wiped', () => {
    showSection(viewLobby);
  });

  function updateTimerVisual(timeRemaining, totalTime = 20) {
    if (!displayTimerText || !displayTimerCircle) return;

    displayTimerText.textContent = timeRemaining;
    const perimeter = 251.2;
    const ratio = Math.max(0, timeRemaining / (totalTime || 20));
    const offset = perimeter * (1 - ratio);
    displayTimerCircle.style.strokeDashoffset = offset;

    if (timeRemaining <= 5) {
      displayTimerCircle.style.stroke = '#EF4444';
      displayTimerText.style.color = '#EF4444';
    } else if (timeRemaining <= 10) {
      displayTimerCircle.style.stroke = '#F59E0B';
      displayTimerText.style.color = '#F59E0B';
    } else {
      displayTimerCircle.style.stroke = 'var(--text-accent)';
      displayTimerText.style.color = 'var(--text-primary)';
    }
  }

  // Main Render Function
  function renderDisplay(state) {
    displayQuizTitle.textContent = state.title || 'Grand Quiz';
    displayConnectedCount.textContent = state.connectedCount || 0;

    switch (state.status) {
      case 'LOBBY':
        displayAnsweredBadge.classList.add('hidden');
        lobbyPlayersCount.textContent = state.playersList.length;

        if (state.playersList.length === 0) {
          lobbyPlayersGrid.innerHTML = `<span style="color: var(--text-muted); font-size: 1.1rem;">En attente des premiers joueurs...</span>`;
        } else {
          lobbyPlayersGrid.innerHTML = state.playersList.map(p => `
            <div class="player-tag">
              <span>👤</span>
              <span>${p.name}</span>
            </div>
          `).join('');
        }
        showSection(viewLobby);
        break;

      case 'QUESTION':
        displayAnsweredBadge.classList.remove('hidden');
        displayAnsweredCount.textContent = state.answeredCount || 0;
        displayTotalCount.textContent = state.connectedCount || 0;

        displayQuestionNumber.textContent = `Question ${state.currentQuestionIndex + 1} / ${state.totalQuestions}`;
        histogramSection.classList.add('hidden');

        if (state.question) {
          displayQuestionPrompt.textContent = state.question.prompt;

          if (state.question.isMultiple) {
            displayMultipleBadge.classList.remove('hidden');
          } else {
            displayMultipleBadge.classList.add('hidden');
          }

          if (state.question.image) {
            displayQuestionImage.src = state.question.image;
            displayImageContainer.classList.remove('hidden');
          } else {
            displayImageContainer.classList.add('hidden');
          }

          renderChoicesGrid(state.question.choices);
        }

        updateTimerVisual(state.timeRemaining, state.totalQuestionTime);
        showSection(viewQuestion);
        break;

      case 'REVEAL':
        displayAnsweredBadge.classList.add('hidden');
        histogramSection.classList.remove('hidden');

        // Highlight correct choices and dim others
        if (state.correctChoices && Array.isArray(state.correctChoices)) {
          const correctSet = new Set(state.correctChoices);
          document.querySelectorAll('#display-choices-grid .choice-btn').forEach(btn => {
            const id = btn.dataset.choiceId;
            if (correctSet.has(id)) {
              btn.classList.add('correct-highlight');
            } else {
              btn.classList.add('dimmed');
            }
          });
        }

        renderHistogram(state.question ? state.question.choices : [], state.distribution);
        showSection(viewQuestion);
        break;

      case 'LEADERBOARD':
      case 'GAME_OVER':
        displayAnsweredBadge.classList.add('hidden');
        if (state.status === 'GAME_OVER') {
          leaderboardTitle.textContent = '🎉 PODIUM FINAL DE LA PARTIE !';
          if (window.launchConfetti) window.launchConfetti(5000);
        } else {
          leaderboardTitle.textContent = '🏆 Classement Provisoire (Top 5)';
        }

        const top = state.leaderboard || [];
        
        // 1st
        podiumName1.textContent = top[0] ? top[0].name : '--';
        podiumScore1.textContent = top[0] ? `${top[0].score} pts` : '0 pts';

        // 2nd
        podiumName2.textContent = top[1] ? top[1].name : '--';
        podiumScore2.textContent = top[1] ? `${top[1].score} pts` : '0 pts';

        // 3rd
        podiumName3.textContent = top[2] ? top[2].name : '--';
        podiumScore3.textContent = top[2] ? `${top[2].score} pts` : '0 pts';

        // 4th & 5th
        const extras = top.slice(3, 5);
        if (extras.length > 0) {
          leaderboardExtraList.innerHTML = extras.map((p, idx) => `
            <div class="leaderboard-item animate-slide-up">
              <div class="flex-row items-center gap-4">
                <div class="leaderboard-rank">${idx + 4}</div>
                <div>${p.name}</div>
              </div>
              <div style="color: var(--text-accent); font-weight: 800;">${p.score} pts</div>
            </div>
          `).join('');
        } else {
          leaderboardExtraList.innerHTML = '';
        }

        showSection(viewLeaderboard);
        break;
    }
  }

  // Render choices grid for 3 to 6 choices
  function renderChoicesGrid(choices) {
    displayChoicesGrid.innerHTML = '';
    const count = choices.length;

    displayChoicesGrid.className = 'answers-grid';
    if (count === 3) displayChoicesGrid.classList.add('grid-3');
    else if (count === 5) displayChoicesGrid.classList.add('grid-5');
    else if (count === 6) displayChoicesGrid.classList.add('grid-6');

    choices.forEach(c => {
      const meta = choiceMetadata[c.id] || { shape: c.id, cls: 'choice-a' };
      const el = document.createElement('div');
      el.className = `choice-btn ${meta.cls}`;
      el.dataset.choiceId = c.id;

      el.innerHTML = `
        <div class="choice-shape">${meta.shape}</div>
        <div class="choice-text">${c.text}</div>
      `;

      displayChoicesGrid.appendChild(el);
    });
  }

  // Render dynamic histogram bars
  function renderHistogram(choices, distribution) {
    displayHistogramBars.innerHTML = '';
    const totalVotes = distribution ? (distribution.total || 0) : 0;

    choices.forEach(c => {
      const meta = choiceMetadata[c.id] || { shape: c.id, cls: 'choice-a', color: '#8B5CF6' };
      const count = distribution ? (distribution[c.id] || 0) : 0;
      const percent = totalVotes > 0 ? (count / totalVotes) : 0;
      const barHeight = Math.max(25, Math.round(percent * 140) + 25);

      const wrapper = document.createElement('div');
      wrapper.className = 'histogram-bar-wrapper';
      wrapper.innerHTML = `
        <div class="histogram-bar ${meta.cls}" style="height: ${barHeight}px;">
          ${count} (${Math.round(percent * 100)}%)
        </div>
        <div class="histogram-label" style="color: ${meta.color};">
          ${meta.shape} ${c.id}
        </div>
      `;
      displayHistogramBars.appendChild(wrapper);
    });
  }
});
