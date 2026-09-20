/**
 * ============================================================
 * THE BIRTHDAY QUEST - FIXED DYNAMIC SCRIPT
 * ============================================================
 */

// 1. SUPABASE CREDENTIALS (আপনার URL এবং anon public key)
const SUPABASE_URL = "https://uedytnpsodsgwtcjhjry.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_URIryt2eGjUWVjZlg5qXtQ_viYHrUHC";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Variables
let currentLevel = 0;
const totalLevels = 6;
let questData = null;
let cropperInstance = null;
let activeCropCallback = null;

// Audio element & toggle state
const bgm = document.getElementById('bgm');
const vinylBtn = document.getElementById('vinyl-btn');
let isAudioPlaying = false;

// Blobs & File Arrays
let heroBlob = null;
let puzzleBlob = null;
let level1Files = [];
let level6Files = [];

// Morse Map
const MORSE_MAP = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', ' ': '/'
};

/* ============================================================
   ROUTING: CREATOR VIEW vs QUEST VIEW
   ============================================================ */
window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const questId = urlParams.get('id');

  if (questId) {
    document.getElementById('creator-view').classList.add('hidden');
    document.getElementById('quest-view').classList.remove('hidden');
    await loadQuestData(questId);
  } else {
    document.getElementById('creator-view').classList.remove('hidden');
    document.getElementById('quest-view').classList.add('hidden');
    initCreatorView();
  }
});

/* ============================================================
   AUDIO TOGGLE CONTROLLER (PLAY / PAUSE)
   ============================================================ */
vinylBtn.addEventListener('click', () => {
  if (bgm.paused) {
    bgm.play().then(() => {
      isAudioPlaying = true;
      vinylBtn.classList.remove('paused');
    }).catch(e => console.error("Audio error:", e));
  } else {
    bgm.pause();
    isAudioPlaying = false;
    vinylBtn.classList.add('paused');
  }
});

/* ============================================================
   CREATOR MODE CONTROLLER
   ============================================================ */
function initCreatorView() {
  // Preset Message Helper
  const presetSelector = document.getElementById('intro-presets');
  const introArea = document.getElementById('in-intro-content');
  presetSelector.addEventListener('change', () => {
    if (presetSelector.value === 'p1') introArea.value = "Tumi thik koto boro boka sheta shudhu ami jani! Happy Birthday bondhu! 🎉";
    if (presetSelector.value === 'p2') introArea.value = "Chobigulor moddhe onek sundor muhurto lukiye ache... Shuvo Jonmodin! ❤️";
    if (presetSelector.value === 'p3') introArea.value = "Ajker din ta shudhu tomar! Ekta choto secret quest toiri kora holo, shob level paar koro! 🚀";
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

  // Level 1 Slideshow multi-select
  document.getElementById('in-level1-files').addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(f => level1Files.push(f));
    renderPreviewGrid(level1Files, document.getElementById('slideshow-preview-grid'));
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

  // Level 6 Polaroids multi-select
  document.getElementById('in-level6-files').addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(f => level6Files.push(f));
    renderPreviewGrid(level6Files, document.getElementById('polaroid-preview-grid'));
  });

  // Sample Data Button Filler
  document.getElementById('btn-fill-sample').addEventListener('click', fillSampleData);

  // Form Submit
  document.getElementById('quest-form').addEventListener('submit', handleFormSubmit);
}

function renderPreviewGrid(arr, container) {
  container.innerHTML = '';
  arr.forEach((item, idx) => {
    const src = typeof item === 'string' ? item : URL.createObjectURL(item);
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = `<img src="${src}"/><button type="button" class="btn-del-img">&times;</button>`;
    div.querySelector('.btn-del-img').addEventListener('click', () => {
      arr.splice(idx, 1);
      renderPreviewGrid(arr, container);
    });
    container.appendChild(div);
  });
}

// Fill Sample Data Function
function fillSampleData() {
  document.getElementById('in-star-name').value = "Riya";
  document.getElementById('in-sender-name').value = "Rahul";
  document.getElementById('in-sender-email').value = "rahul@example.com";
  document.getElementById('in-intro-content').value = "Happy Birthday Riya! Tomar jonno ekta special interactive adventure toiri korechi. Enjoy koro! ✨";
  document.getElementById('in-level1-note').value = "Amader eksathe katano shobcheye priyo muhurtogulo ekhane ache... 📸";
  document.getElementById('in-level2-intro').value = "Tomar token niye maze ta paar kore birthday cake khuje ber koro! 🎂";
  document.getElementById('in-level2-success').value = "Wah! Cake ta shobai mile khabo, eka eka na kintu! 😂";
  document.getElementById('in-level3-desc').value = "45 second somoy ache, chobi ta thik koro! ⏱️";
  document.getElementById('in-level4-question').value = "Ami ki tomar shobcheye bhalo bondhu?";
  document.getElementById('in-level5-word').value = "BEST FRIEND";
  document.getElementById('in-level6-letter').value = "Jibone onek bondhu ashe jay, kintu tomar moto manush paowa bhagger bapar. Sob somoy ei bhabe hashi khushi theko! Happy Birthday! ❤️";
  document.getElementById('bgm-preset-selector').value = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3";

  // Dummy URLs for preview
  const sampleUrls = [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500"
  ];
  level1Files = [...sampleUrls];
  level6Files = [...sampleUrls];
  renderPreviewGrid(level1Files, document.getElementById('slideshow-preview-grid'));
  renderPreviewGrid(level6Files, document.getElementById('polaroid-preview-grid'));

  alert("⚡ Sample data filled! Ekdom niche giye 'Generate Quest Link' button e click korun.");
}

/* ============================================================
   CROPPER HANDLER
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
   SUPABASE UPLOAD & FORM SUBMIT
   ============================================================ */
async function uploadToStorage(fileOrBlob, folder = 'uploads') {
  if (!fileOrBlob) return null;
  if (typeof fileOrBlob === 'string') return fileOrBlob; // Already URL
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const { error } = await supabaseClient.storage.from('quest-media').upload(fileName, fileOrBlob);
  if (error) {
    console.error('Storage Upload Error:', error);
    return null;
  }
  const { data } = supabaseClient.storage.from('quest-media').getPublicUrl(fileName);
  return data.publicUrl;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-create-quest');
  btn.disabled = true;
  btn.innerText = 'Uploading files & Generating link... ⏳';

  try {
    // 1. Upload Hero & Puzzle images
    let heroUrl = heroBlob ? await uploadToStorage(heroBlob, 'avatars') : null;
    if (!heroUrl && typeof level1Files[0] === 'string') heroUrl = level1Files[0];

    let puzzleUrl = puzzleBlob ? await uploadToStorage(puzzleBlob, 'puzzles') : null;
    if (!puzzleUrl && typeof level1Files[1] === 'string') puzzleUrl = level1Files[1];

    // 2. Audio selection (Preset or Upload)
    let finalBgmUrl = document.getElementById('bgm-preset-selector').value || null;
    const uploadedBgm = document.getElementById('in-bgm-file').files[0];
    if (uploadedBgm) {
      finalBgmUrl = await uploadToStorage(uploadedBgm, 'audio');
    }

    // 3. Upload Level 1 Slideshow images
    const l1Urls = [];
    for (const f of level1Files) {
      const url = await uploadToStorage(f, 'slideshow');
      if (url) l1Urls.push(url);
    }

    // 4. Upload Level 6 Polaroid images
    const l6Urls = [];
    for (const f of level6Files) {
      const url = await uploadToStorage(f, 'polaroids');
      if (url) l6Urls.push(url);
    }

    // 5. Save to Supabase Table
    const payload = {
      star_name: document.getElementById('in-star-name').value,
      sender_name: document.getElementById('in-sender-name').value,
      sender_email: document.getElementById('in-sender-email').value,
      hero_image: heroUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
      bgm_url: finalBgmUrl,
      intro_content: document.getElementById('in-intro-content').value,
      level1_images: l1Urls.length ? l1Urls : ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500'],
      level1_note: document.getElementById('in-level1-note').value,
      level2_intro: document.getElementById('in-level2-intro').value,
      level2_success: document.getElementById('in-level2-success').value,
      level3_image: puzzleUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      level3_desc: document.getElementById('in-level3-desc').value,
      level4_question: document.getElementById('in-level4-question').value,
      level5_secret_word: (document.getElementById('in-level5-word').value || 'SWEET HEART').toUpperCase(),
      level6_letter: document.getElementById('in-level6-letter').value,
      level6_polaroids: l6Urls.length ? l6Urls : ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500']
    };

    const { data, error } = await supabaseClient.from('quests').insert([payload]).select().single();
    if (error) throw error;

    const generatedUrl = `${window.location.origin}${window.location.pathname}?id=${data.id}`;
    
    // Open Share Modal with Copy Link Option
    const shareModal = document.getElementById('share-modal');
    const linkInput = document.getElementById('generated-link-input');
    linkInput.value = generatedUrl;
    shareModal.classList.remove('hidden');

    document.getElementById('btn-copy-link').onclick = () => {
      linkInput.select();
      navigator.clipboard.writeText(generatedUrl);
      alert('Link copied to clipboard! 🎉');
    };

    document.getElementById('btn-open-quest').onclick = () => {
      window.location.href = generatedUrl;
    };

  } catch (err) {
    alert('Upload failed: ' + err.message);
    btn.disabled = false;
    btn.innerText = 'Generate Quest Link 🚀';
  }
}

/* ============================================================
   PLAY MODE: DATA LOADER
   ============================================================ */
async function loadQuestData(id) {
  const { data, error } = await supabaseClient.from('quests').select('*').eq('id', id).single();
  if (error || !data) {
    alert('Quest not found!');
    return;
  }
  questData = data;
  bindQuestToDOM();
}

function bindQuestToDOM() {
  document.getElementById('display-star-name').innerText = questData.star_name;
  document.getElementById('display-sender-name').innerText = questData.sender_name;
  document.getElementById('feedback-receiver-name').innerText = questData.sender_name;
  document.getElementById('display-intro-content').innerText = questData.intro_content || '';
  
  // Hero Image
  const heroImg = document.getElementById('display-hero-img');
  heroImg.src = questData.hero_image;
  heroImg.onerror = () => { heroImg.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500'; };

  // Audio setup
  if (questData.bgm_url) {
    bgm.src = questData.bgm_url;
  }

  // Level 1 Slideshow Bind
  const track = document.getElementById('carousel-track');
  track.innerHTML = '';
  const images = (questData.level1_images && questData.level1_images.length) 
    ? questData.level1_images 
    : ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500'];

  images.forEach(url => {
    track.innerHTML += `<div class="carousel-slide"><img src="${url}" onerror="this.src='https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500'"/></div>`;
  });
  document.getElementById('display-level1-note').innerText = questData.level1_note || '';
  initCarouselEngine();

  // Level 2 Maze texts
  document.getElementById('display-level2-intro').innerText = questData.level2_intro || '';
  document.getElementById('display-level2-success').innerText = questData.level2_success || '';

  // Level 3 Puzzle text
  document.getElementById('display-level3-desc').innerText = questData.level3_desc || '';

  // Level 4 Trap Question
  document.getElementById('display-level4-question').innerText = questData.level4_question || '';

  // Level 5 Morse Code Visual Display
  const word = (questData.level5_secret_word || 'BEST FRIEND').toUpperCase();
  document.getElementById('display-secret-word').innerText = `"${word}"`;
  
  let morseCodeDisplay = '';
  for (const char of word) {
    morseCodeDisplay += (MORSE_MAP[char] || '') + '  ';
  }
  document.getElementById('morse-dots-display').innerText = morseCodeDisplay;

  // Level 6 Finale
  document.getElementById('display-level6-letter').innerText = questData.level6_letter || '';
  const polGrid = document.getElementById('display-polaroid-grid');
  polGrid.innerHTML = '';
  const pols = (questData.level6_polaroids && questData.level6_polaroids.length)
    ? questData.level6_polaroids
    : ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500'];

  pols.forEach(url => {
    polGrid.innerHTML += `
      <div class="polaroid-item">
        <img src="${url}" onerror="this.src='https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500'"/>
        <span style="font-size:0.75rem;font-weight:bold;margin-top:4px;display:block;">Sweet Memory ❤️</span>
      </div>`;
  });

  initAmbientDust();
}

/* ============================================================
   LEVEL 2: MAZE GAME (WITH AVATAR TOKEN)
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
    runnerImg.crossOrigin = "anonymous";
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
        mazeCtx.fillText('🎂', c * cellSize + 15, r * cellSize + 21);
      }
    }
  }

  // Draw Avatar circle
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
   LEVEL 3: PHOTO PUZZLE
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
    document.getElementById('puzzle-timer').innerText = `⏳ Time: ${timerCountdown}s`;
    if (timerCountdown <= 0) {
      clearInterval(puzzleTimer);
      document.getElementById('troll-modal').classList.remove('hidden');
    }
  }, 1000);
}

function renderPuzzleBoard() {
  const board = document.getElementById('puzzle-board');
  board.innerHTML = '';
  const puzzleImg = (questData && questData.level3_image) ? questData.level3_image : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';

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
   LEVEL 4: CONTROLLED RUNAWAY NO BUTTON
   ============================================================ */
const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const trapArena = document.getElementById('trap-arena');

function runawayNo() {
  const w = trapArena.clientWidth - 100;
  const h = trapArena.clientHeight - 55;
  const rx = Math.max(10, Math.floor(Math.random() * w));
  const ry = Math.max(10, Math.floor(Math.random() * h));
  noBtn.style.left = `${rx}px`;
  noBtn.style.top = `${ry}px`;
  noBtn.style.right = 'auto';
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
   LEVEL 5: MORSE CODE DECODE TRIGGER
   ============================================================ */
document.getElementById('decode-btn').addEventListener('click', () => {
  document.getElementById('decoded-card').classList.remove('hidden');
  confetti({ particleCount: 80, spread: 60 });
});

/* ============================================================
   LEVEL 6: CANDLE & FEEDBACK
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
   GLOBAL NAVIGATION
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
  if (bgm.src) {
    bgm.play().then(() => {
      vinylBtn.classList.remove('paused');
      isAudioPlaying = true;
    }).catch(e => console.log("Audio play blocked by browser:", e));
  }
  goToLevel(1);
});

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

function initAmbientDust() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let pts = Array.from({ length: 30 }, () => ({
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
