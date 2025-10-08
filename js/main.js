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
