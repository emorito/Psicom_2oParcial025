// ---------- CONFIG ----------
const THEMES = [
  { id: 'tct',          name: 'Teoría Clásica de los Tests',          icon: '📊', desc: 'Modelo X=V+E, confiabilidad, error de medición' },
  { id: 'confiabilidad',name: 'Confiabilidad',                       icon: '🎯', desc: 'Coeficientes, SEM, intervalos de confianza' },
  { id: 'validez',      name: 'Validez',                             icon: '✅', desc: 'Evidencias de validez y amenazas' },
  { id: 'factorial',    name: 'Análisis Factorial',                  icon: '🔍', desc: 'AFE, AFC, rotaciones, cargas factoriales' },
  { id: 'baremacion',   name: 'Normalización y Baremación',         icon: '📈', desc: 'Percentiles, puntuaciones T, tablas de conversión' },
  { id: 'tri',          name: 'Teoría de Respuesta a los Ítems',    icon: '🧮', desc: 'CCI, parámetros a-b-c, función de información' }
];

// ---------- CARGA JSON GENÉRICA ----------
async function loadJSON(file) {
  const res = await fetch(`data/${file}`);
  if (!res.ok) throw new Error(`No se pudo cargar ${file}`);
  return res.json();
}

// ---------- RENDERIZADO INICIAL ----------
async function initHome() {
  const grid = document.getElementById('topics-grid');
  grid.innerHTML = '';
  for (const t of THEMES) {
    const [banco, flash] = await Promise.all([
      loadJSON(`banco_${t.id}.json`),
      loadJSON(`flashcards_${t.id}.json`)
    ]);
    // Guardamos en caché session para no volver a pedir
    sessionStorage.setItem(`banco_${t.id}`, JSON.stringify(banco));
    sessionStorage.setItem(`flashcards_${t.id}`, JSON.stringify(flash));

    const card = document.createElement('div');
    card.className = 'topic-card';
    card.innerHTML = `
      <h3><span>${t.icon}</span> ${t.name}</h3>
      <p>${t.desc}</p>
      <div class="topic-actions">
        <button class="video-btn" data-theme="${t.id}" data-yt="${t.id}">Ver video</button>
        <button class="flash-btn" data-theme="${t.id}">Flash Cards</button>
        <button class="practice-btn" data-theme="${t.id}">Practicar</button>
      </div>`;
    grid.appendChild(card);
  }
  attachHomeEvents();
}

// ---------- EVENTOS HOME ----------
function attachHomeEvents() {
  // Video
  document.querySelectorAll('.video-btn').forEach(btn =>
    btn.addEventListener('click', e => openVideoModal(e.target.dataset.yt, e.target.dataset.theme))
  );
  // Flashcards
  document.querySelectorAll('.flash-btn').forEach(btn =>
    btn.addEventListener('click', e => openFlashModal(e.target.dataset.theme))
  );
  // Práctica
  document.querySelectorAll('.practice-btn').forEach(btn =>
    btn.addEventListener('click', e => openPracticeModal(e.target.dataset.theme))
  );
  // Examen global
  document.getElementById('global-exam-btn').addEventListener('click', startGlobalExam);
  // Modales genéricos close
  document.querySelectorAll('.close-modal').forEach(btn =>
    btn.addEventListener('click', () => document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden')))
  );
  // Escape cierra modales
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  });
}

// ---------- VIDEO MODAL ----------
function openVideoModal(youtubeID, themeName) {
  const modal = document.getElementById('video-modal');
  document.getElementById('video-title').textContent = `Video - ${THEMES.find(t => t.id === themeName)?.name}`;
  document.getElementById('video-embed').innerHTML = `
    <iframe width="100%" height="315" src="https://www.youtube.com/embed/${youtubeID}" frameborder="0" allowfullscreen></iframe>`;
  modal.classList.remove('hidden');
}

// ---------- FLASHCARDS MODAL ----------
let flashArr = [], flashIdx = 0, flashTheme = '';
function openFlashModal(theme) {
  flashTheme = theme;
  flashArr = JSON.parse(sessionStorage.getItem(`flashcards_${theme}`));
  // Barajar y tomar 5
  flashArr = flashArr.sort(() => Math.random() - 0.5).slice(0, 5);
  flashIdx = 0;
  renderFlashCard();
  document.getElementById('flash-modal').classList.remove('hidden');
}
function renderFlashCard() {
  const card = flashArr[flashIdx];
  document.getElementById('flash-title').textContent = THEMES.find(t => t.id === flashTheme)?.name;
  document.getElementById('flash-container').innerHTML = `
    <div class="flashcard" id="flash-card">
      <div class="flashcard-face flashcard-front"><div>${card.front}</div></div>
      <div class="flashcard-face flashcard-back"><div>${card.back}</div></div>
    </div>`;
  document.getElementById('flash-counter').textContent = `${flashIdx + 1} / 5`;
  const fc = document.getElementById('flash-card');
  fc.classList.remove('flipped');
  fc.onclick = () => fc.classList.toggle('flipped');
  // Nav
  document.getElementById('flash-prev').onclick = () => { if (flashIdx > 0) { flashIdx--; renderFlashCard(); } };
  document.getElementById('flash-next').onclick = () => { if (flashIdx < 4) { flashIdx++; renderFlashCard(); } };
}

// ---------- PRÁCTICA MODAL ----------
let practiceTheme = '';
function openPracticeModal(theme) {
  practiceTheme = theme;
  document.getElementById('practice-modal').classList.remove('hidden');
}
document.querySelectorAll('.quantity-selector button').forEach(btn =>
  btn.addEventListener('click', e => {
    const qty = parseInt(e.target.dataset.q);
    startPractice(practiceTheme, qty);
    document.getElementById('practice-modal').classList.add('hidden');
  })
);

// ---------- PRÁCTICA QUIZ ----------
let practiceQuestions = [], practiceIndex = 0, practiceScore = 0;
async function startPractice(theme, qty) {
  const bank = JSON.parse(sessionStorage.getItem(`banco_${theme}`));
  practiceQuestions = bank.sort(() => Math.random() - 0.5).slice(0, qty);
  practiceIndex = 0; practiceScore = 0;
  showScreen('quiz-screen');
  renderPracticeQuestion();
}
function renderPracticeQuestion() {
  const q = practiceQuestions[practiceIndex];
  document.getElementById('progress-text').innerHTML = `<i class="fas fa-list-ol"></i> Pregunta ${practiceIndex + 1} / ${practiceQuestions.length}`;
  document.getElementById('progress-bar').style.width = `${(practiceIndex / practiceQuestions.length) * 100}%`;
  document.getElementById('timer-container').style.display = 'none'; // sin cronómetro
  // Aquí iría el renderizado de la pregunta (lo conectamos con tu QuestionRenderer en el siguiente paso)
  // Por ahora placeholder
  document.getElementById('question-container').innerHTML = `<div class="question-text">${q.question}</div>`;
  document.getElementById('next-btn').classList.remove('hidden');
  document.getElementById('next-btn').onclick = nextPracticeQuestion;
}
function nextPracticeQuestion() {
  practiceIndex++;
  if (practiceIndex < practiceQuestions.length) renderPracticeQuestion();
  else showPracticeResults();
}
function showPracticeResults() {
  showScreen('results-screen');
  document.getElementById('score-text').innerHTML = `<i class="fas fa-check-circle icon"></i> Tu puntaje: ${practiceScore} de ${practiceQuestions.length}`;
  // (más estadísticas en siguiente paso)
}

// ---------- MODO EXAMEN GLOBAL ----------
let examQuestions = [], examIndex = 0, examScore = 0, examTimer = null;
async function startGlobalExam() {
  // 3 ítems por cada tema → 15 totales
  const promises = THEMES.map(t => loadJSON(`banco_${t.id}.json`));
  const banks = await Promise.all(promises);
  examQuestions = [];
  banks.forEach(bank => {
    const subset = bank.sort(() => Math.random() - 0.5).slice(0, 3);
    examQuestions.push(...subset);
  });
  examQuestions = examQuestions.sort(() => Math.random() - 0.5); // mezcla final
  examIndex = 0; examScore = 0;
  showScreen('quiz-screen');
  startExamTimer();
  renderExamQuestion();
}
function startExamTimer() {
  let seconds = 30;
  const container = document.getElementById('timer-container');
  const display = document.getElementById('timer');
  container.style.display = 'flex';
  display.textContent = seconds;
  examTimer = setInterval(() => {
    seconds--;
    display.textContent = seconds;
    if (seconds < 0) {
      clearInterval(examTimer);
      nextExamQuestion(); // salta automáticamente
    }
  }, 1000);
}
function renderExamQuestion() {
  const q = examQuestions[examIndex];
  document.getElementById('progress-text').innerHTML = `<i class="fas fa-list-ol"></i> Pregunta ${examIndex + 1} / 15`;
  document.getElementById('progress-bar').style.width = `${(examIndex / 15) * 100}%`;
  document.getElementById('question-container').innerHTML = `<div class="question-text">${q.question}</div>`;
  document.getElementById('next-btn').classList.remove('hidden');
  document.getElementById('next-btn').onclick = nextExamQuestion;
}
function nextExamQuestion() {
  clearInterval(examTimer);
  examIndex++;
  if (examIndex < 15) {
    startExamTimer();
    renderExamQuestion();
  } else {
    showExamResults();
  }
}
function showExamResults() {
  showScreen('results-screen');
  document.getElementById('score-text').innerHTML = `<i class="fas fa-check-circle icon"></i> Tu puntaje: ${examScore} de 15`;
  // (más stats en siguiente paso)
}

// ---------- UTILIDADES ----------
function showScreen(id) {
  document.querySelectorAll('#start-screen, #quiz-screen, #results-screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ---------- INICIO ----------
document.addEventListener('DOMContentLoaded', initHome);

// ---------- RENDERIZADO DE PREGUNTAS (usa tu QuestionRenderer) ----------
const questionContainer = document.getElementById('question-container');
const feedbackContainer = document.getElementById('feedback-container');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const timerContainer = document.getElementById('timer-container');
const timerDisplay = document.getElementById('timer');

let currentQuestions = [], currentIndex = 0, score = 0, timerInterval = null, startTime = null, wrongAnswers = [];

// Renderiza pregunta actual
function renderQuestion() {
  const q = currentQuestions[currentIndex];
  progressText.innerHTML = `<i class="fas fa-list-ol"></i> Pregunta ${currentIndex + 1} / ${currentQuestions.length}`;
  progressBar.style.width = `${(currentIndex / currentQuestions.length) * 100}%`;
  questionContainer.innerHTML = '';
  feedbackContainer.classList.add('hidden');
  nextBtn.classList.add('hidden');

  // Usamos tu lógica de renderizado
  if (q.type === 'multiple-choice' || q.type === 'fill-in-the-blank') {
    renderMultipleChoice(q);
  } else if (q.type === 'flashcard') {
    renderFlashcardQuestion(q);
  } else if (q.type === 'association') {
    renderAssociation(q);
  }
}

/* ---------- MÚLTIPLE CHOICE / FILL BLANK ---------- */
function renderMultipleChoice(q) {
  const questionEl = document.createElement('div');
  questionEl.className = 'question-text';
  questionEl.innerHTML = `<span style="font-size: 2rem; margin-right: 15px;">${q.icon || '❓'}</span>${q.question}`;
  questionContainer.appendChild(questionEl);

  const optionsContainer = document.createElement('div');
  optionsContainer.id = 'answer-options';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.innerHTML = `<span style="font-size: 1.5rem; opacity: 0.7;">${String.fromCharCode(65 + i)}</span> <span>${opt}</span>`;
    btn.onclick = () => handleAnswer(btn, opt, q);
    optionsContainer.appendChild(btn);
  });
  questionContainer.appendChild(optionsContainer);
}

/* ---------- FLASHCARD (NO puntúa) ---------- */
function renderFlashcardQuestion(q) {
  const card = document.createElement('div');
  card.className = 'flashcard-container';
  card.innerHTML = `
    <div class="flashcard" id="flash-card">
      <div class="flashcard-face flashcard-front"><div>${q.front}</div></div>
      <div class="flashcard-face flashcard-back"><div>${q.back}</div></div>
    </div>
    <div class="flashcard-hint"><i class="fas fa-hand-pointer"></i> Haz clic para voltear</div>
  `;
  questionContainer.appendChild(card);
  const fc = card.querySelector('.flashcard');
  fc.onclick = () => fc.classList.toggle('flipped');
  nextBtn.classList.remove('hidden');
}

/* ---------- ASOCIACIÓN ---------- */
function renderAssociation(q) {
  const container = document.createElement('div');
  container.className = 'association-container';
  const leftCol = document.createElement('div');
  leftCol.className = 'association-column';
  const rightCol = document.createElement('div');
  rightCol.className = 'association-column';
  const shuffled = [...q.items2].sort(() => Math.random() - 0.5);
  q.items1.forEach((item, i) => {
    const left = document.createElement('div');
    left.className = 'assoc-item';
    left.textContent = item;
    left.dataset.key = item;
    left.addEventListener('click', () => selectAssociationItem(left, 'left'));
    leftCol.appendChild(left);

    const right = document.createElement('div');
    right.className = 'assoc-item';
    right.textContent = shuffled[i];
    right.dataset.key = shuffled[i];
    right.addEventListener('click', () => selectAssociationItem(right, 'right'));
    rightCol.appendChild(right);
  });
  container.appendChild(leftCol);
  container.appendChild(rightCol);
  questionContainer.appendChild(container);
  window.associationState = { leftSelected: null, rightSelected: null, pairs: {}, questionData: q };
}

/* ---------- SELECCIÓN ASOCIACIÓN ---------- */
function selectAssociationItem(item, side) {
  document.querySelectorAll(`.association-column .assoc-item.selected[data-side="${side}"]`).forEach(el => {
    el.classList.remove('selected');
    el.removeAttribute('data-side');
  });
  item.classList.add('selected');
  item.dataset.side = side;
  if (side === 'left') window.associationState.leftSelected = item;
  else window.associationState.rightSelected = item;
  if (window.associationState.leftSelected && window.associationState.rightSelected) {
    checkAssociation();
  }
}
function checkAssociation() {
  const state = window.associationState;
  const leftKey = state.leftSelected.dataset.key;
  const rightKey = state.rightSelected.dataset.key;
  const correct = state.questionData.answer[leftKey];
  if (rightKey === correct) {
    state.leftSelected.classList.add('correct');
    state.rightSelected.classList.add('correct');
    state.pairs[leftKey] = rightKey;
    if (Object.keys(state.pairs).length === state.questionData.items1.length) {
      handleAnswer(null, true, state.questionData);
    }
  } else {
    state.leftSelected.style.animation = 'wrongShake 0.4s ease';
    state.rightSelected.style.animation = 'wrongShake 0.4s ease';
    setTimeout(() => {
      state.leftSelected.classList.remove('selected');
      state.rightSelected.classList.remove('selected');
      state.leftSelected.style.animation = '';
      state.rightSelected.style.animation = '';
    }, 400);
  }
  state.leftSelected = null;
  state.rightSelected = null;
}

/* ---------- MANEJO DE RESPUESTA ---------- */
function handleAnswer(button, answer, questionData) {
  const isCorrect = answer === questionData.answer || answer === true;
  const shouldScore = questionData.type !== 'flashcard';
  if (questionData.type === 'multiple-choice' || questionData.type === 'fill-in-the-blank') {
    document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);
    if (isCorrect) {
      button.classList.add('correct');
      if (shouldScore) score++;
    } else {
      button.classList.add('wrong');
      if (shouldScore) {
        wrongAnswers.push({
          question: questionData.question,
          userAnswer: answer,
          correctAnswer: questionData.answer,
          explanation: questionData.explanation,
          source: questionData.source
        });
      }
      document.querySelectorAll('.answer-btn').forEach(btn => {
        if (btn.textContent === questionData.answer) btn.classList.add('correct');
      });
    }
  } else if (questionData.type === 'association') {
    if (isCorrect && shouldScore) score++;
  }
  if (shouldScore) {
    currentIndex++;
    progressBar.style.width = `${(currentIndex / currentQuestions.length) * 100}%`;
  }
  showFeedback(isCorrect, questionData, shouldScore);
  nextBtn.classList.remove('hidden');
}

/* ---------- FEEDBACK ---------- */
function showFeedback(isCorrect, questionData, shouldScore) {
  feedbackContainer.classList.remove('hidden');
  const icon = isCorrect ? '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>' : '<i class="fas fa-times-circle" style="color: var(--danger-color);"></i>';
  const text = shouldScore ? (isCorrect ? '¡Correcto!' : 'Incorrecto') : '¡Práctica completada!';
  feedbackContainer.innerHTML = `
    <div class="feedback-header">${icon} <strong>${text}</strong></div>
    <div>${questionData.explanation}</div>
    ${questionData.source ? `<div class="source">Fuente: ${questionData.source}</div>` : ''}
  `;
}

/* ---------- SIGUIENTE PREGUNTA ---------- */
nextBtn.addEventListener('click', () => {
  if (currentIndex < currentQuestions.length) {
    renderQuestion();
  } else {
    showResults();
  }
});

/* ---------- RESULTADOS ---------- */
function showResults() {
  clearInterval(timerInterval);
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  const accuracy = Math.round((score / currentQuestions.length) * 100);
  document.getElementById('results-screen').classList.remove('hidden');
  document.getElementById('quiz-screen').classList.add('hidden');
  document.getElementById('results-title').textContent = '¡Repaso completado!';
  document.getElementById('score-text').innerHTML = `<i class="fas fa-check-circle icon"></i> Tu puntaje: ${score} de ${currentQuestions.length}`;
  document.getElementById('accuracy-stat').textContent = `${accuracy}%`;
  document.getElementById('time-stat').textContent = formatTime(totalTime);
  document.getElementById('streak-stat').textContent = '0'; // lo ampliamos luego
  if (wrongAnswers.length > 0) {
    showRecommendations();
    document.getElementById('review-errors-btn').classList.remove('hidden');
  } else {
    document.getElementById('recommendations').classList.add('hidden');
    document.getElementById('review-errors-btn').classList.add('hidden');
  }
  // PDF
  document.getElementById('download-pdf-btn').onclick = () => downloadResultsPDF();
  document.getElementById('restart-btn').onclick = () => location.reload();
}

/* ---------- RECOMENDACIONES ---------- */
function showRecommendations() {
  const list = document.getElementById('recommendations-list');
  list.innerHTML = '';
  const topics = [...new Set(wrongAnswers.map(a => a.source || 'General'))];
  topics.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `Revisa los conceptos del material: <span class="source">${t}</span>`;
    list.appendChild(li);
  });
  document.getElementById('recommendations').classList.remove('hidden');
}

/* ---------- PDF ---------- */
function downloadResultsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const theme = 'Mixto'; // lo ajustamos luego
  const accuracy = Math.round((score / currentQuestions.length) * 100);
  const date = new Date().toLocaleDateString('es-ES');
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text('Resultados - Psicometría Aplicada II', 20, 30);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Fecha: ${date}`, 20, 45);
  doc.text(`Puntaje: ${score} de ${currentQuestions.length}`, 20, 55);
  doc.text(`Precisión: ${accuracy}%`, 20, 65);
  doc.text(`Tiempo: ${formatTime(Math.round((Date.now() - startTime) / 1000))}`, 20, 75);
  if (wrongAnswers.length > 0) {
    doc.text(`Errores (${wrongAnswers.length}):`, 20, 90);
    wrongAnswers.forEach((e, i) => {
      doc.setFontSize(10);
      doc.text(`${i + 1}. ${e.question.substring(0, 80)}...`, 20, 100 + i * 30);
      doc.text(`Tu respuesta: ${e.userAnswer}`, 20, 105 + i * 30);
      doc.text(`Correcta: ${e.correctAnswer}`, 20, 110 + i * 30);
    });
  } else {
    doc.text('¡Sin errores! 🎉', 20, 90);
  }
  doc.save('resultados_psicometria.pdf');
}

/* ---------- UTILIDADES ---------- */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
