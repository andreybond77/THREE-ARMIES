// ============================================================
// АВТОРИЗАЦИЯ
// ============================================================

function initAuthPage() {
    const yandexBtn = document.getElementById('yandexLoginBtn');
    const guestBtn = document.getElementById('guestBtn');
    const backBtn = document.getElementById('backBtn');
    
    if (yandexBtn) {
        yandexBtn.addEventListener('click', () => {
            if (typeof loginToYa === 'function') {
                loginToYa();
            } else {
                alert('Функция авторизации временно недоступна');
            }
        });
    }
    
    if (guestBtn) {
        guestBtn.addEventListener('click', () => {
            window.location.href = 'start.html';
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'start.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initAuthPage();
});