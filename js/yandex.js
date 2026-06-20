// ============================================================
// YANDEX.GAMES — РЕКЛАМА, ЛИДЕРЫ, СОХРАНЕНИЕ
// ============================================================

let rewardedAdReady = false;

// ============================================================
// 1. РЕКЛАМА
// ============================================================

function showInterstitialAd(onClose, onError) {
    if (!ysdk) {
        console.warn('⚠️ SDK не инициализирован');
        if (onError) onError('SDK не инициализирован');
        return;
    }

    if (!ysdk.adv) {
        console.warn('⚠️ Реклама не поддерживается');
        if (onError) onError('Реклама не поддерживается');
        return;
    }

    if (window.game) {
        window.game.isPaused = true;
    }

    ysdk.adv.showFullscreenAdv({
        callbacks: {
            onClose: (wasShown) => {
                if (window.game) {
                    window.game.isPaused = false;
                    window.game.draw();
                }
                if (onClose) onClose(wasShown);
                console.log('✅ Interstitial реклама закрыта, показана:', wasShown);
            },
            onError: (error) => {
                if (window.game) {
                    window.game.isPaused = false;
                }
                console.error('❌ Ошибка Interstitial:', error);
                if (onError) onError(error);
            },
            onOpen: () => {
                console.log('📢 Interstitial реклама открыта');
            }
        }
    });
}

function showRewardedAd(onRewarded, onError, onClose) {
    if (!ysdk) {
        console.warn('⚠️ SDK не инициализирован');
        if (onError) onError('SDK не инициализирован');
        return;
    }

    if (!ysdk.adv) {
        console.warn('⚠️ Реклама не поддерживается');
        if (onError) onError('Реклама не поддерживается');
        return;
    }

    if (window.game) {
        window.game.isPaused = true;
    }

    ysdk.adv.showRewardedVideo({
        callbacks: {
            onOpen: () => {
                console.log('📢 Rewarded реклама открыта');
            },
            onClose: (wasRewarded) => {
                if (window.game) {
                    window.game.isPaused = false;
                    window.game.draw();
                }

                if (wasRewarded) {
                    console.log('✅ Rewarded реклама: награда получена!');
                    if (onRewarded) onRewarded();
                } else {
                    console.log('ℹ️ Rewarded реклама: награда НЕ получена');
                    if (onClose) onClose();
                }
            },
            onError: (error) => {
                if (window.game) {
                    window.game.isPaused = false;
                }
                console.error('❌ Ошибка Rewarded:', error);
                if (onError) onError(error);
            }
        }
    });
}

async function checkRewardedAdReady() {
    if (!ysdk || !ysdk.adv) return false;
    try {
        const available = await ysdk.adv.checkRewardedVideo();
        rewardedAdReady = available;
        return available;
    } catch (e) {
        console.error('❌ Ошибка проверки Rewarded:', e);
        return false;
    }
}

// ============================================================
// 2. СОХРАНЕНИЕ ПРОГРЕССА (Player API)
// ============================================================

async function savePlayerData(data) {
    if (!ysdk) {
        console.warn('⚠️ SDK не инициализирован, сохраняем в localStorage');
        localStorage.setItem('tripleColorStats', JSON.stringify(data));
        return false;
    }

    try {
        const player = await ysdk.getPlayer();
        await player.setData({
            'tripleColorStats': JSON.stringify(data)
        });
        console.log('✅ Данные сохранены на сервере Яндекс');
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения на сервере:', error);
        localStorage.setItem('tripleColorStats', JSON.stringify(data));
        return false;
    }
}

async function loadPlayerData() {
    if (!ysdk) {
        console.warn('⚠️ SDK не инициализирован, загружаем из localStorage');
        return loadStats();
    }

    try {
        const player = await ysdk.getPlayer();
        const data = await player.getData(['tripleColorStats']);
        
        if (data && data.tripleColorStats) {
            const parsed = JSON.parse(data.tripleColorStats);
            console.log('✅ Данные загружены с сервера Яндекс');
            return parsed;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки с сервера:', error);
    }
    
    return loadStats();
}

async function syncStats() {
    const localStats = loadStats();
    const serverStats = await loadPlayerData();
    
    if (serverStats) {
        const merged = mergeStats(localStats, serverStats);
        saveStats(merged);
        renderStats();
        await savePlayerData(merged);
        return merged;
    } else {
        await savePlayerData(localStats);
        return localStats;
    }
}

function mergeStats(local, server) {
    const result = JSON.parse(JSON.stringify(DEFAULT_STATS));
    const difficulties = ['easy', 'medium', 'hard'];
    
    for (const diff of difficulties) {
        result[diff].player = Math.max(local[diff]?.player || 0, server[diff]?.player || 0);
        result[diff].computer = Math.max(local[diff]?.computer || 0, server[diff]?.computer || 0);
        result[diff].games = Math.max(local[diff]?.games || 0, server[diff]?.games || 0);
    }
    
    result.total.player = result.easy.player + result.medium.player + result.hard.player;
    result.total.computer = result.easy.computer + result.medium.computer + result.hard.computer;
    result.total.games = result.easy.games + result.medium.games + result.hard.games;
    
    return result;
}

// ============================================================
// 3. ТАБЛИЦА ЛИДЕРОВ
// ============================================================

const LEADERBOARD_NAME = 'battleCommanderScore';

async function saveScoreToLeaderboard(score, extraData = {}) {
    if (!ysdk) {
        console.warn('⚠️ SDK не инициализирован');
        return false;
    }

    try {
        const player = await ysdk.getPlayer();
        await player.setLeaderboardScore(LEADERBOARD_NAME, score, extraData);
        console.log('✅ Рекорд сохранён в таблицу лидеров:', score);
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения в таблицу лидеров:', error);
        return false;
    }
}

async function showLeaderboard(leaderboardName = LEADERBOARD_NAME, onClose) {
    if (!ysdk) {
        alert('Таблица лидеров недоступна. Войдите в аккаунт.');
        return;
    }

    try {
        const leaderboard = await ysdk.getLeaderboard({
            leaderboardName: leaderboardName,
            includeUser: true
        });

        const modal = document.createElement('div');
        modal.className = 'leaderboard-modal';
        modal.innerHTML = `
            <div class="leaderboard-overlay">
                <div class="leaderboard-content">
                    <div class="leaderboard-header">
                        <h2>🏆 ТАБЛИЦА ЛИДЕРОВ</h2>
                        <button class="leaderboard-close" id="leaderboardCloseBtn">✕</button>
                    </div>
                    <div class="leaderboard-list" id="leaderboardList">
                        <div class="leaderboard-loading">Загрузка...</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.leaderboard-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                modal.remove();
                if (onClose) onClose();
            }
        });

        modal.querySelector('#leaderboardCloseBtn').addEventListener('click', () => {
            modal.remove();
            if (onClose) onClose();
        });

        const entries = leaderboard.entries || [];
        const listContainer = modal.querySelector('#leaderboardList');

        if (entries.length === 0) {
            listContainer.innerHTML = '<div class="leaderboard-empty">Пока нет записей. Станьте первым!</div>';
        } else {
            let html = '';
            entries.forEach((entry, index) => {
                const isPlayer = entry.player.isMe;
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                const extra = entry.extraData ? ` (${entry.extraData.difficulty || ''})` : '';
                html += `
                    <div class="leaderboard-entry ${isPlayer ? 'player-entry' : ''}">
                        <span class="leaderboard-rank">${medal}</span>
                        <span class="leaderboard-name">${entry.player.name || 'Аноним'}</span>
                        <span class="leaderboard-score">${entry.score}${extra}</span>
                    </div>
                `;
            });
            listContainer.innerHTML = html;
        }

        if (!document.getElementById('leaderboardStyles')) {
            const styles = document.createElement('style');
            styles.id = 'leaderboardStyles';
            styles.textContent = `
                .leaderboard-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }
                .leaderboard-content {
                    background: #1a1a2e;
                    border-radius: 20px;
                    padding: 25px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    border: 2px solid #ff9800;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                    display: flex;
                    flex-direction: column;
                }
                .leaderboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .leaderboard-header h2 {
                    color: #ff9800;
                    font-size: 24px;
                    margin: 0;
                }
                .leaderboard-close {
                    background: #f44336;
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-size: 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .leaderboard-close:hover {
                    background: #e53935;
                    transform: scale(1.05);
                }
                .leaderboard-list {
                    overflow-y: auto;
                    flex: 1;
                    max-height: 400px;
                }
                .leaderboard-entry {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    color: #ccc;
                    font-size: 15px;
                    transition: background 0.2s;
                    border-radius: 8px;
                }
                .leaderboard-entry:hover {
                    background: rgba(255,255,255,0.05);
                }
                .leaderboard-entry.player-entry {
                    background: rgba(255, 152, 0, 0.2);
                    border: 1px solid #ff9800;
                }
                .leaderboard-rank {
                    font-size: 20px;
                    min-width: 45px;
                }
                .leaderboard-name {
                    flex: 1;
                    margin-left: 10px;
                }
                .leaderboard-score {
                    color: #ff9800;
                    font-weight: bold;
                }
                .leaderboard-loading, .leaderboard-empty {
                    text-align: center;
                    color: #888;
                    padding: 30px 0;
                    font-size: 16px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @media (max-width: 480px) {
                    .leaderboard-content { padding: 20px 15px; }
                    .leaderboard-header h2 { font-size: 20px; }
                    .leaderboard-entry { font-size: 13px; padding: 10px 12px; }
                }
            `;
            document.head.appendChild(styles);
        }

    } catch (error) {
        console.error('❌ Ошибка открытия таблицы лидеров:', error);
        alert('Не удалось загрузить таблицу лидеров');
    }
}

// ============================================================
// 4. ПОДЕЛИТЬСЯ / ПРИГЛАСИТЬ
// ============================================================

async function shareResult(message) {
    if (!ysdk) {
        console.warn('⚠️ SDK не инициализирован');
        const fallback = message || 'Я играю в "Битву полководцев"! 🎮⚔️';
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Битва полководцев', text: fallback });
                return;
            } catch (e) {}
        }
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(fallback);
            alert('📋 Ссылка скопирована! Поделитесь с друзьями.');
        }
        return;
    }

    try {
        await ysdk.share({
            message: message || 'Я сыграл в "Битву полководцев" на Яндекс.Играх! Попробуйте и вы! 🎮⚔️',
            link: window.location.href
        });
        console.log('✅ Шаринг выполнен');
    } catch (error) {
        console.error('❌ Ошибка шаринга:', error);
    }
}

async function inviteFriend() {
    if (!ysdk) {
        console.warn('⚠️ SDK не инициализирован');
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Битва полководцев',
                    text: 'Приглашаю тебя в "Битву полководцев"! Сразимся? ⚔️',
                    url: window.location.href
                });
                return;
            } catch (e) {}
        }
        alert('Пригласите друга по ссылке: ' + window.location.href);
        return;
    }

    try {
        await ysdk.invite({
            message: 'Приглашаю тебя в "Битву полководцев"! Сразимся? ⚔️'
        });
        console.log('✅ Приглашение отправлено');
    } catch (error) {
        console.error('❌ Ошибка приглашения:', error);
    }
}

// ============================================================
// 5. ИНИЦИАЛИЗАЦИЯ
// ============================================================

async function syncAllGameData() {
    try {
        await syncStats();
        renderStats();
        await checkRewardedAdReady();
        console.log('✅ Все данные синхронизированы');
    } catch (e) {
        console.warn('⚠️ Частичная синхронизация:', e);
    }
}

// ============================================================
// 6. HAPTIC FEEDBACK (ВИБРАЦИЯ)
// ============================================================

async function hapticFeedback(type = 'light') {
    // Пробуем через Yandex SDK
    if (typeof ysdk !== 'undefined' && ysdk.hapticFeedback) {
        try {
            const impactTypes = {
                'light': 'light',
                'medium': 'medium',
                'heavy': 'heavy',
                'success': 'success',
                'error': 'error',
                'warning': 'warning'
            };
            
            await ysdk.hapticFeedback.impactOccurred(impactTypes[type] || 'light');
            console.log(`✅ Haptic feedback: ${type}`);
            return;
        } catch (e) {
            console.warn('⚠️ SDK Haptic не поддерживается, используем fallback');
        }
    }
    
    // Fallback на вибрацию браузера
    if ('vibrate' in navigator) {
        const patterns = {
            'light': [10],
            'medium': [20],
            'heavy': [40],
            'success': [50, 30, 50],
            'error': [100, 50, 100],
            'warning': [30, 20, 30]
        };
        
        navigator.vibrate(patterns[type] || [10]);
        console.log(`✅ Haptic feedback (fallback): ${type}`);
    }
}

// Проверка поддержки вибрации
function isHapticSupported() {
    return (typeof ysdk !== 'undefined' && ysdk.hapticFeedback) || 
           ('vibrate' in navigator);
}

// ============================================================
// 7. REQUEST REVIEW (ЗАПРОС ОТЗЫВА)
// ============================================================

async function requestReview() {
    if (typeof ysdk === 'undefined' || !ysdk.feedback) {
        console.warn('⚠️ Request Review не поддерживается');
        return false;
    }
    
    try {
        // Проверяем, можно ли запросить отзыв
        const canReview = await ysdk.feedback.canReview();
        
        if (canReview.value) {
            const result = await ysdk.feedback.requestReview();
            console.log('✅ Отзыв запрошен:', result);
            
            // Сохраняем время запроса
            localStorage.setItem('lastReviewRequest', Date.now().toString());
            
            return true;
        } else {
            console.log('ℹ️ Отзыв нельзя запросить сейчас');
            return false;
        }
    } catch (e) {
        console.warn('⚠️ Ошибка запроса отзыва:', e);
        return false;
    }
}

// Проверка, прошло ли достаточно времени с последнего запроса
function canRequestReview() {
    const lastRequest = localStorage.getItem('lastReviewRequest');
    if (!lastRequest) return true;
    
    const lastTime = parseInt(lastRequest);
    const now = Date.now();
    const oneDay = 86400000; // 24 часа в миллисекундах
    
    return (now - lastTime) > oneDay;
}

// ============================================================
// 8. BANNER ADS (БАННЕРНАЯ РЕКЛАМА)
// ============================================================

let bannerAdShown = false;
let bannerAdContainer = null;

function showBannerAd(containerId) {
    if (typeof ysdk === 'undefined' || !ysdk.adv) {
        console.warn('⚠️ Banner ads не поддерживаются');
        return false;
    }
    
    bannerAdContainer = document.getElementById(containerId);
    if (!bannerAdContainer) {
        console.warn('⚠️ Контейнер для баннера не найден:', containerId);
        return false;
    }
    
    try {
        ysdk.adv.showBannerAdv({
            containerId: containerId,
            callbacks: {
                onShown: () => {
                    bannerAdShown = true;
                    console.log('✅ Баннер показан');
                },
                onError: (error) => {
                    console.warn('⚠️ Ошибка баннера:', error);
                    bannerAdShown = false;
                },
                onHidden: () => {
                    bannerAdShown = false;
                    console.log('ℹ️ Баннер скрыт');
                }
            }
        });
        return true;
    } catch (e) {
        console.warn('️ Ошибка показа баннера:', e);
        return false;
    }
}

function hideBannerAd() {
    if (typeof ysdk === 'undefined' || !ysdk.adv) {
        return;
    }
    
    try {
        ysdk.adv.hideBannerAdv({
            callbacks: {
                onHidden: () => {
                    bannerAdShown = false;
                    console.log('️ Баннер скрыт');
                }
            }
        });
    } catch (e) {
        console.warn('⚠️ Ошибка скрытия баннера:', e);
    }
}

// Автоматический показ баннера при загрузке страницы
function initBannerAd(containerId = 'bannerAdContainer') {
    // Показываем баннер с задержкой
    setTimeout(() => {
        showBannerAd(containerId);
    }, 1000);
}