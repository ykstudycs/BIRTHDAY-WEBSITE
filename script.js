/**
 * ============================================================
 * THE BIRTHDAY QUEST SPA - MAIN CONTROLLER
 * ============================================================
 */

// Global State
let currentLevel = 0;
const totalLevels = 6;

// Audio System Elements
const bgm = document.getElementById('bgm');
const vinylBtn = document.getElementById('vinyl-btn');
let audioStarted = false;

/* ============================================================
   1. AMBIENT FLOATING DUST PARTICLES (Canvas)
   ============================================================ */
const ambCanvas = document.getElementById('ambient-canvas');
const ambCtx = ambCanvas.getContext('2d');
let particles = [];

function resizeAmbCanvas() {
  ambCanvas.width = window.innerWidth;
  ambCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeAmbCanvas);
resizeAmbCanvas();

class Particle {
  constructor() {
    this.x = Math.random() * ambCanvas.width;
    this.y = Math.random() * ambCanvas.height;
    this.size = Math.random() * 2 + 0.6;
    this.speedX = Math.random() * 0.4 - 0.2;
    this.speedY = Math.random() * -0.5 - 0.2;
    this.alpha = Math.random() * 0.5 + 0.2;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.y < 0) this.y = ambCanvas.height;
    if (this.x < 0) this.x = ambCanvas.width;
    if (this.x > ambCanvas.width) this.x = 0;
  }
  draw() {
    ambCtx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    ambCtx.beginPath();
    ambCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ambCtx.fill();
  }
}

for (let i = 0; i < 45; i++) {
  particles.push(new Particle());
}

function animateParticles() {
  ambCtx.clearRect(0, 0, ambCanvas.width, ambCanvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

/* ============================================================
   2. AUDIO CONTROLLER & AUTOPLAY UNLOCK
   ============================================================ */
function startAudio() {
  if (!audioStarted) {
    bgm.play().then(() => {
      audioStarted = true;
      vinylBtn.classList.remove('paused');
    }).catch(() => {
      // Browser autoplay policy prevented initial play
    });
  }
}

window.addEventListener('pointerdown', () => {
  if (!audioStarted) startAudio();
}, { once: true });

vinylBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (bgm.paused) {
    bgm.play();
    audioStarted = true;
    vinylBtn.classList.remove('paused');
  } else {
    bgm.pause();
    vinylBtn.classList.add('paused');
  }
});

/* ============================================================
   3. PROGRESS & NAVIGATION PIPELINE
   ============================================================ */
function updateProgress(stageNum) {
  const stageText = document.getElementById('stage-text');
  const progressFill = document.getElementById('progress-bar-fill');
  stageText.innerText = `Stage ${stageNum} of ${totalLevels}`;
  const percentage = (stageNum / totalLevels) * 100;
  progressFill.style.width = `${percentage}%`;
}

function goToLevel(targetLevel) {
  const currentElem = document.getElementById(`level-${currentLevel}`);
  const targetElem = document.getElementById(`level-${targetLevel}`);
  if (!targetElem) return;

  if (currentElem) {
    currentElem.classList.remove('active');
  }
  targetElem.classList.add('active');
  currentLevel = targetLevel;
  updateProgress(targetLevel);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (targetLevel === 2) initMazeGame();
  if (targetLevel === 3) initPuzzleGame();
  if (targetLevel === 4) initRunawayTrap();
}

document.getElementById('start-quest-btn').addEventListener('click', () => {
  startAudio();
  goToLevel(1);
});

/* ============================================================
   4. LEVEL 1: CAROUSEL ENGINE
   ============================================================ */
const track = document.getElementById('carousel-track');
const slides = Array.from(track.children);
const prevBtn = document.getElementById('car-prev');
const nextBtn = document.getElementById('car-next');
const dotsNav = document.getElementById('carousel-dots');
let currentSlideIndex = 0;

slides.forEach((_, idx) => {
  const dot = document.createElement('div');
  dot.classList.add('car-dot');
  if (idx === 0) dot.classList.add('active');
  dotsNav.appendChild(dot);
});
const dots = Array.from(dotsNav.children);

function updateCarousel(index) {
  currentSlideIndex = index;
  track.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach(d => d.classList.remove('active'));
  dots[index].classList.add('active');
}

nextBtn.addEventListener('click', () => {
  let next = currentSlideIndex + 1;
  if (next >= slides.length) next = 0;
  updateCarousel(next);
});

prevBtn.addEventListener('click', () => {
  let prev = currentSlideIndex - 1;
  if (prev < 0) prev = slides.length - 1;
  updateCarousel(prev);
});

let touchStartX = 0;
let touchEndX = 0;
track.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });
track.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  if (touchStartX - touchEndX > 50) nextBtn.click();
  if (touchEndX - touchStartX > 50) prevBtn.click();
}, { passive: true });

/* ============================================================
   5. LEVEL 2: PHOTO-TOKEN MAZE GAME (FIXED)
   ============================================================ */
const mazeCanvas = document.getElementById('maze-canvas');
const mazeCtx = mazeCanvas.getContext('2d');

const tokenImg = new Image();
tokenImg.src = 'assets/images/1.jpg';
tokenImg.onload = () => {
  if (currentLevel === 2) drawMaze();
};

const mazeGrid = [
  [0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 1, 0, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 1, 0, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  [0, 0, 0, 1, 0, 0, 0, 0, 0, 2],
  [1, 1, 0, 0, 0, 1, 1, 1, 1, 1]
];

const rows = 10;
const cols = 10;
const cellSize = mazeCanvas.width / cols;
let playerPos = { x: 0, y: 0 };
let mazeWon = false;

function drawMaze() {
  mazeCtx.clearRect(0, 0, mazeCanvas.width, mazeCanvas.height);

  // 1. മതിലുകളും കേക്കും വരയ്ക്കുന്നു
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mazeGrid[r][c] === 1) {
        mazeCtx.fillStyle = '#1e293b';
        mazeCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        mazeCtx.strokeStyle = 'rgba(124, 77, 255, 0.35)';
        mazeCtx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
      } else if (mazeGrid[r][c] === 2) {
        mazeCtx.font = '20px sans-serif';
        mazeCtx.textAlign = 'center';
        mazeCtx.textBaseline = 'middle';
        mazeCtx.fillText('🎂', c * cellSize + cellSize / 2, r * cellSize + cellSize / 2);
      }
    }
  }

  // 2. ക്യാരക്ടർ ടോക്കൺ ഡ്രോയിംഗ്
  const px = playerPos.x * cellSize + cellSize / 2;
  const py = playerPos.y * cellSize + cellSize / 2;
  const radius = (cellSize / 2) - 4;

  mazeCtx.save();
  mazeCtx.beginPath();
  mazeCtx.arc(px, py, radius, 0, Math.PI * 2);
  mazeCtx.closePath();

  if (tokenImg.complete && tokenImg.naturalWidth > 0) {
    mazeCtx.clip();
    mazeCtx.drawImage(tokenImg, px - radius, py - radius, radius * 2, radius * 2);
  } else {
    mazeCtx.fillStyle = '#ff4081';
    mazeCtx.fill();
    mazeCtx.fillStyle = '#ffffff';
    mazeCtx.font = 'bold 12px sans-serif';
    mazeCtx.textAlign = 'center';
    mazeCtx.textBaseline = 'middle';
    mazeCtx.fillText('★', px, py);
  }
  mazeCtx.restore();

  // ചുറ്റുമുള്ള നിയോൺ ഗ്ലോ റിംഗ്
  mazeCtx.beginPath();
  mazeCtx.arc(px, py, radius, 0, Math.PI * 2);
  mazeCtx.lineWidth = 2.5;
  mazeCtx.strokeStyle = '#00f2fe';
  mazeCtx.stroke();
}

function movePlayer(dx, dy) {
  if (mazeWon) return;
  const newX = playerPos.x + dx;
  const newY = playerPos.y + dy;

  if (newX >= 0 && newX < cols && newY >= 0 && newY < rows) {
    if (mazeGrid[newY][newX] !== 1) {
      playerPos.x = newX;
      playerPos.y = newY;
      drawMaze();

      if (mazeGrid[newY][newX] === 2) {
        mazeWon = true;
        const msg = document.getElementById('maze-success-msg');
        if (msg) msg.classList.remove('hidden');
        if (typeof confetti === 'function') {
          confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
        }
        //setTimeout(() => goToLevel(3), 1600);
      }
    }
  }
}

function initMazeGame() {
  playerPos = { x: 0, y: 0 };
  mazeWon = false;
  const msg = document.getElementById('maze-success-msg');
  if (msg) msg.classList.add('hidden');
  drawMaze();
}

// Keyboard controls
window.addEventListener('keydown', (e) => {
  if (currentLevel !== 2) return;
  if (e.key === 'ArrowUp') movePlayer(0, -1);
  if (e.key === 'ArrowDown') movePlayer(0, 1);
  if (e.key === 'ArrowLeft') movePlayer(-1, 0);
  if (e.key === 'ArrowRight') movePlayer(1, 0);
});

// Touch D-Pad
document.getElementById('d-up').addEventListener('click', () => movePlayer(0, -1));
document.getElementById('d-down').addEventListener('click', () => movePlayer(0, 1));
document.getElementById('d-left').addEventListener('click', () => movePlayer(-1, 0));
document.getElementById('d-right').addEventListener('click', () => movePlayer(1, 0));

/* ============================================================
   6. LEVEL 3: 3x3 PHOTO PUZZLE & TROLL TIMER
   ============================================================ */
const puzzleBoard = document.getElementById('puzzle-board');
const timerDisplay = document.getElementById('puzzle-timer');
const trollModal = document.getElementById('troll-modal');
const autoSolveBtn = document.getElementById('auto-solve-btn');
const retryTimerBtn = document.getElementById('retry-timer-btn');
const nextLevel3Btn = document.getElementById('level3-next-btn');

let puzzleState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
let countdown = 45;
let timerInterval = null;
let puzzleSolved = false;

function renderPuzzle() {
  puzzleBoard.innerHTML = '';
  puzzleState.forEach((pos, idx) => {
    const tile = document.createElement('div');
    tile.classList.add('puzzle-tile');
    if (pos === 8 && !puzzleSolved) {
      tile.classList.add('empty');
    } else {
      const row = Math.floor(pos / 3);
      const col = pos % 3;
      tile.style.backgroundImage = `url('assets/images/2.jpg')`;
      tile.style.backgroundPosition = `-${col * (280 / 3)}px -${row * (280 / 3)}px`;
    }
    tile.addEventListener('click', () => onTileClick(idx));
    puzzleBoard.appendChild(tile);
  });
}

function onTileClick(index) {
  if (puzzleSolved) return;
  const blankIndex = puzzleState.indexOf(8);
  const validMoves = [index - 1, index + 1, index - 3, index + 3];

  const isAdjacent = validMoves.includes(blankIndex) &&
    !(index % 3 === 0 && blankIndex === index - 1) &&
    !(index % 3 === 2 && blankIndex === index + 1);

  if (isAdjacent) {
    [puzzleState[index], puzzleState[blankIndex]] = [puzzleState[blankIndex], puzzleState[index]];
    renderPuzzle();
    checkPuzzleSolved();
  }
}

function checkPuzzleSolved() {
  const isWon = puzzleState.every((val, index) => val === index);
  if (isWon) {
    puzzleSolved = true;
    clearInterval(timerInterval);
    if (typeof confetti === 'function') {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
    renderPuzzle();
    nextLevel3Btn.classList.remove('hidden');
  }
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    countdown--;
    timerDisplay.innerText = `⏳ സമയം: ${countdown}s`;
    if (countdown <= 0) {
      clearInterval(timerInterval);
      trollModal.classList.remove('hidden');
    }
  }, 1000);
}

function initPuzzleGame() {
  puzzleState = [1, 2, 0, 3, 4, 5, 6, 8, 7];
  countdown = 45;
  puzzleSolved = false;
  nextLevel3Btn.classList.add('hidden');
  trollModal.classList.add('hidden');
  renderPuzzle();
  startTimer();
}

retryTimerBtn.addEventListener('click', () => {
  countdown = 60;
  trollModal.classList.add('hidden');
  startTimer();
});

autoSolveBtn.addEventListener('click', () => {
  puzzleState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  puzzleSolved = true;
  clearInterval(timerInterval);
  trollModal.classList.add('hidden');
  renderPuzzle();
  if (typeof confetti === 'function') {
    confetti({ particleCount: 90, spread: 70 });
  }
  nextLevel3Btn.classList.remove('hidden');
});

/* ============================================================
   7. LEVEL 4: RUNAWAY "NO" BUTTON TRAP
   ============================================================ */
const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const trapArena = document.getElementById('trap-arena');
const trapSuccess = document.getElementById('trap-success');

function runawayNoButton() {
  const arenaWidth = trapArena.clientWidth;
  const arenaHeight = trapArena.clientHeight;
  const btnWidth = noBtn.offsetWidth;
  const btnHeight = noBtn.offsetHeight;

  const maxLeft = arenaWidth - btnWidth - 16;
  const maxTop = arenaHeight - btnHeight - 16;

  const randX = Math.max(10, Math.floor(Math.random() * maxLeft));
  const randY = Math.max(10, Math.floor(Math.random() * maxTop));

  noBtn.style.left = `${randX}px`;
  noBtn.style.top = `${randY}px`;
  noBtn.style.right = 'auto';
}

function initRunawayTrap() {
  noBtn.style.left = '';
  noBtn.style.top = '35%';
  noBtn.style.right = '12%';
  trapSuccess.classList.add('hidden');
  yesBtn.style.display = 'inline-block';
  noBtn.style.display = 'inline-block';
}

noBtn.addEventListener('mouseover', runawayNoButton);
noBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  runawayNoButton();
});

yesBtn.addEventListener('click', () => {
  yesBtn.style.display = 'none';
  noBtn.style.display = 'none';
  trapSuccess.classList.remove('hidden');
  if (typeof confetti === 'function') {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
  }
});

/* ============================================================
   8. LEVEL 5: MORSE CODE / AUDIO SECRET DECODER
   ============================================================ */
const playMorseBtn = document.getElementById('play-morse-btn');
const decodeBtn = document.getElementById('decode-btn');
const lightBeacon = document.getElementById('light-beacon');
const decodedCard = document.getElementById('decoded-card');

let audioCtx = null;
function playTelegraphTone(duration) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 650;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const morsePattern = [
  { tone: 100, wait: 120 },
  { tone: 100, wait: 120 },
  { tone: 280, wait: 140 },
  { tone: 100, wait: 350 },
  { tone: 100, wait: 120 },
  { tone: 280, wait: 140 },
  { tone: 100, wait: 350 },
  { tone: 100, wait: 120 },
  { tone: 100, wait: 350 },
  { tone: 100, wait: 350 },
  { tone: 280, wait: 140 },
  { tone: 100, wait: 350 }
];

async function triggerMorseSequence() {
  playMorseBtn.disabled = true;
  for (const step of morsePattern) {
    lightBeacon.classList.add('lit');
    playTelegraphTone(step.tone / 1000);
    await new Promise(r => setTimeout(r, step.tone));
    lightBeacon.classList.remove('lit');
    await new Promise(r => setTimeout(r, step.wait));
  }
  playMorseBtn.disabled = false;
}

playMorseBtn.addEventListener('click', triggerMorseSequence);

decodeBtn.addEventListener('click', () => {
  decodedCard.classList.remove('hidden');
  if (typeof confetti === 'function') {
    confetti({ particleCount: 70, spread: 60 });
  }
});

/* ============================================================
   9. LEVEL 6: CANDLE BLOWOUT & REPLAY
   ============================================================ */
const candle = document.getElementById('candle');
const candleHint = document.getElementById('candle-hint');
const wishRevealed = document.getElementById('wish-revealed');

candle.addEventListener('click', () => {
  if (!candle.classList.contains('extinguished')) {
    candle.classList.add('extinguished');
    candleHint.style.display = 'none';
    wishRevealed.classList.remove('hidden');

    if (typeof confetti === 'function') {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio, opts) {
        confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        }));
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }
});

function celebrateAgain() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 }
    });
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
