// game.js — Tap Challenge (20s)

// --- Game state ---
let score = 0;
let timeLeft = 20;
let gameActive = false;
let timerInterval = null;

// --- DOM references ---
const scoreDisplay = document.getElementById('scoreDisplay');
const bestDisplay = document.getElementById('bestDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const tapButton = document.getElementById('tapButton');
const startButton = document.getElementById('startButton');
const playAgainButton = document.getElementById('playAgainButton');
const timerRing = document.querySelector('.timer-ring');

// --- Best score from localStorage ---
let bestScore = 0;
try {
  const stored = localStorage.getItem('tapChallengeBest');
  if (stored !== null) {
    bestScore = Number(stored) || 0;
  }
} catch (e) {
  // localStorage might be blocked (private mode / Telegram)
  console.warn('localStorage unavailable, best score not saved.');
}
bestDisplay.textContent = bestScore;

// --- Helper: update best score (and save) ---
function updateBestScore() {
  if (score > bestScore) {
    bestScore = score;
    bestDisplay.textContent = bestScore;
    try {
      localStorage.setItem('tapChallengeBest', bestScore);
    } catch (e) {
      // ignore if storage fails
    }
  }
}

// --- Update timer display + warning color ---
function updateTimerUI() {
  timerDisplay.textContent = timeLeft;
  if (timeLeft <= 5) {
    timerRing.classList.add('warning');
  } else {
    timerRing.classList.remove('warning');
  }
}

// --- Stop timer and clean up ---
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// --- End game (timeout or manual) ---
function endGame() {
  gameActive = false;
  stopTimer();
  tapButton.disabled = true;
  timerRing.classList.remove('warning');
  updateBestScore();
  
  // Show Play Again, hide Start (they might both be visible but start is hidden style)
  startButton.classList.add('hidden');
  playAgainButton.classList.remove('hidden');
}

// --- Reset for new round (called by start/play again) ---
function resetGame() {
  stopTimer();
  gameActive = false;
  score = 0;
  timeLeft = 20;
  scoreDisplay.textContent = '0';
  timerDisplay.textContent = '20';
  timerRing.classList.remove('warning');
  tapButton.disabled = true;   // disabled until user starts? we'll enable on start
  // But we want tap disabled until game starts, so we manage in startGame.
  // Button state will be enabled inside startGame.
  
  // Buttons: hide play again, show start
  playAgainButton.classList.add('hidden');
  startButton.classList.remove('hidden');
  
  // Also reset any residual UI
  updateTimerUI();
}

// --- Start the game (from button) ---
function startGame() {
  // prevent double start
  if (gameActive) return;
  
  // reset everything and set active
  resetGame();              // resets score/time, disables tap, hides again button
  gameActive = true;
  tapButton.disabled = false;   // enable TAP
  score = 0;
  timeLeft = 20;
  scoreDisplay.textContent = '0';
  updateTimerUI();
  
  // Ensure buttons state: start hidden, play again hidden (or not needed)
  startButton.classList.add('hidden');
  playAgainButton.classList.add('hidden');
  
  // Start countdown
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerUI();
    
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerUI();
      endGame();
    }
  }, 1000);
}

// --- Tap handler ---
function handleTap() {
  if (!gameActive) return;        // ignore taps when not active
  if (timeLeft <= 0) return;      // extra safety
  
  score += 1;
  scoreDisplay.textContent = score;
  
  // small haptic feedback if supported
  if (navigator.vibrate) navigator.vibrate(15);
  
  // visual feedback on button (CSS handles :active but we can do a quick scale)
  tapButton.style.transform = 'scale(0.96)';
  setTimeout(() => {
    tapButton.style.transform = '';
  }, 60);
}

// --- Attach event listeners ---

// TAP button – use 'click' for modern mobile browsers (faster than touch)
tapButton.addEventListener('click', (e) => {
  e.preventDefault();
  handleTap();
});

// Also handle touchstart for extra responsiveness (optional, avoids 300ms delay)
tapButton.addEventListener('touchstart', (e) => {
  e.preventDefault();   // prevent double firing
  handleTap();
}, { passive: false });

// START button
startButton.addEventListener('click', (e) => {
  e.preventDefault();
  startGame();
});

// PLAY AGAIN button
playAgainButton.addEventListener('click', (e) => {
  e.preventDefault();
  startGame();   // startGame already calls resetGame
});

// --- Initialization on page load ---
(function init() {
  // Make sure everything is in a clean state
  gameActive = false;
  stopTimer();
  score = 0;
  timeLeft = 20;
  scoreDisplay.textContent = '0';
  timerDisplay.textContent = '20';
  timerRing.classList.remove('warning');
  tapButton.disabled = true;      // disabled until game starts
  
  // Buttons: start visible, play again hidden
  startButton.classList.remove('hidden');
  playAgainButton.classList.add('hidden');
  
  // Show best score
  bestDisplay.textContent = bestScore;
  
  // Preload any vibration? not needed
})();

// --- Extra: prevent accidental zoom / double-tap zoom on the button area ---
document.addEventListener('touchstart', (e) => {
  if (e.target.closest('.tap-btn') || e.target.closest('.btn')) {
    // it's fine; we prevent default on buttons individually
  }
}, { passive: true });

// Avoid context menu on long press for a cleaner game feel
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
});