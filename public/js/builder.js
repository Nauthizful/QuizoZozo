// Quiz Builder Client Logic (JSON & ZIP Full Pack Export/Import)
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const builderCountBadge = document.getElementById('builder-count-badge');
  const listCounter = document.getElementById('list-counter');
  const questionsContainer = document.getElementById('questions-container');

  const questionForm = document.getElementById('question-form');
  const formCardTitle = document.getElementById('form-card-title');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const btnSaveQuestion = document.getElementById('btn-save-question');
  const btnSaveAllServer = document.getElementById('btn-save-all-server');

  const quizTitleInput = document.getElementById('quiz-title-input');
  const quizThemeSelect = document.getElementById('quiz-theme-select');
  const questionPromptInput = document.getElementById('question-prompt-input');
  const choicesCountSelect = document.getElementById('choices-count-select');

  const choiceInputs = {
    A: document.getElementById('choice-input-a'),
    B: document.getElementById('choice-input-b'),
    C: document.getElementById('choice-input-c'),
    D: document.getElementById('choice-input-d'),
    E: document.getElementById('choice-input-e'),
    F: document.getElementById('choice-input-f')
  };

  const choiceRows = {
    A: document.getElementById('row-choice-a'),
    B: document.getElementById('row-choice-b'),
    C: document.getElementById('row-choice-c'),
    D: document.getElementById('row-choice-d'),
    E: document.getElementById('row-choice-e'),
    F: document.getElementById('row-choice-f')
  };

  const questionTimerSelect = document.getElementById('question-timer-select');
  const questionNoteInput = document.getElementById('question-note-input');
  const questionHintInput = document.getElementById('question-hint-input');

  // Image Upload Elements
  const imageDropArea = document.getElementById('image-drop-area');
  const imageFileInput = document.getElementById('image-file-input');
  const imagePreview = document.getElementById('image-preview');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const imageUploadStatus = document.getElementById('image-upload-status');
  const btnRemoveImage = document.getElementById('btn-remove-image');

  // Export / Import Elements
  const btnExportJson = document.getElementById('btn-export-json');
  const btnExportZip = document.getElementById('btn-export-zip');
  const btnImportJsonTrigger = document.getElementById('btn-import-json-trigger');
  const importJsonInput = document.getElementById('import-json-input');
  const btnImportZipTrigger = document.getElementById('btn-import-zip-trigger');
  const importZipInput = document.getElementById('import-zip-input');
  const btnLoadSample = document.getElementById('btn-load-sample');

  let currentQuestions = [];
  let currentUploadedImageUrl = null;
  let editingQuestionId = null;

  // Handle number of choices change
  function updateChoicesVisibility(count) {
    const num = parseInt(count, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    letters.forEach((lettr, idx) => {
      if (idx < num) {
        choiceRows[lettr].classList.remove('hidden');
        choiceInputs[lettr].required = true;
      } else {
        choiceRows[lettr].classList.add('hidden');
        choiceInputs[lettr].required = false;
        choiceInputs[lettr].value = '';
        const chk = document.querySelector(`input[name="correctChoices"][value="${lettr}"]`);
        if (chk) chk.checked = false;
      }
    });
  }

  choicesCountSelect.addEventListener('change', (e) => {
    updateChoicesVisibility(e.target.value);
  });

  // Load initial data from server
  async function loadQuizData() {
    try {
      const res = await fetch('/api/quiz/data');
      const data = await res.json();
      if (data) {
        quizTitleInput.value = data.title || 'QuizoZozo en Direct !';
        quizThemeSelect.value = data.theme || 'quizz-moderne';
        currentQuestions = data.questions || [];
        renderQuestionsList();
      }
    } catch (err) {
      console.error('Erreur chargement quiz:', err);
    }
  }

  // Render questions list
  function renderQuestionsList() {
    const count = currentQuestions.length;
    builderCountBadge.textContent = `${count} question(s)`;
    listCounter.textContent = `${count}`;

    if (count === 0) {
      questionsContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📝</div>
          <p style="font-size: 1.1rem;">Aucune question pour le moment.</p>
          <p style="font-size: 0.9rem;">Utilisez le formulaire pour composer votre première question.</p>
        </div>
      `;
      return;
    }

    questionsContainer.innerHTML = currentQuestions.map((q, idx) => {
      const correctList = q.correctChoices || (q.correctChoice ? [q.correctChoice] : ['A']);
      const isEditing = q.id === editingQuestionId;
      const choicesCount = q.choices ? q.choices.length : 4;

      return `
        <div class="question-card-item ${isEditing ? 'animate-pop' : ''}" style="${isEditing ? 'border-color: #8B5CF6; background: rgba(139, 92, 246, 0.15);' : ''}">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 36px; min-width: 36px;">
            <span style="font-weight: 800; font-size: 1.1rem; color: var(--text-secondary);">#${idx + 1}</span>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.moveQuestion(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} style="padding: 2px 6px; font-size: 0.75rem;">▲</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.moveQuestion(${idx}, 1)" ${idx === count - 1 ? 'disabled' : ''} style="padding: 2px 6px; font-size: 0.75rem;">▼</button>
            </div>
          </div>

          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <h3 style="font-size: 1.1rem; color: #FFF; line-height: 1.3;">${q.prompt}</h3>
              <div style="display: flex; gap: 4px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.editQuestion('${q.id}')" style="padding: 4px 8px;">✏️</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="window.deleteQuestion('${q.id}')" style="padding: 4px 8px;">🗑️</button>
              </div>
            </div>

            ${q.image ? `
              <div style="margin-bottom: 0.5rem;">
                <img src="${q.image}" alt="Illustration" style="max-height: 60px; border-radius: 6px; border: 1px solid var(--border-glass);">
              </div>
            ` : ''}

            <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.85rem; align-items: center;">
              <span class="badge badge-success">✅ ${correctList.join(', ')}</span>
              <span class="badge badge-info">🔢 ${choicesCount} choix</span>
              <span class="badge badge-warning">⏱️ ${q.timer || 20}s</span>
              ${q.hostNote ? '<span class="badge badge-info" title="' + q.hostNote + '">💡 Note</span>' : ''}
              ${q.hint ? '<span class="badge badge-info" title="' + q.hint + '">🔍 Indice</span>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Global window functions for inline onclick handlers
  window.moveQuestion = (index, delta) => {
    const targetIdx = index + delta;
    if (targetIdx >= 0 && targetIdx < currentQuestions.length) {
      const item = currentQuestions.splice(index, 1)[0];
      currentQuestions.splice(targetIdx, 0, item);
      renderQuestionsList();
      saveQuestionsToServer(false);
    }
  };

  window.deleteQuestion = (id) => {
    if (confirm('Voulez-vous supprimer cette question ?')) {
      currentQuestions = currentQuestions.filter(q => q.id !== id);
      if (editingQuestionId === id) resetForm();
      renderQuestionsList();
      saveQuestionsToServer(false);
    }
  };

  window.editQuestion = (id) => {
    const q = currentQuestions.find(item => item.id === id);
    if (!q) return;

    editingQuestionId = id;
    formCardTitle.textContent = `✏️ Modifier la question`;
    btnSaveQuestion.textContent = `💾 Mettre à jour`;
    btnCancelEdit.classList.remove('hidden');

    questionPromptInput.value = q.prompt;

    const numChoices = q.choices ? q.choices.length : 4;
    choicesCountSelect.value = numChoices;
    updateChoicesVisibility(numChoices);

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    letters.forEach((lettr, idx) => {
      if (q.choices && q.choices[idx]) {
        choiceInputs[lettr].value = q.choices[idx].text;
      } else {
        choiceInputs[lettr].value = '';
      }
    });

    const correctList = q.correctChoices || (q.correctChoice ? [q.correctChoice] : ['A']);
    document.querySelectorAll('input[name="correctChoices"]').forEach(chk => {
      chk.checked = correctList.includes(chk.value);
    });

    questionTimerSelect.value = q.timer || 20;
    questionNoteInput.value = q.hostNote || '';
    questionHintInput.value = q.hint || '';

    if (q.image) {
      currentUploadedImageUrl = q.image;
      imagePreview.src = q.image;
      imagePreview.classList.remove('hidden');
      uploadPlaceholder.classList.add('hidden');
      btnRemoveImage.classList.remove('hidden');
      imageUploadStatus.textContent = 'Image attachée';
    } else {
      clearImage();
    }

    renderQuestionsList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function resetForm() {
    editingQuestionId = null;
    formCardTitle.textContent = `➕ Ajouter une question`;
    btnSaveQuestion.textContent = `➕ Ajouter au Quiz`;
    btnCancelEdit.classList.add('hidden');
    questionForm.reset();
    choicesCountSelect.value = '4';
    updateChoicesVisibility(4);
    document.querySelectorAll('input[name="correctChoices"]').forEach((chk, i) => {
      chk.checked = (i === 0);
    });
    clearImage();
    renderQuestionsList();
  }

  btnCancelEdit.addEventListener('click', resetForm);

  // Image Upload Logic
  imageDropArea.addEventListener('click', () => {
    imageFileInput.click();
  });

  imageFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadImageFile(file);
  });

  imageDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageDropArea.style.borderColor = '#8B5CF6';
  });

  imageDropArea.addEventListener('dragleave', () => {
    imageDropArea.style.borderColor = '';
  });

  imageDropArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    imageDropArea.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadImageFile(file);
    }
  });

  async function uploadImageFile(file) {
    const formData = new FormData();
    formData.append('image', file);

    imageUploadStatus.textContent = 'Téléversement en cours...';
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        currentUploadedImageUrl = data.imageUrl;
        imagePreview.src = data.imageUrl;
        imagePreview.classList.remove('hidden');
        uploadPlaceholder.classList.add('hidden');
        btnRemoveImage.classList.remove('hidden');
        imageUploadStatus.textContent = 'Image téléversée avec succès !';
      } else {
        imageUploadStatus.textContent = 'Erreur : ' + (data.error || 'Upload impossible');
      }
    } catch (err) {
      imageUploadStatus.textContent = 'Erreur réseau lors de l\'upload';
      console.error(err);
    }
  }

  function clearImage() {
    currentUploadedImageUrl = null;
    imageFileInput.value = '';
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    btnRemoveImage.classList.add('hidden');
    imageUploadStatus.textContent = 'Aucune image sélectionnée';
  }

  btnRemoveImage.addEventListener('click', clearImage);

  // Form Submit for Add / Update Question
  questionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const numChoices = parseInt(choicesCountSelect.value, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, numChoices);

    const checkedBoxes = Array.from(document.querySelectorAll('input[name="correctChoices"]:checked'))
      .map(c => c.value)
      .filter(v => letters.includes(v));

    if (checkedBoxes.length === 0) {
      alert('Veuillez cocher au moins une bonne réponse !');
      return;
    }

    const choicesArray = letters.map(lettr => ({
      id: lettr,
      text: choiceInputs[lettr].value.trim() || `Choix ${lettr}`
    }));

    const questionObj = {
      id: editingQuestionId || `q-${Date.now()}`,
      prompt: questionPromptInput.value.trim(),
      image: currentUploadedImageUrl,
      choices: choicesArray,
      correctChoices: checkedBoxes,
      timer: parseInt(questionTimerSelect.value, 10) || 20,
      hostNote: questionNoteInput.value.trim(),
      hint: questionHintInput.value.trim()
    };

    if (editingQuestionId) {
      const idx = currentQuestions.findIndex(q => q.id === editingQuestionId);
      if (idx !== -1) {
        currentQuestions[idx] = questionObj;
      }
    } else {
      currentQuestions.push(questionObj);
    }

    renderQuestionsList();
    saveQuestionsToServer(true);
    resetForm();
  });

  // Save to Server
  async function saveQuestionsToServer(showFeedback = true) {
    try {
      const res = await fetch('/api/quiz/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quizTitleInput.value.trim() || 'QuizoZozo en Direct !',
          theme: quizThemeSelect.value || 'quizz-moderne',
          questions: currentQuestions
        })
      });
      const data = await res.json();
      if (data.success && showFeedback) {
        btnSaveAllServer.textContent = '✅ Enregistré !';
        setTimeout(() => { btnSaveAllServer.textContent = '💾 Enregistrer Tout'; }, 2000);
      }
    } catch (err) {
      console.error('Erreur sauvegarde serveur:', err);
    }
  }

  btnSaveAllServer.addEventListener('click', () => {
    saveQuestionsToServer(true);
  });

  quizThemeSelect.addEventListener('change', () => {
    saveQuestionsToServer(false);
  });

  // 1. JSON Export (Text only)
  btnExportJson.addEventListener('click', () => {
    window.location.href = '/api/quiz/export/json';
  });

  // 2. ZIP Export (Full package: quiz.json + images)
  btnExportZip.addEventListener('click', () => {
    window.location.href = '/api/quiz/export/zip';
  });

  // 3. JSON Import (Text only)
  btnImportJsonTrigger.addEventListener('click', () => {
    importJsonInput.click();
  });

  importJsonInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target.result);
        const res = await fetch('/api/quiz/import/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonContent)
        });
        const data = await res.json();
        if (data.success) {
          alert(`✅ Quiz JSON importé avec succès ! (${data.count} questions)`);
          await loadQuizData();
        } else {
          alert('Erreur lors de l\'importation : ' + data.error);
        }
      } catch (err) {
        alert('Fichier JSON invalide : ' + err.message);
      }
      importJsonInput.value = '';
    };
    reader.readAsText(file);
  });

  // 4. ZIP Import (Full package: quiz.json + images)
  btnImportZipTrigger.addEventListener('click', () => {
    importZipInput.click();
  });

  importZipInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('zipfile', file);

    try {
      const res = await fetch('/api/quiz/import/zip', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert(`📦 Package ZIP complet importé avec succès ! (${data.count} questions avec toutes leurs illustrations)`);
        await loadQuizData();
      } else {
        alert('Erreur lors de l\'importation du ZIP : ' + (data.error || 'Fichier invalide'));
      }
    } catch (err) {
      alert('Erreur réseau lors de l\'importation du ZIP : ' + err.message);
    }
    importZipInput.value = '';
  });

  // Load Sample Quiz
  btnLoadSample.addEventListener('click', async () => {
    if (confirm('Voulez-vous charger le quiz d\'exemple (remplacera les questions en cours) ?')) {
      try {
        const res = await fetch('/api/quiz/sample', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          currentQuestions = data.questions;
          quizTitleInput.value = 'QuizoZozo en Direct !';
          quizThemeSelect.value = data.theme || 'quizz-moderne';
          renderQuestionsList();
          resetForm();
        }
      } catch (err) {
        console.error(err);
      }
    }
  });

  // Initial Setup
  updateChoicesVisibility(4);
  loadQuizData();
});
