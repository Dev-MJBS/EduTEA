// ============================================
// BACKEND CONFIGURATION FOR PAGES DEPLOYMENT
// ============================================
// Change BACKEND_URL to your deployed backend
const BACKEND_URL = (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
) 
  ? 'http://127.0.0.1:5010'
  : 'http://127.0.0.1:5010'; // ← UPDATE THIS to your remote backend URL
  // Example: 'https://edutea-backend.onrender.com'

// ============================================
// Basic game state
// ============================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socketStatusEl = document.getElementById('socketStatus');
const serverUrlEl = document.getElementById('serverUrl');
const wordInputEl = document.getElementById('wordInput');
const applyWordBtn = document.getElementById('applyWordBtn');
const cursorSizeEl = document.getElementById('cursorSize');
const graspEl = document.getElementById('grasp');
const timerEl = document.getElementById('timer');
const attemptsEl = document.getElementById('attempts');
const sndPlace = document.getElementById('sndPlace');
// Remove victory sound effect (user preference)
// const sndWin = document.getElementById('sndWin');
const sndError = document.getElementById('sndError');
const detectionEl = document.getElementById('detection');
const wristXYEl = document.getElementById('wristXY');

// Config screen elements
const configScreen = document.getElementById('configScreen');
const gameScreen = document.getElementById('gameScreen');
const inputWord = document.getElementById('inputWord');
const startGameButton = document.getElementById('startGameButton');

// Target word and shuffled letters
let targetWord = 'CAB';
try { document.getElementById('targetWord').textContent = targetWord; } catch {}
let baseLetters = targetWord.split('');
let shuffled = [...baseLetters].sort(() => Math.random() - 0.5);

// Letters state (start shuffled on the left side)
let letters = shuffled.map((ch, i) => ({
  char: ch,
  x: 80 + i * 80,
  y: 120 + (i % 2) * 80,
  selected: false,
  placed: false,
  slotIndex: null,
}));
let selectedIndex = 0;
letters[selectedIndex].selected = true;

// Optional parking area disabled for ordered placement; keep for future use
const dropZone = null;
let draggingIndex = null;
let cursorPos = { x: canvas.width / 2, y: canvas.height / 2 };
let cursorGrabbing = false;
// Debounce state for grasp start/end to avoid flicker
let grabFrames = 0;
let releaseFrames = 0;
const GRAB_ON_THRESHOLD = 1;   // fast response: 1 frame to detect grab (very responsive)
const GRAB_OFF_THRESHOLD = 2;  // 2 frames to release (avoid brief flickers)
let minHoldFrames = 0;         // frames held since grab confirmed
const cursorSettings = {
  radiusOpen: 12,
  radiusGrab: 14,
  colorOpen: '#2563eb',   // azul forte
  colorGrab: '#dc2626',   // vermelho forte
  outline: '#ffffff',
};
const cursorTrail = [];
const trailMax = 12;

// Simple confetti system
let confetti = [];
function spawnConfetti(n = 120) {
  const colors = ['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
  for (let i = 0; i < n; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      size: 4 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.2,
    });
  }
}
function updateConfetti() {
  confetti.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;
  });
  confetti = confetti.filter(p => p.y < canvas.height + 30);
}
function drawConfetti() {
  confetti.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
    ctx.restore();
  });
}

// Word slots area (boxes to organize the word in order)
let slots = {
  x: 200,
  y: canvas.height - 160,
  width: 60,
  height: 60,
  gap: 16,
  count: baseLetters.length,
};

// Timer and attempts
let startTime = Date.now();
let attempts = 0;
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
}
function updateHud() {
  if (timerEl) timerEl.textContent = formatTime(Date.now() - startTime);
  if (attemptsEl) attemptsEl.textContent = String(attempts);
}
setInterval(updateHud, 500);

// Function to handle start game
async function handleStartGame() {
  console.log('[EduTEA] Start button clicked');
  const word = inputWord.value.trim().toUpperCase();
  if (word.length < 3) {
    alert('A palavra deve ter pelo menos 3 letras.');
    console.warn('[EduTEA] Palavra inválida (menos de 3 letras)');
    return;
  }

  try {
    console.log('[EduTEA] Enviando POST /start_game com palavra:', word);
    const response = await fetch('/start_game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word: word }),
    });

    if (response.ok) {
      console.log('[EduTEA] Resposta OK de /start_game');
      // Switch to game screen
      configScreen.classList.add('hidden');
      gameScreen.classList.remove('hidden');
      // Initialize game with the word
      targetWord = word;
      try { document.getElementById('targetWord').textContent = targetWord; } catch {}
      baseLetters = targetWord.split('');
      shuffled = [...baseLetters].sort(() => Math.random() - 0.5);
      letters = shuffled.map((ch, i) => ({
        char: ch,
        x: 80 + i * 80,
        y: 120 + (i % 2) * 80,
        selected: false,
        placed: false,
        slotIndex: null,
      }));
      selectedIndex = 0;
      letters[selectedIndex].selected = true;
      slots = { x: 200, y: canvas.height - 160, width: 60, height: 60, gap: 16, count: baseLetters.length };
      attempts = 0;
      startTime = Date.now();
      draw();
    } else {
      const text = await response.text().catch(() => '');
      console.error('[EduTEA] Falha /start_game. Status:', response.status, 'Body:', text);
      alert('Erro ao iniciar o jogo. Tente novamente.');
    }
  } catch (error) {
    console.error('[EduTEA] Erro de conexão /start_game:', error);
    alert('Erro de conexão. Verifique se o servidor está rodando.');
  }
}

// Bind events after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (startGameButton) {
    console.log('[EduTEA] Bind startGameButton click');
    startGameButton.addEventListener('click', handleStartGame);
  } else {
    console.error('[EduTEA] startGameButton não encontrado no DOM');
  }
  if (inputWord) {
    inputWord.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleStartGame();
      }
    });
  }
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateConfetti();
  // No generic drop zone; enforce ordered slots only
  // Draw slots
  for (let i = 0; i < slots.count; i++) {
    const sx = slots.x + i * (slots.width + slots.gap);
    const sy = slots.y;
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx, sy, slots.width, slots.height);
    ctx.fillStyle = 'rgba(147,197,253,0.12)';
    ctx.fillRect(sx, sy, slots.width, slots.height);
  }
  // Draw letters
  for (const letter of letters) {
    const color = letter.placed ? '#60a5fa' : (letter.selected ? '#34d399' : '#fbbf24');
    ctx.fillStyle = color;
    ctx.font = 'bold 48px system-ui';
    ctx.fillText(letter.char, letter.x, letter.y);
    // Dragging outline
    if (letter.selected && draggingIndex !== null && letters[draggingIndex] === letter) {
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2;
      ctx.strokeRect(letter.x - 12, letter.y - 52, 44, 64);
    }
  }

  // Draw wrist cursor trail for motion visualization
  for (let i = 0; i < cursorTrail.length; i++) {
    const t = cursorTrail[i];
    const alpha = 0.1 + (i / cursorTrail.length) * 0.25;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(99,102,241,${alpha})`; // roxo translucido
    ctx.fill();
  }

  // Draw wrist cursor (visual pointer)
  const r = cursorGrabbing ? cursorSettings.radiusGrab : cursorSettings.radiusOpen;
  const fill = cursorGrabbing ? cursorSettings.colorGrab : cursorSettings.colorOpen;
  ctx.beginPath();
  ctx.arc(cursorPos.x, cursorPos.y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = cursorSettings.outline;
  ctx.stroke();

  // Debug: show cursor position
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px system-ui';
  ctx.fillText(`Cursor: ${cursorPos.x.toFixed(0)}, ${cursorPos.y.toFixed(0)}`, 10, 30);

  // Confetti overlay
  drawConfetti();
}

draw();

// Map normalized wrist x,y [0..1] to canvas coordinates
function mapToCanvas(wx, wy) {
  // Many cameras report wy=0 at top; canvas y=0 at top too.
  // If movement feels inverted vertically, invert wy.
  const invertY = true;
  const x = wx * canvas.width;
  const y = (invertY ? (1 - wy) : wy) * canvas.height;
  return { x, y };
}

function isInsideLetter(x, y, letter) {
  // Approximate hit-box around the text
  const w = 40; // text width approximation
  const h = 50; // text height
  return x >= (letter.x - 10) && x <= (letter.x + w) && y >= (letter.y - h) && y <= (letter.y + 10);
}

function isInsideDropZone(x, y) {
  if (!dropZone) return false;
  return x >= dropZone.x && x <= (dropZone.x + dropZone.width) && y >= dropZone.y && y <= (dropZone.y + dropZone.height);
}

function hitTestSlot(x, y) {
  for (let i = 0; i < slots.count; i++) {
    const sx = slots.x + i * (slots.width + slots.gap);
    const sy = slots.y;
    // More generous hit box: center of letter should be within slot area
    if (x >= sx && x <= sx + slots.width && y >= sy && y <= sy + slots.height) {
      return i;
    }
  }
  return null;
}

// Control panel events
applyWordBtn?.addEventListener('click', () => {
    const w = (wordInputEl?.value || '').trim().toUpperCase();
    if (!w || w.length < 2) return;
    targetWord = w;
    try { document.getElementById('targetWord').textContent = targetWord; } catch {}
    baseLetters = targetWord.split('');
    shuffled = [...baseLetters].sort(() => Math.random() - 0.5);
    // rebuild letters and slots
    letters = shuffled.map((ch, i) => ({
      char: ch,
      x: 80 + i * 80,
      y: 120 + (i % 2) * 80,
      selected: false,
      placed: false,
      slotIndex: null,
    }));
    selectedIndex = 0;
    letters[selectedIndex].selected = true;
    slots = { x: 200, y: canvas.height - 160, width: 60, height: 60, gap: 16, count: baseLetters.length };
  attempts = 0;
  startTime = Date.now();
    draw();
  });

  wordInputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      applyWordBtn?.click();
    }
  });

  cursorSizeEl?.addEventListener('input', () => {
    const size = parseInt(cursorSizeEl.value, 10) || 12;
    cursorSettings.radiusOpen = size;
    cursorSettings.radiusGrab = Math.max(size, size + 2);
    draw();
  });

  resetBtn?.addEventListener('click', () => {
    // Reset to current targetWord but reshuffle
    baseLetters = targetWord.split('');
    shuffled = [...baseLetters].sort(() => Math.random() - 0.5);
    letters = shuffled.map((ch, i) => ({
      char: ch,
      x: 80 + i * 80,
      y: 120 + (i % 2) * 80,
      selected: false,
      placed: false,
      slotIndex: null,
    }));
    selectedIndex = 0;
    letters[selectedIndex].selected = true;
    slots = { x: 200, y: canvas.height - 160, width: 60, height: 60, gap: 16, count: baseLetters.length };
    draggingIndex = null;
    attempts = 0;
    startTime = Date.now();
    draw();
  });
  

function checkWin() {
  const arrangement = new Array(slots.count).fill(null);
  letters.forEach((l) => {
    if (l.slotIndex !== null) arrangement[l.slotIndex] = l.char;
  });
  const arrangedWord = arrangement.join('');
  return arrangedWord === targetWord;
}

// SocketIO setup (include polling fallback for Safari)
const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });

socket.on('connect', () => {
  socketStatusEl.textContent = 'Conectado';
  try {
    const url = window.location.origin;
    serverUrlEl.textContent = url;
  } catch (e) {
    serverUrlEl.textContent = '—';
  }
});

socket.on('disconnect', () => {
  socketStatusEl.textContent = 'Desconectado';
});

socket.on('gesture_data', (data) => {
  const { wrist_x, wrist_y, is_grabbing, detected } = data;
  wristXYEl.textContent = `${wrist_x.toFixed(3)}, ${wrist_y.toFixed(3)}`;
  graspEl.textContent = is_grabbing ? 'Fechado' : 'Aberto';
  detectionEl.textContent = detected ? 'Sim' : 'Não';

  const pos = mapToCanvas(wrist_x, wrist_y);
  // Update cursor position and trail only if hand is detected
  if (detected) {
    cursorPos = pos;
    cursorTrail.push({ x: pos.x, y: pos.y });
    if (cursorTrail.length > trailMax) cursorTrail.shift();
  }
  // Debounced grabbing state
  if (is_grabbing) {
    grabFrames = Math.min(GRAB_ON_THRESHOLD, grabFrames + 1);
    releaseFrames = 0;
    if (grabFrames >= GRAB_ON_THRESHOLD) {
      cursorGrabbing = true;
      minHoldFrames++;
    }
  } else {
    releaseFrames = Math.min(GRAB_OFF_THRESHOLD, releaseFrames + 1);
    grabFrames = 0;
    // Only allow release if we've actually held for a few frames already
    if (releaseFrames >= GRAB_OFF_THRESHOLD && minHoldFrames >= GRAB_ON_THRESHOLD) {
      cursorGrabbing = false;
      minHoldFrames = 0;
    }
  }
  const current = letters[selectedIndex];

  // Click-and-hold behavior: fechar a mão = clicar/segurar; abrir = soltar
  if (cursorGrabbing || (!detected && draggingIndex !== null)) {
    if (draggingIndex === null) {
      // Start dragging if wrist is over a letter (prefer selected, fallback any)
      if (isInsideLetter(pos.x, pos.y, current) && !current.placed) {
        draggingIndex = selectedIndex;
      } else {
        for (let i = 0; i < letters.length; i++) {
          if (!letters[i].placed && isInsideLetter(pos.x, pos.y, letters[i])) {
            draggingIndex = i;
            // update selection to the dragged letter
            letters[selectedIndex].selected = false;
            selectedIndex = i;
            letters[selectedIndex].selected = true;
            break;
          }
        }
      }
    }
    if (draggingIndex !== null) {
      letters[draggingIndex].x = pos.x;
      letters[draggingIndex].y = pos.y;
    }
  } else {
    // On release, if dragging, check slot or drop zone
    // Only release once we've seen enough consecutive release frames AND detection is active
    // Only release after a stable open and active detection
    if (draggingIndex !== null && releaseFrames >= GRAB_OFF_THRESHOLD && detected && !cursorGrabbing) {
      const letter = letters[draggingIndex];
      const slotHit = hitTestSlot(letter.x, letter.y);
      console.log(`[Release] Letter '${letter.char}' at (${letter.x.toFixed(0)}, ${letter.y.toFixed(0)}) - slotHit: ${slotHit}`);
      if (slotHit !== null) {
        // Enforce ordered placement: only next slot and matching char
        const nextSlot = letters.filter(l => l.slotIndex !== null).length;
        const expectedChar = targetWord[nextSlot];
        console.log(`[Slot Check] Expected slot ${nextSlot} (char '${expectedChar}'), hit slot ${slotHit} (letter '${letter.char}')`);
        if (slotHit === nextSlot && letter.char === expectedChar) {
        // Snap to slot center
        const sx = slots.x + slotHit * (slots.width + slots.gap);
        const sy = slots.y;
        letter.x = sx + slots.width / 2 - 16;
        letter.y = sy + slots.height / 2 + 16;
        letter.slotIndex = slotHit;
        letter.placed = true;
        letter.selected = false;
          attempts = (typeof attempts !== 'undefined') ? attempts + 1 : 0;
          console.log(`[Placed] Letter '${letter.char}' in slot ${slotHit}`);
          try { sndPlace?.play().catch(()=>{}); } catch {}
        } else {
          // wrong order or wrong slot
          console.warn(`[Wrong] Expected char '${expectedChar}' in slot ${nextSlot}, but got '${letter.char}' in slot ${slotHit}`);
          try { sndError?.play().catch(()=>{}); } catch {}
        }
      } else {
        console.warn(`[No Slot] Letter '${letter.char}' not inside any slot`);
      }
      // After a confirmed release, stop dragging
      draggingIndex = null;
    }
  }

  draw();

  if (checkWin()) {
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 28px system-ui';
    ctx.fillText('Parabéns! Palavra organizada: ' + targetWord, 40, 60);
    // Trigger confetti celebration instead of sound
    if (confetti.length === 0) spawnConfetti(200);
  }
});

// Fallback: if MJPEG doesn't render, poll /frame_json and set <img> src
const videoEl = document.getElementById('video');
let fallbackActive = false;
function startVideoFallback() {
  if (fallbackActive) return;
  fallbackActive = true;
  setInterval(async () => {
    try {
      const res = await fetch('/frame_json', { cache: 'no-store' });
      const j = await res.json();
      if (j && j.image) {
        videoEl.src = j.image;
      }
    } catch (e) {
      // ignore
    }
  }, 100);
}

// Detect if MJPEG failed to load in ~1.5s and switch
let mjpegLoaded = false;
videoEl.addEventListener('load', () => { mjpegLoaded = true; });
setTimeout(() => {
  if (!mjpegLoaded) startVideoFallback();
}, 1500);
