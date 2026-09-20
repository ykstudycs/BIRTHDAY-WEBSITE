/**
 * ============================================================
 * THE BIRTHDAY QUEST - FULL ENGINE & DYNAMIC CREATOR
 * ============================================================
 */

// 1. SUPABASE CREDENTIALS (നിങ്ങളുടെ Supabase Keys ഇവിടെ നൽകുക)
const SUPABASE_URL = "https://YOUR_SUPABASE_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Variables
let currentLevel = 0;
const totalLevels = 6;
let questData = null;
let cropperInstance = null;
let activeCropCallback = null;

// Temporary Arrays for Uploads
let level1Files = [];
let level6Files = [];

// Audio Context for Morse Telegraph
let audioCtx = null;

/* ============================================================
   ROUTING: BUILDER MODE vs QUEST PLAY MODE
   ============================================================ */
window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const questId = urlParams.get('id');

  if (questId) {
    // Play Mode: Load Quest from Supabase
    document.getElementById('creator-view').classList.add('hidden');
    document.getElementById('quest-view').classList.remove('hidden');
    await loadQuestData(questId);
  } else {
    // Creator Mode
    document.getElementById('creator-view').classList.remove('hidden');
    document.getElementById('quest-view').classList.add('hidden');
    initCreatorView();
  }
});

/* ============================================================
   IMAGE CROPPING CONTROLLER (CROPPER.JS)
   ============================================================ */
function openCropper(file, aspectRatio, callback) {
  const modal = document.getElementById('crop-modal');
  const cropImg = document.getElementById('cropping-image');
  const reader = new FileReader();

  reader.onload = (e) => {
    cropImg.src = e.target.result;
    modal.classList.remove('hidden');
    if (cropperInstance) cropperInstance.destroy();

    cropperInstance = new Cropper(cropImg, {
      aspectRatio: aspectRatio,
      viewMode: 1,
      autoCropArea: 0.9,
    });
    activeCropCallback = callback;
  };
  reader.readAsDataURL(file);
}

document.getElementById('btn-apply-crop').addEventListener('click', () => {
  if (cropperInstance && activeCropCallback) {
    cropperInstance.getCroppedCanvas({ maxWidth: 800, maxHeight: 800 }).toBlob((blob) => {
      activeCropCallback(blob);
      document.getElementById('crop-modal').classList.add('hidden');
      cropperInstance.destroy();
    }, 'image/jpeg', 0.85);
  }
});

document.getElementById('btn-cancel-crop').addEventListener('click', () => {
  document.getElementById('crop-modal').classList.add('hidden');
  if (cropperInstance) cropperInstance.destroy();
});

/* ============================================================
   CREATOR MODE CONTROLLER & SUPABASE STORAGE UPLOADER
   ============================================================ */
let heroBlob = null;
let puzzleBlob = null;

function initCreatorView() {
  // Preset selector
  const presetSelector = document.getElementById('intro-presets');
  const introArea = document.getElementById('in-intro-content');
  presetSelector.addEventListener('change', () => {
    if (presetSelector.value === 'p1') introArea.value = "നിന്നെപ്പോലൊരു വട്ടിനെ സഹിക്കാൻ എന്നെപ്പോലെ വലിയൊരു മനസ്സ് തന്നെ വേണം! ആ പുണ്യപ്രവൃത്തി ഞാൻ ഇനിയും തുടരും... Happy Birthday!";
    if (presetSelector.value === 'p2') introArea.value = "ഓരോ ചിത്രത്തിനും പറയാൻ ഒരു കഥയുണ്ട്... നമ്മുടെ സൗഹൃദം എന്നും ഇങ്ങനെ തന്നെ തിളങ്ങി നിൽക്കട്ടെ! 🎂✨";
    if (presetSelector.value === 'p3') introArea.value = "ഇന്ന് നിന്റെ ദിനമാണ്! നിനക്കായി ഒരുക്കിയ ചെറിയൊരു രഹസ്യ ലോകത്തേക്ക് സ്വാഗതം. ലെവലുകൾ പൂർത്തിയാക്കി സമ്മാനം നേടൂ! 🚀";
  });

  // Hero Crop (1:1)
  document.getElementById('in-hero-file').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      openCropper(e.target.files[0], 1, (blob) => {
        heroBlob = blob;
        const prev = document.getElementById('crop-preview-hero');
        prev.src = URL.createObjectURL(blob);
        prev.classList.remove('hidden');
      });
    }
  });

  // Level 1 Multi-file selection & Preview
  const l1Input = document.getElementById('in-level1-files');
  const l1Grid = document.getElementById('slideshow-preview-grid');
  l1Input.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(f => level1Files.push(f));
    renderPreviewGrid(level1Files, l1Grid);
  });

  // Puzzle Image Crop (1:1)
  document.getElementById('in-level3-file').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      openCropper(e.target.files[0], 1, (blob) => {
        puzzleBlob = blob;
        const prev = document.getElementById('crop-preview-puzzle');
        prev.src = URL.createObjectURL(blob);
        prev.classList.remove('hidden');
      });
    }
  });

  // Level 6 Polaroids
  const l6Input = document.getElementById('in-level6-files');
  const l6Grid = document.getElementById('polaroid-preview-grid');
  l6Input.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(f => level6Files.push(f));
    renderPreviewGrid(level6Files, l6Grid);
  });

  // Form Submit
  document.getElementById('quest-form').addEventListener('submit', handleFormSubmit);
}

function renderPreviewGrid(arr, container) {
  container.innerHTML = '';
  arr.forEach((file, idx) => {
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = `<img src="${URL.createObjectURL(file)}"/><button type="button" class="btn-del-img">&times;</button>`;
    div.querySelector('.btn-del-img').addEventListener('click', () => {
      arr.splice(idx, 1);
      renderPreviewGrid(arr, container);
    });
    container.appendChild(div);
  });
}

// Upload Helper to Supabase Storage
async function uploadToStorage(fileOrBlob, folder = 'uploads') {
  if (!fileOrBlob) return null;
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const { data, error } = await supabaseClient.storage.from('quest-media').upload(fileName, fileOrBlob);
  if (error) {
    console.error('Storage Error:', error);
    return null;
  }
  const { data: publicUrlData } = supabaseClient.storage.from('quest-media').getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-create-quest');
  btn.disabled = true;
  btn.innerText = 'അപ്‌ലോഡ് ചെയ്യുന്നു... ദയവായി കാത്തിരിക്കൂ ⏳';

  try {
    // 1. Upload Hero Image & Puzzle Image
    const heroUrl = await uploadToStorage(heroBlob || document.getElementById('in-hero-file').files[0], 'avatars');
    const puzzleUrl = await uploadToStorage(puzzleBlob || document.getElementById('in-level3-file').files[0], 'puzzles');
    
    // 2. Upload BGM
    let bgmUrl = null;
    const bgmFile = document.getElementById('in-bgm-file').files[0];
    if (bgmFile) bgmUrl = await uploadToStorage(bgmFile, 'audio');

    // 3. Upload Level 1 Images
    const l1Urls = [];
    for (const f of level1Files) {
      const url = await uploadToStorage(f, 'slideshow');
      if (url) l1Urls.push(url);
    }

    // 4. Upload Level 6 Polaroids
    const l6Urls = [];
    for (const f of level6Files) {
      const url = await uploadToStorage(f, 'polaroids');
      if (url) l6Urls.push(url);
    }

    // 5. Insert Record to Supabase
    const payload = {
      star_name: document.getElementById('in-star-name').value,
      sender_name: document.getElementById('in-sender-name').value,
      sender_email: document.getElementById('in-sender-email').value,
      hero_image: heroUrl,
      bgm_url: bgmUrl,
      intro_content: document.getElementById('in-intro-content').value,
      level1_images: l1Urls,
      level1_note: document.getElementById('in-level1-note').value,
      level2_intro: document.getElementById('in-level2-intro').value,
      level2_success: document.getElementById('in-level2-success').value,
      level3_image: puzzleUrl,
      level3_desc: document.getElementById('in-level3-desc').value,
      level4_question: document.getElementById('in-level4-question').value,
      level5_secret_word: (document.getElementById('in-level5-word').value || 'SWEET HEART').toUpperCase(),
      level6_letter: document.getElementById('in-level6-letter').value,
      level6_polaroids: l6Urls
    };

    const { data, error } = await supabaseClient.from('quests').insert([payload]).select().single();
    if (error) throw error;

    // Generated Link
    const generatedUrl = `${window.location.origin}${window.location.pathname}?id=${data.id}`;
    alert(`🎉 നിങ്ങളുടെ ബർത്ത്‌ഡേ ക്വസ്റ്റ് റെഡി!\n\nഈ ലിങ്ക് കോപ്പി ചെയ്ത് സുഹൃത്തിന് അയച്ചു കൊടുക്കൂ:\n${generatedUrl}`);
    window.location.href = generatedUrl;

  } catch (err) {
    alert('അപ്‌ലോഡ് ചെയ്യുന്നതിൽ തടസ്സമുണ്ടായി. വീണ്ടും ശ്രമിക്കുക: ' + err.message);
    btn.disabled = false;
    btn.innerText = 'Quest ലിങ്ക് ജനറേറ്റ് ചെയ്യുക 🚀';
  }
}

/* ============================================================
   PLAY MODE: DATA LOADER & LEVEL CONTROLLER
   ============================================================ */
async function loadQuestData(id) {
  const { data, error } = await supabaseClient.from('quests').select('*').eq('id', id).single();
  if (error || !data) {
    alert('ക്വസ്റ്റ് കണ്ടെത്താനായില്ല!');
    return;
  }
  questData = data;
  bindQuestToDOM();
}

function bindQuestToDOM() {
  document.getElementById('display-star-name').innerText = questData.star_name;
  document.getElementById('display-sender-name').innerText = questData.sender_name;
  document.getElementById('display-intro-content').innerText = questData.intro_content || '';
  if (questData.hero_image) document.getElementById('display-hero-img').src = questData.hero_image;

  // Custom BGM
  if (questData.bgm_url) {
    const bgmElem = document.getElementById('bgm');
    bgmElem.src = questData.bgm_url;
  }

  // Level 1 Slideshow Bind
  const track = document.getElementById('carousel-track');
  track.innerHTML = '';
  (questData.level1_images || []).forEach(url => {
    track.innerHTML += `<div class="carousel-slide"><img src="${url}"/></div>`;
  });
  document.getElementById('display-level1-note').innerText = questData.level1_note || '';
  initCarouselEngine();

  // Level 2 Bind
  document.getElementById('display-level2-intro').innerText = questData.level2_intro || '';
  document.getElementById('display-level2-success').innerText = questData.level2_success || '';

  // Level 3 Bind
  document.getElementById('display-level3-desc').innerText = questData.level3_desc || '';

  // Level 4 Bind
  document.getElementById('display-level4-question').innerText = questData.level4_question || '';

  // Level 5 Bind
  document.getElementById('display-secret-word').innerText = `"${questData.level5_secret_word}"`;

  // Level 6 Bind
  document.getElementById('display-level6-letter').innerText = questData.level6_letter || '';
  const polGrid = document.getElementById('display-polaroid-grid');
  polGrid.innerHTML = '';
  (questData.level6_polaroids || []).forEach(url => {
    polGrid.innerHTML += `
      <div class="polaroid-item">
        <img src="${url}" loading="lazy"/>
        <span style="font-size:0.75rem;font-weight:bold;margin-top:4px;display:block;">Sweet Memory ❤️</span>
      </div>`;
  });

  // Ambient Particles
  initAmbientDust();
}

/* ============================================================
   LEVEL 2: PHOTO RUNNER MAZE ENGINE
   ============================================================ */
const mazeCanvas = document.getElementById('maze-canvas');
const mazeCtx = mazeCanvas ? mazeCanvas.getContext('2d') : null;
const runnerImg = new Image();
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
let playerPos = { x: 0, y: 0 };
let mazeWon = false;

function initMazeGame() {
  if (questData && questData.hero_image) {
    runnerImg.src = questData.hero_image;
  }
  playerPos = { x: 0, y: 0 };
  mazeWon = false;
  document.getElementById('maze-success-msg').classList.add('hidden');
  drawMaze();
}

function drawMaze() {
  if (!mazeCtx) return;
  mazeCtx.clearRect(0, 0, 300, 300);
  const cellSize = 30;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (mazeGrid[r][c] === 1) {
        mazeCtx.fillStyle = '#1e293b';
        mazeCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      } else if (mazeGrid[r][c] === 2) {
        mazeCtx.font = '18px sans-serif';
        mazeCtx.textAlign = 'center';
        mazeCtx.fillText('🎂', c * cellSize + 15, r * cellSize + 20);
      }
    }
  }

  // Draw Avatar Token
  const px = playerPos.x * cellSize + 15;
  const py = playerPos.y * cellSize + 15;
  mazeCtx.save();
  mazeCtx.beginPath();
  mazeCtx.arc(px, py, 11, 0, Math.PI * 2);
  mazeCtx.clip();
  if (runnerImg.complete && runnerImg.naturalWidth > 0) {
    mazeCtx.drawImage(runnerImg, px - 11, py - 11, 22, 22);
  } else {
    mazeCtx.fillStyle = '#ff4081';
    mazeCtx.fill();
  }
  mazeCtx.restore();
}

function moveMazePlayer(dx, dy) {
  if (mazeWon) return;
  const nx = playerPos.x + dx;
  const ny = playerPos.y + dy;
  if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10 && mazeGrid[ny][nx] !== 1) {
    playerPos.x = nx;
    playerPos.y = ny;
    drawMaze();
    if (mazeGrid[ny][nx] === 2) {
      mazeWon = true;
      document.getElementById('maze-success-msg').classList.remove('hidden');
      confetti({ particleCount: 90, spread: 60 });
    }
  }
}

// Maze Controls
['d-up', 'd-down', 'd-left', 'd-right'].forEach(id => {
  const elem = document.getElementById(id);
  if (elem) {
    elem.addEventListener('click', () => {
      if (id === 'd-up') moveMazePlayer(0, -1);
      if (id === 'd-down') moveMazePlayer(0, 1);
      if (id === 'd-left') moveMazePlayer(-1, 0);
      if (id === 'd-right') moveMazePlayer(1, 0);
    });
  }
});

/* ============================================================
   LEVEL 3: PHOTO PUZZLE & TROLL TIMER
   ============================================================ */
let puzzleState = [1, 2, 0, 3, 4, 5, 6, 8, 7];
let timerCountdown = 45;
let puzzleTimer = null;
let puzzleSolved = false;

function initPuzzleGame() {
  puzzleState = [1, 2, 0, 3, 4, 5, 6, 8, 7];
  timerCountdown = 45;
  puzzleSolved = false;
  document.getElementById('level3-next-btn').classList.add('hidden');
  document.getElementById('troll-modal').classList.add('hidden');
  renderPuzzleBoard();
  clearInterval(puzzleTimer);
  puzzleTimer = setInterval(() => {
    timerCountdown--;
    document.getElementById('puzzle-timer').innerText = `⏳ സമയം: ${timerCountdown}s`;
    if (timerCountdown <= 0) {
      clearInterval(puzzleTimer);
      document.getElementById('troll-modal').classList.remove('hidden');
    }
  }, 1000);
}

function renderPuzzleBoard() {
  const board = document.getElementById('puzzle-board');
  board.innerHTML = '';
  const puzzleImg = questData && questData.level3_image ? questData.level3_image : 'assets/images/2.jpg';

  puzzleState.forEach((val, idx) => {
    const tile = document.createElement('div');
    tile.className = 'puzzle-tile';
    if (val === 8 && !puzzleSolved) {
      tile.classList.add('empty');
    } else {
      const r = Math.floor(val / 3);
      const c = val % 3;
      tile.style.backgroundImage = `url('${puzzleImg}')`;
      tile.style.backgroundPosition = `-${c * 90}px -${r * 90}px`;
    }
    tile.addEventListener('click', () => onTileClick(idx));
    board.appendChild(tile);
  });
}

function onTileClick(index) {
  if (puzzleSolved) return;
  const blank = puzzleState.indexOf(8);
  const valid = [index - 1, index + 1, index - 3, index + 3];
  if (valid.includes(blank) && !(index % 3 === 0 && blank === index - 1) && !(index % 3 === 2 && blank === index + 1)) {
    [puzzleState[index], puzzleState[blank]] = [puzzleState[blank], puzzleState[index]];
    renderPuzzleBoard();
    if (puzzleState.every((v, i) => v === i)) {
      puzzleSolved = true;
      clearInterval(puzzleTimer);
      confetti({ particleCount: 100, spread: 70 });
      document.getElementById('level3-next-btn').classList.remove('hidden');
      renderPuzzleBoard();
    }
  }
}

document.getElementById('auto-solve-btn').addEventListener('click', () => {
  puzzleState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  puzzleSolved = true;
  clearInterval(puzzleTimer);
  document.getElementById('troll-modal').classList.add('hidden');
  renderPuzzleBoard();
  document.getElementById('level3-next-btn').classList.remove('hidden');
});

document.getElementById('retry-timer-btn').addEventListener('click', () => {
  timerCountdown = 60;
  document.getElementById('troll-modal').classList.add('hidden');
  initPuzzleGame();
});

/* ============================================================
   LEVEL 4: EXPANDED RUNAWAY NO BUTTON
   ============================================================ */
const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const trapArena = document.getElementById('trap-arena');

function runawayNo() {
  const w = trapArena.clientWidth - noBtn.offsetWidth - 20;
  const h = trapArena.clientHeight - noBtn.offsetHeight - 20;
  const rx = Math.max(10, Math.floor(Math.random() * w));
  const ry = Math.max(10, Math.floor(Math.random() * h));
  noBtn.style.left = `${rx}px`;
  noBtn.style.top = `${ry}px`;
}
noBtn.addEventListener('mouseover', runawayNo);
noBtn.addEventListener('touchstart', (e) => { e.preventDefault(); runawayNo(); });

yesBtn.addEventListener('click', () => {
  yesBtn.style.display = 'none';
  noBtn.style.display = 'none';
  document.getElementById('trap-success').classList.remove('hidden');
  confetti({ particleCount: 90, spread: 60 });
});

/* ============================================================
   LEVEL 5: DYNAMIC TEXT TO MORSE AUDIO & BEACON
   ============================================================ */
const MORSE_MAP = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', ' ': ' '
};

function playMorseTone(duration) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

document.getElementById('play-morse-btn').addEventListener('click', async () => {
  const btn = document.getElementById('play-morse-btn');
  btn.disabled = true;
  const light = document.getElementById('light-beacon');
  const phrase = (questData.level5_secret_word || 'LOVE').toUpperCase();

  for (const char of phrase) {
    const code = MORSE_MAP[char] || '';
    for (const symbol of code) {
      if (symbol === '.') {
        light.classList.add('lit');
        playMorseTone(0.1);
        await new Promise(r => setTimeout(r, 100));
        light.classList.remove('lit');
      } else if (symbol === '-') {
        light.classList.add('lit');
        playMorseTone(0.3);
        await new Promise(r => setTimeout(r, 300));
        light.classList.remove('lit');
      }
      await new Promise(r => setTimeout(r, 120));
    }
    await new Promise(r => setTimeout(r, 300));
  }
  btn.disabled = false;
});

document.getElementById('decode-btn').addEventListener('click', () => {
  document.getElementById('decoded-card').classList.remove('hidden');
  confetti({ particleCount: 70, spread: 50 });
});

/* ============================================================
   LEVEL 6: CANDLE BLOW, FEEDBACK & CELEBRATE AGAIN
   ============================================================ */
const candle = document.getElementById('candle');
candle.addEventListener('click', () => {
  if (!candle.classList.contains('extinguished')) {
    candle.classList.add('extinguished');
    document.getElementById('flame').style.display = 'none';
    document.getElementById('candle-hint').style.display = 'none';
    document.getElementById('wish-revealed').classList.remove('hidden');
    confetti({ particleCount: 200, spread: 100 });
  }
});

// Feedback Dispatcher to Supabase
document.getElementById('btn-send-feedback').addEventListener('click', async () => {
  const fText = document.getElementById('feedback-text').value;
  if (!fText.trim()) return;

  const { error } = await supabaseClient.from('quest_feedbacks').insert([{
    quest_id: questData.id,
    feedback_text: fText
  }]);

  if (!error) {
    document.getElementById('feedback-status').classList.remove('hidden');
    document.getElementById('btn-send-feedback').disabled = true;
  }
});

function celebrateAgain() {
  confetti({ particleCount: 150, spread: 80 });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   GLOBAL NAVIGATION, AUDIO & PARTICLES
   ============================================================ */
function goToLevel(target) {
  const cur = document.getElementById(`level-${currentLevel}`);
  const nxt = document.getElementById(`level-${target}`);
  if (!nxt) return;
  if (cur) cur.classList.remove('active');
  nxt.classList.add('active');
  currentLevel = target;
  document.getElementById('stage-text').innerText = `Stage ${target} of ${totalLevels}`;
  document.getElementById('progress-bar-fill').style.width = `${(target / totalLevels) * 100}%`;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (target === 2) initMazeGame();
  if (target === 3) initPuzzleGame();
}

document.getElementById('start-quest-btn').addEventListener('click', () => {
  const bgm = document.getElementById('bgm');
  bgm.play().then(() => document.getElementById('vinyl-btn').classList.remove('paused')).catch(() => {});
  goToLevel(1);
});

// Slideshow Navigation
function initCarouselEngine() {
  const track = document.getElementById('carousel-track');
  const slides = Array.from(track.children);
  const dotsNav = document.getElementById('carousel-dots');
  dotsNav.innerHTML = '';
  let cur = 0;

  slides.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = `car-dot ${i === 0 ? 'active' : ''}`;
    dotsNav.appendChild(d);
  });

  const update = (idx) => {
    cur = idx;
    track.style.transform = `translateX(-${idx * 100}%)`;
    Array.from(dotsNav.children).forEach((d, i) => d.classList.toggle('active', i === idx));
  };

  document.getElementById('car-next').addEventListener('click', () => update((cur + 1) % slides.length));
  document.getElementById('car-prev').addEventListener('click', () => update((cur - 1 + slides.length) % slides.length));
}

// Background Floating Ambient Particles
function initAmbientDust() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let pts = Array.from({ length: 35 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    sy: -Math.random() * 0.4 - 0.2
  }));
  function anim() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    pts.forEach(p => {
      p.y += p.sy;
      if (p.y < 0) p.y = canvas.height;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(anim);
  }
  anim();
}
