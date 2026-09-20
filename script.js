/**
 * ============================================================
 * THE BIRTHDAY QUEST - FULL ENGINE WITH PROPER UPLOADS & AUDIO FIX
 * ============================================================
 */

// 1. SUPABASE CREDENTIALS (നിങ്ങളുടെ കീകൾ മാറ്റാതെ നൽകുക)
const SUPABASE_URL = "https://uedytnpsodsgwtcjhjry.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_URIryt2eGjUWVjZlg5qXtQ_viYHrUHC";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Variables
let currentLevel = 0;
const totalLevels = 6;
let questData = null;
let cropperInstance = null;
let activeCropCallback = null;

const bgm = document.getElementById('bgm');
const vinylBtn = document.getElementById('vinyl-btn');
let isAudioPlaying = false;

// Files & Upload Blobs
let heroBlob = null;
let puzzleBlob = null;
let level1Files = [];
let level6Files = [];

let decodeAttempts = 3;

// Morse Code Alphabet Map
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
   ROUTER: CREATOR STUDIO vs PRIVATE DASHBOARD vs QUEST PLAY
   ============================================================ */
window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const questId = urlParams.get('id');
  const adminSecret = urlParams.get('admin');

  if (questId && adminSecret) {
    document.getElementById('creator-view').classList.add('hidden');
    document.getElementById('quest-view').classList.add('hidden');
    document.getElementById('admin-feedback-view').classList.remove('hidden');
    await loadAdminFeedback(questId, adminSecret);
  } else if (questId) {
    document.getElementById('creator-view').classList.add('hidden');
    document.getElementById('admin-feedback-view').classList.add('hidden');
    document.getElementById('quest-view').classList.remove('hidden');
    await loadQuestData(questId);
  } else {
    document.getElementById('creator-view').classList.remove('hidden');
    document.getElementById('admin-feedback-view').classList.add('hidden');
    document.getElementById('quest-view').classList.add('hidden');
    initCreatorView();
  }
});

/* ============================================================
   AUDIO CONTROLLER (PLAY / PAUSE)
   ============================================================ */
vinylBtn.addEventListener('click', () => {
  if (bgm.paused) {
    bgm.play().then(() => {
      isAudioPlaying = true;
      vinylBtn.classList.remove('paused');
    }).catch(e => console.error("Soundtrack blocked:", e));
  } else {
    bgm.pause();
    isAudioPlaying = false;
    vinylBtn.classList.add('paused');
  }
});

/* ============================================================
   CREATOR MODE: FORM & DUAL LINK GENERATION
   ============================================================ */
function initCreatorView() {
  const presetSelector = document.getElementById('bgm-preset-selector');
  const uploadInput = document.getElementById('in-bgm-file');
  const previewBtn = document.getElementById('btn-preview-audio');
  const previewPlayer = document.getElementById('preview-player');

  // Preview Preset Audio
  previewBtn.addEventListener('click', () => {
    const selectedUrl = presetSelector.value;
    if (!selectedUrl) {
      alert("Please select a preset track first to preview!");
      return;
    }
    if (previewPlayer.paused || previewPlayer.src !== selectedUrl) {
      previewPlayer.src = selectedUrl;
      previewPlayer.play();
      previewBtn.innerText = "⏸️ Pause";
    } else {
      previewPlayer.pause();
      previewBtn.innerText = "▶️ Test";
    }
  });

  presetSelector.addEventListener('change', () => {
    if (!previewPlayer.paused) {
      previewPlayer.pause();
      previewBtn.innerText = "▶️ Test";
    }
    if (presetSelector.value !== "") {
      uploadInput.disabled = true;
      uploadInput.value = "";
    } else {
      uploadInput.disabled = false;
    }
  });

  uploadInput.addEventListener('change', () => {
    if (uploadInput.files.length > 0) {
      presetSelector.disabled = true;
      presetSelector.value = "";
    } else {
      presetSelector.disabled = false;
    }
  });

  // Expandable Guide Toggle
  const guideToggleBtn = document.getElementById('btn-toggle-guide');
  const guideContent = document.getElementById('creator-guide-content');
  guideToggleBtn.addEventListener('click', () => {
    guideContent.classList.toggle('hidden');
    guideToggleBtn.innerText = guideContent.classList.contains('hidden') ? "📖 Read Creator Guide & Steps" : "✖️ Hide Guide";
  });

  setupPresetListener('intro-presets', 'in-intro-content', {
    en_1: "May your birthday be filled with endless smiles, pure joy, and everything you have ever dreamed of! Happy Birthday!",
    en_2: "It takes an absolute saint to handle someone as crazy as you. Gladly signing up for another year of madness! Happy Birthday!",
    en_3: "Welcome to your personalized birthday adventure! Clear every secret stage to unlock your grand celebration!",
    en_4: "Today is all about you! Grateful for every memory, late-night laugh, and adventure we share. Happy Birthday!"
  });

  setupPresetListener('level1-presets', 'in-level1-note', {
    en_1: "Every picture tells a story of unforgettable laughs, shared moments, and our timeless bond!",
    en_2: "Looking back at these memories reminds me how lucky I am to have an adventure partner like you!",
    en_3: "A walk down memory lane... So grateful for every chapter we have written together!"
  });

  setupPresetListener('level2-presets', 'in-level2-intro', {
    en_1: "Guide your token to the birthday cake! But remember, eating the whole slice alone is strictly forbidden!",
    en_2: "Navigate the maze! Your birthday treat is at the finish line, so do not let the walls slow you down!"
  });

  setupPresetListener('level6-presets', 'in-level6-letter', {
    en_1: "In a world of fleeting connections, your presence is a rare and comforting blessing. Thank you for standing by me through thick and thin, for lighting up the darkest days, and for being your wonderfully authentic self. May this year bring you boundless success, health, and limitless joy!",
    en_2: "Happy Birthday! As another beautiful chapter begins, always remember how deeply you are appreciated and admired. Keep inspiring, keep chasing big dreams, and never lose that bright, contagious spark of yours!"
  });

  // Hero Avatar Crop (1:1)
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

  // Level 1 Slideshow Multiple Uploads
  document.getElementById('in-level1-files').addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(f => level1Files.push(f));
    renderPreviewGrid(level1Files, document.getElementById('slideshow-preview-grid'));
  });

  // Puzzle Crop (1:1)
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

  // Polaroid Multiple Uploads
  document.getElementById('in-level6-files').addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(f => level6Files.push(f));
    renderPreviewGrid(level6Files, document.getElementById('polaroid-preview-grid'));
  });

  document.getElementById('btn-fill-sample').addEventListener('click', fillSampleData);
  document.getElementById('quest-form').addEventListener('submit', handleFormSubmit);
}

function setupPresetListener(selectId, targetId, dict) {
  const sel = document.getElementById(selectId);
  const target = document.getElementById(targetId);
  sel.addEventListener('change', () => {
    if (dict[sel.value]) target.value = dict[sel.value];
  });
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

function fillSampleData() {
  document.getElementById('in-star-name').value = "Jessica";
  document.getElementById('in-sender-name').value = "Arthur";
  document.getElementById('in-intro-content').value = "May your birthday be filled with endless smiles, pure joy, and everything you have ever dreamed of! Happy Birthday! ✨";
  document.getElementById('in-level1-note').value = "Every picture tells a story of unforgettable laughs, shared moments, and our timeless bond! 📸";
  document.getElementById('in-level2-intro').value = "Guide your token to the birthday cake! But remember, eating the whole slice alone is strictly forbidden! 🍰";
  document.getElementById('in-level3-desc').value = "Rearrange your photo within 45 seconds to unlock the secret chamber! ⏱️";
  document.getElementById('in-level4-question').value = "Do you admit that I am the single coolest and most caring friend you have? 😜";
  document.getElementById('in-level5-word').value = "BEST FRIEND";
  document.getElementById('in-level6-letter').value = "In a world of fleeting connections, your presence is a rare and comforting blessing. Thank you for standing by me through thick and thin, for lighting up the darkest days, and for being your wonderfully authentic self. May this year bring you boundless success, health, and limitless joy! ❤️";

  const sampleUrls = [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500"
  ];
  level1Files = [...sampleUrls];
  level6Files = [...sampleUrls];
  renderPreviewGrid(level1Files, document.getElementById('slideshow-preview-grid'));
  renderPreviewGrid(level6Files, document.getElementById('polaroid-preview-grid'));

  document.getElementById('bgm-preset-selector').value = "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3";
  document.getElementById('in-bgm-file').disabled = true;

  alert("⚡ Sample data filled! Scroll down and click 'Generate Quest Links'.");
}

/* ============================================================
   CROPPER LOGIC
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
   SUPABASE STORAGE UPLOAD & SUBMIT (RELIABLE UPLOADER)
   ============================================================ */
async function uploadToStorage(fileOrBlob, folder = 'uploads') {
  if (!fileOrBlob) return null;
  if (typeof fileOrBlob === 'string') return fileOrBlob;

  const ext = fileOrBlob.type ? fileOrBlob.type.split('/')[1] : 'jpg';
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

  const { data, error } = await supabaseClient.storage
    .from('quest-media')
    .upload(fileName, fileOrBlob, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Storage Upload Detailed Error:', error);
    throw new Error(`Upload failed (${folder}): ${error.message}`);
  }

  const { data: publicUrlData } = supabaseClient.storage
    .from('quest-media')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-create-quest');
  btn.disabled = true;
  btn.innerText = 'Creating Quest & Uploading... ⏳';

  try {
    let heroUrl = null;
    if (heroBlob) {
      heroUrl = await uploadToStorage(heroBlob, 'avatars');
    } else if (document.getElementById('in-hero-file').files[0]) {
      heroUrl = await uploadToStorage(document.getElementById('in-hero-file').files[0], 'avatars');
    } else if (typeof level1Files[0] === 'string') {
      heroUrl = level1Files[0];
    }

    let puzzleUrl = null;
    if (puzzleBlob) {
      puzzleUrl = await uploadToStorage(puzzleBlob, 'puzzles');
    } else if (document.getElementById('in-level3-file').files[0]) {
      puzzleUrl = await uploadToStorage(document.getElementById('in-level3-file').files[0], 'puzzles');
    } else if (typeof level1Files[1] === 'string') {
      puzzleUrl = level1Files[1];
    }

    let finalBgmUrl = document.getElementById('bgm-preset-selector').value || null;
    const uploadedBgm = document.getElementById('in-bgm-file').files[0];
    if (uploadedBgm) {
      finalBgmUrl = await uploadToStorage(uploadedBgm, 'audio');
    }

    const l1Urls = [];
    for (const f of level1Files) {
      const url = await uploadToStorage(f, 'slideshow');
      if (url) l1Urls.push(url);
    }

    const l6Urls = [];
    for (const f of level6Files) {
      const url = await uploadToStorage(f, 'polaroids');
      if (url) l6Urls.push(url);
    }

    const secretToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const payload = {
      star_name: document.getElementById('in-star-name').value,
      sender_name: document.getElementById('in-sender-name').value,
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
      level6_polaroids: l6Urls.length ? l6Urls : ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500'],
      secret_token: secretToken
    };

    const { data, error } = await supabaseClient.from('quests').insert([payload]).select().single();
    if (error) throw error;

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const starUrl = `${baseUrl}?id=${data.id}`;
    const creatorUrl = `${baseUrl}?id=${data.id}&admin=${secretToken}`;

    document.getElementById('star-link-input').value = starUrl;
    document.getElementById('creator-link-input').value = creatorUrl;

    document.getElementById('btn-copy-star').onclick = () => {
      navigator.clipboard.writeText(starUrl);
      alert('Birthday Star link copied! 🎉 Send this to your friend.');
    };

    document.getElementById('btn-copy-creator').onclick = () => {
      navigator.clipboard.writeText(creatorUrl);
      alert('Private Feedback link copied! 🔒 Keep this to view their replies.');
    };

    document.getElementById('btn-open-star-quest').onclick = () => {
      window.location.href = starUrl;
    };

    document.getElementById('share-modal').classList.remove('hidden');

  } catch (err) {
    alert('Upload issue: ' + err.message);
    btn.disabled = false;
    btn.innerText = 'Generate Quest Links 🚀';
  }
}

/* ============================================================
   ADMIN / CREATOR PRIVATE FEEDBACK LOADER
   ============================================================ */
async function loadAdminFeedback(questId, adminSecret) {
  const container = document.getElementById('feedback-records-container');
  const welcome = document.getElementById('admin-welcome-text');

  const { data: qData, error: qErr } = await supabaseClient
    .from('quests')
    .select('star_name, sender_name, secret_token')
    .eq('id', questId)
    .single();

  if (qErr || !qData || qData.secret_token !== adminSecret) {
    welcome.innerText = "Access Denied: Invalid private key!";
    container.innerHTML = `<div class="empty-feedback-card">You do not have permission to view feedback for this quest.</div>`;
    return;
  }

  welcome.innerText = `Responses for ${qData.star_name}'s Quest (Created by ${qData.sender_name})`;

  const { data: fbList, error: fbErr } = await supabaseClient
    .from('quest_feedbacks')
    .select('*')
    .eq('quest_id', questId)
    .order('created_at', { ascending: false });

  if (fbErr || !fbList || fbList.length === 0) {
    container.innerHTML = `
      <div class="empty-feedback-card">
        <h3>No feedback received yet! 💌</h3>
        <p class="dim-hint mt-1">When ${qData.star_name} completes the quest and writes a reply, it will appear right here.</p>
      </div>`;
  } else {
    container.innerHTML = '';
    fbList.forEach((fb, i) => {
      const time = new Date(fb.created_at).toLocaleString();
      container.innerHTML += `
        <div class="feedback-entry-card">
          <div class="feedback-meta">Reply #${fbList.length - i} • ${time}</div>
          <div class="feedback-quote">"${fb.feedback_text}"</div>
        </div>`;
    });
  }
}

/* ============================================================
   PLAY MODE: DATA BINDING & QUEST RUNNER
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

  const heroImg = document.getElementById('display-hero-img');
  heroImg.src = questData.hero_image;
  heroImg.onerror = () => { heroImg.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500'; };

  if (questData.bgm_url) {
    bgm.src = questData.bgm_url;
  }

  // Level 1 Slideshow
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

  // Level 2
  document.getElementById('display-level2-intro').innerText = questData.level2_intro || '';
  document.getElementById('display-level2-success').innerText = questData.level2_success || '';

  // Level 3
  document.getElementById('display-level3-desc').innerText = questData.level3_desc || '';

  // Level 4
  document.getElementById('display-level4-question').innerText = questData.level4_question || '';

  // Level 5 Morse Code
  const word = (questData.level5_secret_word || 'BEST FRIEND').toUpperCase();
  document.getElementById('display-secret-word').innerText = `"${word}"`;

  let morseCodeDisplay = '';
  for (const char of word) {
    morseCodeDisplay += (MORSE_MAP[char] || '') + '  ';
  }
  document.getElementById('morse-dots-display').innerText = morseCodeDisplay;
  initMorseVerification(word);

  // Level 6 Polaroids
  document.getElementById('display-level6-letter').innerText = questData.level6_letter || '';
  const polGrid = document.getElementById('display-polaroid-grid');
  polGrid.innerHTML = '';
  const pols = (questData.level6_polaroids && questData.level6_polaroids.length)
    ? questData.level6_polaroids
    : ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500'];

  const captions = ['Happy Vibes ✨', 'Sweet Memory ❤️', 'Best Times 💫', 'Pure Gold 🌟', 'Forever Grateful 💖'];
  const rotations = [-4, 3, -2, 5, -3, 2];

  pols.forEach((url, i) => {
    const rot = rotations[i % rotations.length];
    const cap = captions[i % captions.length];
    polGrid.innerHTML += `
      <div class="vintage-polaroid" style="transform: rotate(${rot}deg);">
        <div class="tape-strip"></div>
        <img src="${url}" onerror="this.src='https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500'"/>
        <span class="polaroid-caption">${cap}</span>
      </div>`;
  });

  // Setup Feedback Quick Preset Chips
  document.querySelectorAll('.fb-chip').forEach(chip => {
    chip.onclick = () => {
      document.getElementById('feedback-text').value = chip.innerText;
    };
  });

  initAmbientDust();
}

/* ============================================================
   LEVEL 2: MAZE GAME
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
        mazeCtx.fillStyle = '#eeddc9';
        mazeCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      } else if (mazeGrid[r][c] === 2) {
        mazeCtx.font = '18px sans-serif';
        mazeCtx.textAlign = 'center';
        mazeCtx.fillText('🎂', c * cellSize + 15, r * cellSize + 21);
      }
    }
  }

  const px = playerPos.x * cellSize + 15;
  const py = playerPos.y * cellSize + 15;
  mazeCtx.save();
  mazeCtx.beginPath();
  mazeCtx.arc(px, py, 11, 0, Math.PI * 2);
  mazeCtx.clip();
  if (runnerImg.complete && runnerImg.naturalWidth > 0) {
    mazeCtx.drawImage(runnerImg, px - 11, py - 11, 22, 22);
  } else {
    mazeCtx.fillStyle = '#c2884a';
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
   LEVEL 3: PHOTO PUZZLE & CENTERED TIME-UP MODAL
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
   LEVEL 4: RUNAWAY NO & VISIBLE SELECTION
   ============================================================ */
const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const trapArena = document.getElementById('trap-arena');

function runawayNo() {
  const w = trapArena.clientWidth - 95;
  const h = trapArena.clientHeight - 50;
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
   LEVEL 5: MORSE CODE VERIFICATION
   ============================================================ */
function initMorseVerification(secretWord) {
  decodeAttempts = 3;
  document.getElementById('attempts-left-count').innerText = decodeAttempts;
  const input = document.getElementById('user-decoded-guess');
  const btn = document.getElementById('btn-check-decode');
  const errBox = document.getElementById('decode-error-msg');
  const card = document.getElementById('decoded-card');
  const note = document.getElementById('decode-result-note');

  btn.onclick = () => {
    const guess = input.value.trim().toUpperCase();
    if (!guess) {
      errBox.innerText = "Please type your decoded guess!";
      errBox.classList.remove('hidden');
      return;
    }

    const matchRatio = calculateSimilarity(guess, secretWord);

    if (matchRatio >= 0.5 || guess === secretWord) {
      revealSecretMessage(true, "Incredible! You cracked the secret cipher! 🎉");
    } else {
      decodeAttempts--;
      document.getElementById('attempts-left-count').innerText = decodeAttempts;

      if (decodeAttempts > 0) {
        errBox.innerText = `Incorrect decode! ${decodeAttempts} attempt(s) remaining.`;
        errBox.classList.remove('hidden');
      } else {
        revealSecretMessage(false, "Attempts exhausted! Here is the decrypted message: 🔓");
      }
    }
  };

  function revealSecretMessage(isSuccess, noteText) {
    errBox.classList.add('hidden');
    input.disabled = true;
    btn.disabled = true;
    note.innerText = noteText;
    card.classList.remove('hidden');
    if (isSuccess) confetti({ particleCount: 90, spread: 60 });
  }
}

function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length < 2 || str2.length < 2) return str1 === str2 ? 1 : 0;
  const getBigrams = s => {
    const bigrams = new Set();
    for (let i = 0; i < s.length - 1; i++) bigrams.add(s.substring(i, i + 2));
    return bigrams;
  };
  const b1 = getBigrams(str1);
  const b2 = getBigrams(str2);
  let intersection = 0;
  b1.forEach(bg => { if (b2.has(bg)) intersection++; });
  return (2.0 * intersection) / (b1.size + b2.size);
}

/* ============================================================
   LEVEL 6: CANDLE & FEEDBACK SAVER WITH AUTO-CLEAR
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
  const fTextArea = document.getElementById('feedback-text');
  const fText = fTextArea.value.trim();
  const btn = document.getElementById('btn-send-feedback');
  if (!fText) return;

  btn.disabled = true;
  btn.innerText = 'Sending Reply... ⏳';

  const { error } = await supabaseClient.from('quest_feedbacks').insert([{
    quest_id: questData.id,
    feedback_text: fText
  }]);

  if (!error) {
    document.getElementById('feedback-status').classList.remove('hidden');
    btn.innerText = 'Sent Successfully! ❤️';
    
    setTimeout(() => {
      fTextArea.value = '';
      btn.disabled = false;
      btn.innerText = 'Send Another Reply 🚀';
    }, 1500);

  } else {
    btn.disabled = false;
    btn.innerText = 'Retry 🚀';
    alert('Could not save feedback: ' + error.message);
  }
});

function celebrateAgain() {
  confetti({ particleCount: 150, spread: 80 });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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
    }).catch(e => console.log("Soundtrack blocked:", e));
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
    r: Math.random() * 2.5 + 0.6,
    sy: -Math.random() * 0.35 - 0.15
  }));
  function anim() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(214, 178, 140, 0.35)';
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
