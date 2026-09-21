/**
 * ============================================================
 * THE SURPRISE QUEST - MULTI-OCCASION ENGINE
 * ============================================================
 */

// 1. SUPABASE CREDENTIALS
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

// Puzzle Engine State
let puzzleMaxAttempts = 2;
let puzzleCurrentAttempt = 1;
let puzzleAttemptMessages = {};
let puzzleState = [1, 2, 0, 3, 4, 5, 6, 8, 7];
let timerCountdown = 45;
let puzzleTimer = null;
let puzzleSolved = false;

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

// Occasion Configuration Data
const OCCASION_CONFIG = {
  birthday: {
    roles: [{ val: 'birthday_star', label: 'Birthday Star 🎂' }],
    mazeGoal: '🎂',
    mainHeading: (name) => `Happy Birthday ${name}! 🎉`,
    finaleHeading: 'Happy Birthday! 🎂',
    greeting: (name) => `Dearest ${name},`
  },
  friendship: {
    roles: [
      { val: 'bestie', label: 'Best Friend / Bestie 💫' },
      { val: 'partner', label: 'Partner in Crime 🤝' },
      { val: 'soulmate', label: 'Soulmate Friend ✨' }
    ],
    mazeGoal: '🏆',
    mainHeading: (name) => `For My Bestie ${name}! 💫`,
    finaleHeading: 'Cheers to Our Friendship! 🥂',
    greeting: (name) => `Dearest Bestie ${name},`
  },
  wedding: {
    roles: [
      { val: 'groom', label: 'Groom (വരൻ) 🤵' },
      { val: 'bride', label: 'Bride (വധു) 👰' },
      { val: 'couple', label: 'Newly Wed Couple 💍' }
    ],
    mazeGoal: '💍',
    mainHeading: (name) => `Happy Wedding Bells, ${name}! 💍`,
    finaleHeading: 'Happy Married Life! 🎊',
    greeting: (name) => `Dearest ${name},`
  },
  love: {
    roles: [
      { val: 'husband', label: 'Husband ❤️' },
      { val: 'wife', label: 'Wife ❤️' },
      { val: 'boyfriend', label: 'Boyfriend 💖' },
      { val: 'girlfriend', label: 'Girlfriend 💖' },
      { val: 'lover', label: 'My Love 🥰' }
    ],
    mazeGoal: '❤️',
    mainHeading: (name) => `To My Love, ${name}! ❤️`,
    finaleHeading: 'Forever & Always Yours! 🥰',
    greeting: (name) => `My Dearest ${name},`
  },
  siblings: {
    roles: [
      { val: 'brother', label: 'Brother 👦' },
      { val: 'sister', label: 'Sister 👧' },
      { val: 'sibling', label: 'Best Sibling 🌟' }
    ],
    mazeGoal: '🎁',
    mainHeading: (name) => `Special Surprise for ${name}! 🎁`,
    finaleHeading: 'Best Sibling Ever! 🌟',
    greeting: (name) => `Dear ${name},`
  },
  farewell: {
    roles: [
      { val: 'colleague', label: 'Colleague / Coworker 💼' },
      { val: 'friend_leave', label: 'Dear Friend ✈️' },
      { val: 'mentor', label: 'Mentor / Leader 🌟' }
    ],
    mazeGoal: '✈️',
    mainHeading: (name) => `Bon Voyage & Best Wishes, ${name}! 🌍`,
    finaleHeading: 'We Will Miss You! 🚀',
    greeting: (name) => `Dear ${name},`
  },
  congrats: {
    roles: [
      { val: 'achiever', label: 'Achiever / Champion 🏆' },
      { val: 'graduate', label: 'Graduate 🎓' }
    ],
    mazeGoal: '🏆',
    mainHeading: (name) => `Congratulations, ${name}! 🏆`,
    finaleHeading: 'Proud of Your Success! 🌟',
    greeting: (name) => `Dearest ${name},`
  }
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
   CREATOR MODE: OCCASION & SUB-ROLE HANDLER
   ============================================================ */
function initCreatorView() {
  const occasionSelect = document.getElementById('in-occasion-type');
  const subRoleContainer = document.getElementById('sub-role-container');
  const subRoleSelect = document.getElementById('in-sub-role');

  function updateSubRoles() {
    const occasion = occasionSelect.value;
    const config = OCCASION_CONFIG[occasion];
    if (config && config.roles.length > 1) {
      subRoleContainer.classList.remove('hidden');
      subRoleSelect.innerHTML = '';
      config.roles.forEach(r => {
        subRoleSelect.innerHTML += `<option value="${r.val}">${r.label}</option>`;
      });
    } else {
      subRoleContainer.classList.add('hidden');
      subRoleSelect.innerHTML = `<option value="default">${config ? config.roles[0].label : 'General'}</option>`;
    }
  }

  occasionSelect.addEventListener('change', updateSubRoles);
  updateSubRoles();

  const presetSelector = document.getElementById('bgm-preset-selector');
  const previewBtn = document.getElementById('btn-preview-audio');
  const previewPlayer = document.getElementById('preview-player');

  previewBtn.addEventListener('click', () => {
    const selectedUrl = presetSelector.value;
    if (!selectedUrl) {
      alert("Please select a preset track first to preview!");
      return;
    }
    if (previewPlayer.src !== new URL(selectedUrl, window.location.href).href && previewPlayer.src !== selectedUrl) {
      previewPlayer.src = selectedUrl;
      previewPlayer.play().then(() => { previewBtn.innerText = "⏸️ Pause"; }).catch(err => console.log(err));
    } else if (previewPlayer.paused) {
      previewPlayer.play().then(() => { previewBtn.innerText = "⏸️ Pause"; }).catch(err => console.log(err));
    } else {
      previewPlayer.pause();
      previewBtn.innerText = "▶️ Test";
    }
  });

  previewPlayer.addEventListener('ended', () => { previewBtn.innerText = "▶️ Test"; });
  presetSelector.addEventListener('change', () => {
    if (!previewPlayer.paused) previewPlayer.pause();
    previewBtn.innerText = "▶️ Test";
  });

  // Attempts Input Generator
  const attemptsDropdown = document.getElementById('in-level3-attempts');
  renderAttemptInputs(parseInt(attemptsDropdown.value, 10));
  attemptsDropdown.addEventListener('change', (e) => {
    renderAttemptInputs(parseInt(e.target.value, 10));
  });

  // Croppers
  setupImageInputWithCrop('in-hero-file', 1, (blob) => {
    heroBlob = blob;
    const prev = document.getElementById('crop-preview-hero');
    prev.src = URL.createObjectURL(blob);
    prev.classList.remove('hidden');
  });

  setupImageInputWithCrop('in-level3-file', 1, (blob) => {
    puzzleBlob = blob;
    const prev = document.getElementById('crop-preview-puzzle');
    prev.src = URL.createObjectURL(blob);
    prev.classList.remove('hidden');
  });

  setupMultipleImageCrop('in-level1-files', 4/5, (croppedBlobs) => {
    croppedBlobs.forEach(b => level1Files.push(b));
    renderPreviewGrid(level1Files, document.getElementById('slideshow-preview-grid'));
  });

  setupMultipleImageCrop('in-level6-files', 1, (croppedBlobs) => {
    croppedBlobs.forEach(b => level6Files.push(b));
    renderPreviewGrid(level6Files, document.getElementById('polaroid-preview-grid'));
  });

  document.getElementById('btn-fill-sample').addEventListener('click', fillSampleData);
  document.getElementById('quest-form').addEventListener('submit', handleFormSubmit);
}

function renderAttemptInputs(count) {
  const container = document.getElementById('attempt-messages-container');
  container.innerHTML = `<label style="font-weight: 700; font-size: 0.86rem; color: #473c33; display: block; margin-bottom: 6px;">
    💬 ഓരോ അറ്റെംപ്റ്റിലും സമയം കഴിയുമ്പോൾ കാണിക്കേണ്ട സന്ദേശങ്ങൾ:
  </label>`;

  const defaults = [
    "അയ്യോ സമയം കഴിഞ്ഞു! ഒന്നുംകൂടി ശ്രദ്ധിച്ച് ട്രൈ ചെയ്യൂ! ⚡",
    "ഇതത്ര എളുപ്പമല്ല അല്ലേ! അടുത്ത അറ്റെംപ്റ്റിൽ റെഡിയാക്കാം! 😉",
    "പോരാ പോരാ വേഗത കുറച്ചുകൂടി കൂട്ടണം! 🚀",
    "വിട്ടുകൊടുക്കരുത്, ഒരു ചാൻസ് കൂടിയുണ്ട്! 💪",
    "അവസാന ചാൻസ് ആണ്, കട്ടക്ക് പിടിച്ചോ! 🔥"
  ];

  for (let i = 1; i <= count; i++) {
    const div = document.createElement('div');
    div.className = 'field';
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <small style="color: var(--accent-gold); font-weight: bold;">Attempt ${i} Fail Message:</small>
      <input type="text" id="in-attempt-msg-${i}" class="creamy-input mt-1" value="${defaults[i - 1] || 'Time is up! Try again!'}" />
    `;
    container.appendChild(div);
  }
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
  document.getElementById('in-star-name').value = "Rahul";
  document.getElementById('in-sender-name').value = "Ananya";
  document.getElementById('in-intro-content').value = "Welcome to your special surprise quest! Clear every challenge to unlock your grand celebration!";
  document.getElementById('in-level1-note').value = "Every picture tells a story of unforgettable laughs, shared moments, and our timeless bond!";
  document.getElementById('in-level2-intro').value = "Guide your token to the final surprise target!";
  document.getElementById('in-level3-desc').value = "Rearrange your photo within 45 seconds to unlock the secret chamber!";
  document.getElementById('in-level3-attempts').value = "2";
  renderAttemptInputs(2);
  document.getElementById('in-level4-question').value = "Do you admit that I am the single coolest and most special person in your life?";
  document.getElementById('in-level4-success').value = "I knew it! Truth always wins! Unlocked the secret chamber for you! 😍";
  document.getElementById('in-level5-word').value = "BEST FRIEND";
  document.getElementById('in-level6-letter').value = "In a world of fleeting connections, your presence is a rare and comforting blessing. Thank you for standing by me through thick and thin!";

  const sampleUrls = [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500"
  ];
  level1Files = [...sampleUrls];
  level6Files = [...sampleUrls];
  renderPreviewGrid(level1Files, document.getElementById('slideshow-preview-grid'));
  renderPreviewGrid(level6Files, document.getElementById('polaroid-preview-grid'));

  document.getElementById('bgm-preset-selector').value = "assets/music/song1.mp3";
  alert("⚡ Sample data filled! Scroll down and click 'Generate Quest Links'.");
}

/* ============================================================
   IMAGE UPLOAD & CROPPER QUEUE
   ============================================================ */
function setupImageInputWithCrop(inputId, aspectRatio, onCroppedCallback) {
  const input = document.getElementById(inputId);
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert("⚠️ വീഡിയോയോ മറ്റ് ഫയലുകളോ അനുവദനീയമല്ല! ഫോട്ടോ മാത്രം തിരഞ്ഞെടുക്കുക.");
      input.value = "";
      return;
    }
    openCropperModal(file, aspectRatio, onCroppedCallback);
  });
}

function setupMultipleImageCrop(inputId, aspectRatio, onAllDoneCallback) {
  const input = document.getElementById(inputId);
  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validImages = files.filter(f => {
      if (!f.type.startsWith('image/')) {
        alert(`⚠️ ${f.name} ഒരു വീഡിയോ ആയതിനാൽ ഒഴിവാക്കി.`);
        return false;
      }
      return true;
    });

    if (!validImages.length) {
      input.value = "";
      return;
    }

    const croppedResults = [];
    let currentIndex = 0;

    function processNext() {
      if (currentIndex >= validImages.length) {
        input.value = "";
        onAllDoneCallback(croppedResults);
        return;
      }
      const currentFile = validImages[currentIndex];
      document.getElementById('crop-modal-title').innerText = `Crop Photo (${currentIndex + 1} of ${validImages.length})`;
      
      openCropperModal(currentFile, aspectRatio, (blob) => {
        croppedResults.push(blob);
        currentIndex++;
        processNext();
      }, () => {
        currentIndex++;
        processNext();
      });
    }
    processNext();
  });
}

function openCropperModal(file, aspectRatio, onSave, onCancel) {
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

    document.getElementById('btn-apply-crop').onclick = () => {
      cropperInstance.getCroppedCanvas({ maxWidth: 900, maxHeight: 900 }).toBlob((blob) => {
        modal.classList.add('hidden');
        cropperInstance.destroy();
        if (onSave) onSave(blob);
      }, 'image/jpeg', 0.85);
    };

    document.getElementById('btn-cancel-crop').onclick = () => {
      modal.classList.add('hidden');
      if (cropperInstance) cropperInstance.destroy();
      if (onCancel) onCancel();
    };
  };
  reader.readAsDataURL(file);
}

/* ============================================================
   SUPABASE UPLOAD & SUBMIT
   ============================================================ */
async function uploadToStorage(fileOrBlob, folder = 'uploads') {
  if (!fileOrBlob) return null;
  if (typeof fileOrBlob === 'string') return fileOrBlob;

  const ext = fileOrBlob.type ? fileOrBlob.type.split('/')[1] : 'jpg';
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

  const { data, error } = await supabaseClient.storage
    .from('quest-media')
    .upload(fileName, fileOrBlob, { cacheControl: '3600', upsert: true });

  if (error) throw new Error(`Upload failed (${folder}): ${error.message}`);

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
    let heroUrl = heroBlob ? await uploadToStorage(heroBlob, 'avatars') : (level1Files[0] || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500');
    let puzzleUrl = puzzleBlob ? await uploadToStorage(puzzleBlob, 'puzzles') : (level1Files[1] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500');

    const uploadedBgm = document.getElementById('in-bgm-file').files[0];
    let finalBgmUrl = uploadedBgm ? await uploadToStorage(uploadedBgm, 'audio') : (document.getElementById('bgm-preset-selector').value || null);

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
    const selectedAttempts = parseInt(document.getElementById('in-level3-attempts').value, 10) || 2;

    const attemptMessages = {};
    for (let i = 1; i <= selectedAttempts; i++) {
      const msgInput = document.getElementById(`in-attempt-msg-${i}`);
      attemptMessages[`attempt_${i}`] = msgInput ? msgInput.value : `Time's up for attempt ${i}!`;
    }

    const payload = {
      occasion_type: document.getElementById('in-occasion-type').value,
      sub_role: document.getElementById('in-sub-role').value,
      star_name: document.getElementById('in-star-name').value,
      sender_name: document.getElementById('in-sender-name').value,
      hero_image: heroUrl,
      bgm_url: finalBgmUrl,
      intro_content: document.getElementById('in-intro-content').value,
      level1_images: l1Urls.length ? l1Urls : ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500'],
      level1_note: document.getElementById('in-level1-note').value,
      level2_intro: document.getElementById('in-level2-intro').value,
      level2_success: document.getElementById('in-level2-success').value,
      level3_image: puzzleUrl,
      level3_desc: document.getElementById('in-level3-desc').value,
      level3_attempts: selectedAttempts,
      level3_attempt_messages: attemptMessages,
      level4_question: document.getElementById('in-level4-question').value,
      level4_success_text: document.getElementById('in-level4-success').value || "I knew it! Truth always wins! 😍",
      level5_secret_word: (document.getElementById('in-level5-word').value || 'BEST FRIEND').toUpperCase(),
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
      alert('Surprise link copied! 🎉 Send this to your friend.');
    };

    document.getElementById('btn-copy-creator').onclick = () => {
      navigator.clipboard.writeText(creatorUrl);
      alert('Private Feedback link copied! 🔒 Keep this safe.');
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
    container.innerHTML = `<div class="empty-feedback-card">You do not have permission to view feedback.</div>`;
    return;
  }

  welcome.innerText = `Responses for ${qData.star_name}'s Surprise Quest`;

  const { data: fbList, error: fbErr } = await supabaseClient
    .from('quest_feedbacks')
    .select('*')
    .eq('quest_id', questId)
    .order('created_at', { ascending: false });

  if (fbErr || !fbList || fbList.length === 0) {
    container.innerHTML = `<div class="empty-feedback-card"><h3>No feedback received yet! 💌</h3></div>`;
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
   PLAY MODE: DATA BINDING & DYNAMIC OCCASION LABELS
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
  const occasion = questData.occasion_type || 'birthday';
  const config = OCCASION_CONFIG[occasion] || OCCASION_CONFIG.birthday;

  // Dynamic Headings based on occasion
  document.getElementById('play-quest-header-title').innerText = occasion.toUpperCase() + " QUEST";
  document.getElementById('display-star-name').innerText = questData.star_name;
  document.getElementById('display-main-heading').innerText = config.mainHeading(questData.star_name);
  document.getElementById('finale-main-heading').innerText = config.finaleHeading;
  document.getElementById('display-sender-name').innerText = questData.sender_name;
  document.getElementById('feedback-receiver-name').innerText = questData.sender_name;
  document.getElementById('display-intro-content').innerText = questData.intro_content || '';

  const letterStarGreeting = document.getElementById('letter-star-name');
  if (letterStarGreeting) {
    letterStarGreeting.innerText = questData.star_name || "Friend";
  }

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

  // Level 3 Puzzle Data
  document.getElementById('display-level3-desc').innerText = questData.level3_desc || '';
  puzzleMaxAttempts = questData.level3_attempts || 2;
  puzzleAttemptMessages = questData.level3_attempt_messages || {};
  puzzleCurrentAttempt = 1;

  // Level 4 Truth Trap
  document.getElementById('display-level4-question').innerText = questData.level4_question || '';
  if (questData.level4_success_text) {
    document.getElementById('display-trap-desc').innerText = questData.level4_success_text;
  }

  // Level 5 Morse
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
  const config = OCCASION_CONFIG[questData?.occasion_type || 'birthday'] || OCCASION_CONFIG.birthday;
  const goalEmoji = config.mazeGoal || '🎂';

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (mazeGrid[r][c] === 1) {
        mazeCtx.fillStyle = '#eeddc9';
        mazeCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      } else if (mazeGrid[r][c] === 2) {
        mazeCtx.font = '18px sans-serif';
        mazeCtx.textAlign = 'center';
        mazeCtx.fillText(goalEmoji, c * cellSize + 15, r * cellSize + 21);
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
   LEVEL 3: PHOTO PUZZLE & ATTEMPTS HANDLER
   ============================================================ */
function initPuzzleGame() {
  puzzleState = [1, 2, 0, 3, 4, 5, 6, 8, 7];
  timerCountdown = 45;
  puzzleSolved = false;

  document.getElementById('level3-next-btn').classList.add('hidden');
  document.getElementById('troll-modal').classList.add('hidden');
  const attemptModal = document.getElementById('attempt-failed-modal');
  if (attemptModal) attemptModal.classList.add('hidden');

  updatePuzzleBadge();
  renderPuzzleBoard();
  startPuzzleCountdown();
}

function updatePuzzleBadge() {
  const badge = document.getElementById('puzzle-attempts-badge');
  if (badge) {
    badge.innerText = `🎯 Attempt: ${puzzleCurrentAttempt} / ${puzzleMaxAttempts}`;
  }
  document.getElementById('puzzle-timer').innerText = `⏳ Time: ${timerCountdown}s`;
}

function startPuzzleCountdown() {
  clearInterval(puzzleTimer);
  puzzleTimer = setInterval(() => {
    timerCountdown--;
    document.getElementById('puzzle-timer').innerText = `⏳ Time: ${timerCountdown}s`;

    if (timerCountdown <= 0) {
      clearInterval(puzzleTimer);
      handlePuzzleTimeout();
    }
  }, 1000);
}

function handlePuzzleTimeout() {
  if (puzzleCurrentAttempt < puzzleMaxAttempts) {
    const attemptModal = document.getElementById('attempt-failed-modal');
    const desc = document.getElementById('attempt-failed-text');
    
    const customMsg = puzzleAttemptMessages[`attempt_${puzzleCurrentAttempt}`] 
      || `Time's up for Attempt ${puzzleCurrentAttempt}! You have ${puzzleMaxAttempts - puzzleCurrentAttempt} attempt(s) remaining!`;

    if (desc) desc.innerText = customMsg;
    if (attemptModal) attemptModal.classList.remove('hidden');

    const nextBtn = document.getElementById('btn-next-attempt');
    if (nextBtn) {
      nextBtn.onclick = () => {
        attemptModal.classList.add('hidden');
        puzzleCurrentAttempt++;
        initPuzzleGame();
      };
    }
  } else {
    const lastMsg = puzzleAttemptMessages[`attempt_${puzzleCurrentAttempt}`];
    if (lastMsg) {
      document.getElementById('all-attempts-exhausted-note').innerText = lastMsg;
    }
    document.getElementById('troll-modal').classList.remove('hidden');
  }
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
  puzzleSolved = false;
  document.getElementById('troll-modal').classList.add('hidden');
  updatePuzzleBadge();
  startPuzzleCountdown();
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
   LEVEL 6: CANDLE / SURPRISE & FEEDBACK SAVER
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
