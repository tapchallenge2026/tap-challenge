// ============================
// Tap Challenge Game - Main Script
// ============================

const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// ===== Game State =====
const GAME_STATE = {
    balance: 0,
    energy: 1000,
    maxEnergy: 1000,
    tapValue: 1,
    userId: null,
    userName: 'Player'
};

// Load from localStorage
function loadState() {
    const saved = localStorage.getItem('tapGameState');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(GAME_STATE, parsed);
    }
}

// Save state
function saveState() {
    localStorage.setItem('tapGameState', JSON.stringify({
        balance: GAME_STATE.balance,
        energy: GAME_STATE.energy,
        maxEnergy: GAME_STATE.maxEnergy,
        tapValue: GAME_STATE.tapValue
    }));
}

// ===== User Init =====
function initUser() {
    if (tg && tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        GAME_STATE.userId = user.id;
        GAME_STATE.userName = user.first_name || 'Player';

        document.getElementById('userName').textContent = GAME_STATE.userName;
        if (user.photo_url) {
            document.getElementById('userPhoto').src = user.photo_url;
        }
    }
}

// ===== UI Updates =====
function updateUI() {
    document.getElementById('balance').textContent = formatNumber(GAME_STATE.balance);
    document.getElementById('energyText').textContent = 
        `${Math.floor(GAME_STATE.energy)}/${GAME_STATE.maxEnergy}`;
    
    const energyPercent = (GAME_STATE.energy / GAME_STATE.maxEnergy) * 100;
    document.getElementById('energyFill').style.width = `${energyPercent}%`;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return Math.floor(num).toString();
}

// ===== Tap Handler =====
const tapCoin = document.getElementById('tapCoin');
const tapPoints = document.getElementById('tapPoints');

let tapCooldown = false;

function handleTap(e) {
    if (GAME_STATE.energy < GAME_STATE.tapValue) {
        showEnergyWarning();
        return;
    }

    // Haptic feedback
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }

    GAME_STATE.balance += GAME_STATE.tapValue;
    GAME_STATE.energy -= GAME_STATE.tapValue;

    updateUI();
    showFloatingPoints(e);
    saveState();
}

function showFloatingPoints(e) {
    const rect = tapCoin.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const point = document.createElement('div');
    point.className = 'tap-points show';
    point.textContent = `+${GAME_STATE.tapValue}`;
    point.style.left = x + 'px';
    point.style.top = y + 'px';
    
    tapCoin.parentElement.appendChild(point);
    
    setTimeout(() => point.remove(), 800);
}

function showEnergyWarning() {
    if (tg?.showAlert) {
        tg.showAlert('⚡ Energy illa! Wait pannunga, regenerate aagum.');
    } else {
        alert('⚡ Energy illa!');
    }
}

// ===== Multi-touch Support =====
tapCoin.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
        handleTap(e.touches[i]);
    }
}, { passive: false });

tapCoin.addEventListener('click', (e) => {
    handleTap(e);
});

// ===== Energy Regeneration =====
setInterval(() => {
    if (GAME_STATE.energy < GAME_STATE.maxEnergy) {
        GAME_STATE.energy = Math.min(
            GAME_STATE.energy + 5,
            GAME_STATE.maxEnergy
        );
        updateUI();
    }
}, 1000); // +5 energy per second

// ===== Bottom Nav =====
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.dataset.tab;
        // Ippo just alert - neenga pages add pannalam
        if (tab !== 'home') {
            if (tg?.showAlert) tg.showAlert(`${tab} page coming soon!`);
        }
    });
});

// ===== Sync with Server =====
async function syncWithServer() {
    if (!GAME_STATE.userId) return;
    
    try {
        // Ithu un backend API endpoint
        await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: GAME_STATE.userId,
                balance: GAME_STATE.balance,
                energy: GAME_STATE.energy,
                initData: tg?.initData
            })
        });
    } catch (err) {
        console.error('Sync failed:', err);
    }
}

// Sync every 30 seconds
setInterval(syncWithServer, 30000);

// Sync on close
window.addEventListener('beforeunload', () => {
    saveState();
    syncWithServer();
});

// ===== Init =====
loadState();
initUser();
updateUI();
