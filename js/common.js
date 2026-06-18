// ============================================================
// ОБЩИЕ ФУНКЦИИ ДЛЯ ВСЕХ СТРАНИЦ
// ============================================================

let ysdk = null;
let isAuthenticated = false;
let playerName = 'ИГРОК';
let currentLanguage = 'ru';
let sdkInitialized = false;

// ===== SDK =====
async function initSDK() {
    try {
        if (typeof YaGames !== 'undefined') {
            ysdk = await YaGames.init();
            sdkInitialized = true;
            console.log('✅ SDK Яндекс Игр инициализирован');
            await detectLanguage();
            if (ysdk.features && ysdk.features.LoadingAPI) {
                ysdk.features.LoadingAPI.ready();
                console.log('✅ LoadingAPI.ready() вызван');
            }
            if (ysdk.on) {
                ysdk.on('pause', () => {
                    console.log('Игра на паузе');
                    if (window.game && window.game.isRunning) {
                        window.game.isPaused = true;
                        window.game.draw();
                    }
                });
                ysdk.on('resume', () => {
                    console.log('Игра возобновлена');
                    if (window.game && window.game.isPaused) {
                        window.game.isPaused = false;
                        window.game.draw();
                    }
                });
            }
            return true;
        } else {
            console.warn('⚠️ SDK Яндекс Игр не загружен (локальный режим)');
            return false;
        }
    } catch (error) {
        console.error('Ошибка инициализации SDK:', error);
        return false;
    }
}

async function detectLanguage() {
    if (ysdk) {
        try {
            const env = await ysdk.getEnvironment();
            currentLanguage = env.language || 'ru';
            console.log(`🌐 Определён язык: ${currentLanguage}`);
        } catch (e) {
            currentLanguage = 'ru';
        }
    }
    return currentLanguage;
}

async function loginToYa() {
    if (!ysdk) return;
    try {
        const player = await ysdk.getPlayer({ scopes: true });
        isAuthenticated = true;
        playerName = player.getName() || 'ИГРОК';
        console.log(`✅ Авторизация успешна: ${playerName}`);
        alert(`Добро пожаловать, ${playerName}!`);
        window.location.href = 'start.html';
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        alert('Не удалось войти в аккаунт');
    }
}

// ===== СТАТИСТИКА =====
const DEFAULT_STATS = {
    easy: { player: 0, computer: 0, games: 0 },
    medium: { player: 0, computer: 0, games: 0 },
    hard: { player: 0, computer: 0, games: 0 },
    total: { player: 0, computer: 0, games: 0 }
};

function loadStats() {
    try {
        const s = JSON.parse(localStorage.getItem('tripleColorStats') || 'null');
        return s && s.total ? s : JSON.parse(JSON.stringify(DEFAULT_STATS));
    } catch { return JSON.parse(JSON.stringify(DEFAULT_STATS)); }
}

function saveStats(stats) {
    localStorage.setItem('tripleColorStats', JSON.stringify(stats));
}

function saveGameResult(difficulty, winner) {
    const stats = loadStats();
    stats[difficulty].games++;
    stats[difficulty][winner]++;
    stats.total.games++;
    stats.total[winner]++;
    saveStats(stats);
}

function renderStats() {
    const s = loadStats();
    document.getElementById('playerWins').textContent = s.total.player;
    document.getElementById('computerWins').textContent = s.total.computer;
    document.getElementById('totalGames').textContent = s.total.games;
    document.getElementById('easyPlayer').textContent = s.easy.player;
    document.getElementById('easyComputer').textContent = s.easy.computer;
    document.getElementById('easyTotal').textContent = s.easy.games;
    document.getElementById('mediumPlayer').textContent = s.medium.player;
    document.getElementById('mediumComputer').textContent = s.medium.computer;
    document.getElementById('mediumTotal').textContent = s.medium.games;
    document.getElementById('hardPlayer').textContent = s.hard.player;
    document.getElementById('hardComputer').textContent = s.hard.computer;
    document.getElementById('hardTotal').textContent = s.hard.games;
}

// ===== ОБНОВЛЕНИЕ БЕЙДЖИКА СЛОЖНОСТИ (для game.html) =====
function updateDifficultyBadge() {
    const difficulty = localStorage.getItem('tripleColorDifficulty') || 'easy';
    const badges = {
        easy: '🟢 ЛЁГКАЯ',
        medium: '🟡 СРЕДНЯЯ',
        hard: '🔴 СЛОЖНАЯ'
    };
    
    const badge = document.getElementById('difficultyBadge');
    if (badge) {
        badge.textContent = badges[difficulty] || '🟢 ЛЁГКАЯ';
        badge.classList.remove('loading');
    }
}