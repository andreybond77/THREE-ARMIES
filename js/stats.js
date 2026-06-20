// ============================================================
// СТАТИСТИКА
// ============================================================

function initStatsPage() {
    // Отображаем статистику
    renderStats();
    
    // ===== КНОПКА "СБРОСИТЬ СТАТИСТИКУ" =====
    document.getElementById('resetStatsBtn').addEventListener('click', () => {
        if (confirm('⚠️ Сбросить всю статистику?')) {
            localStorage.removeItem('tripleColorStats');
            // Если есть функция синхронизации с сервером
            if (typeof savePlayerData === 'function') {
                const emptyStats = JSON.parse(JSON.stringify(DEFAULT_STATS));
                savePlayerData(emptyStats);
            }
            renderStats();
            alert('✅ Статистика сброшена!');
        }
    });
    
    // ===== КНОПКА "НА ГЛАВНУЮ" =====
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'start.html';
    });
    
    // ===== КНОПКА "ТАБЛИЦА ЛИДЕРОВ" =====
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
            // Проверяем наличие SDK
            if (typeof ysdk !== 'undefined' && ysdk) {
                if (typeof showLeaderboard === 'function') {
                    showLeaderboard();
                } else {
                    alert('⚠️ Функция таблицы лидеров временно недоступна.');
                }
            } else {
                // Если SDK не инициализирован — предлагаем войти
                if (confirm('Для просмотра таблицы лидеров необходимо войти в аккаунт Яндекс.\n\nПерейти на страницу авторизации?')) {
                    window.location.href = 'auth.html';
                }
            }
        });
    }
    
    // ===== СИНХРОНИЗАЦИЯ С СЕРВЕРОМ =====
    // Если есть функция синхронизации — выполняем
    if (typeof syncStats === 'function') {
        syncStats().then(() => {
            renderStats();
        }).catch(() => {
            // Если ошибка — просто показываем локальные данные
            renderStats();
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initStatsPage();
});