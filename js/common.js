// ============================================================
// ОБЩИЕ ФУНКЦИИ ДЛЯ ВСЕХ СТРАНИЦ
// ============================================================

let ysdk = null;
let isAuthenticated = false;
let playerName = 'ИГРОК';
let currentLanguage = 'ru';
let sdkInitialized = false;

// ============================================================
// 1. SDK
// ============================================================

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
            
            // Синхронизация данных после инициализации
            if (typeof syncAllGameData === 'function') {
                setTimeout(() => syncAllGameData(), 500);
            }
            
            return true;
        } else {
            console.warn('⚠️ SDK Яндекс Игр не загружен (локальный режим)');
            showSDKFallback();
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка инициализации SDK:', error);
        showSDKFallback();
        return false;
    }
}

function showSDKFallback() {
    const msg = document.getElementById('gameMessage');
    if (msg) {
        msg.textContent = 'ℹ️ Игра работает в локальном режиме. Войдите в аккаунт для сохранения прогресса.';
        msg.style.color = '#ff9800';
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
    if (!ysdk) {
        alert('SDK не инициализирован. Проверьте подключение к интернету.');
        return;
    }
    try {
        const player = await ysdk.getPlayer({ scopes: true });
        isAuthenticated = true;
        playerName = player.getName() || 'ИГРОК';
        console.log(`✅ Авторизация успешна: ${playerName}`);
        alert(`Добро пожаловать, ${playerName}!`);
        window.location.href = 'start.html';
    } catch (error) {
        console.error('❌ Ошибка авторизации:', error);
        alert('Не удалось войти в аккаунт. Попробуйте позже.');
    }
}

// ============================================================
// 2. СТАТИСТИКА
// ============================================================

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
    
    // Сохраняем на сервер (если есть функция)
    if (typeof savePlayerData === 'function') {
        savePlayerData(stats);
    }
}

function renderStats() {
    const s = loadStats();
    const elements = {
        playerWins: 'playerWins',
        computerWins: 'computerWins',
        totalGames: 'totalGames',
        easyPlayer: 'easyPlayer',
        easyComputer: 'easyComputer',
        easyTotal: 'easyTotal',
        mediumPlayer: 'mediumPlayer',
        mediumComputer: 'mediumComputer',
        mediumTotal: 'mediumTotal',
        hardPlayer: 'hardPlayer',
        hardComputer: 'hardComputer',
        hardTotal: 'hardTotal'
    };
    
    for (const [key, id] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) {
            const parts = key.match(/(easy|medium|hard|total)?(Player|Computer|Games)?/);
            if (parts) {
                if (key === 'playerWins') el.textContent = s.total.player;
                else if (key === 'computerWins') el.textContent = s.total.computer;
                else if (key === 'totalGames') el.textContent = s.total.games;
                else if (key.startsWith('easy')) {
                    const type = key.replace('easy', '').toLowerCase();
                    if (type === 'player') el.textContent = s.easy.player;
                    else if (type === 'computer') el.textContent = s.easy.computer;
                    else if (type === 'total') el.textContent = s.easy.games;
                } else if (key.startsWith('medium')) {
                    const type = key.replace('medium', '').toLowerCase();
                    if (type === 'player') el.textContent = s.medium.player;
                    else if (type === 'computer') el.textContent = s.medium.computer;
                    else if (type === 'total') el.textContent = s.medium.games;
                } else if (key.startsWith('hard')) {
                    const type = key.replace('hard', '').toLowerCase();
                    if (type === 'player') el.textContent = s.hard.player;
                    else if (type === 'computer') el.textContent = s.hard.computer;
                    else if (type === 'total') el.textContent = s.hard.games;
                }
            }
        }
    }
}

// ============================================================
// 3. ОБНОВЛЕНИЕ БЕЙДЖИКА СЛОЖНОСТИ
// ============================================================

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

// ============================================================
// 4. ДОПОЛНЕНИЯ ДЛЯ YANDEX.GAMES
// ============================================================

function saveGameResultWithLeaderboard(difficulty, winner, score) {
    saveGameResult(difficulty, winner);
    
    if (winner === 'player' && score > 0 && typeof saveScoreToLeaderboard === 'function') {
        const leaderboardScore = Math.round(score * 10 + 
            (difficulty === 'hard' ? 50 : difficulty === 'medium' ? 25 : 0));
        saveScoreToLeaderboard(leaderboardScore, { difficulty: difficulty });
    }
}