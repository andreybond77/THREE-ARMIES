// ============================================================
// ФАСАДНАЯ СТРАНИЦА
// ============================================================

function initFacadePage() {
    const menuBtn = document.getElementById('facadeMenuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            window.location.href = 'start.html';
        });
    }
    
    // Регистрация Service Worker для кэширования
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker зарегистрирован:', registration);
            })
            .catch((error) => {
                console.warn('⚠️ Ошибка регистрации Service Worker:', error);
            });
    }
    
    // Скрыть loading screen после загрузки
    window.addEventListener('load', () => {
        // Анимируем прогресс-бар
        const progressBar = document.getElementById('loadingProgressBar');
        if (progressBar) {
            setTimeout(() => {
                progressBar.style.width = '100%';
            }, 100);
        }
        
        // Скрываем экран загрузки через 1.5 секунды
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.remove();
                }, 500);
            }
        }, 1500);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initFacadePage();
});