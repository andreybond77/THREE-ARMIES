// ============================================================
// СТАТИСТИКА
// ============================================================

function initStatsPage() {
    renderStats();
    
    document.getElementById('resetStatsBtn').addEventListener('click', () => {
        if (confirm('⚠️ Сбросить всю статистику?')) {
            localStorage.removeItem('tripleColorStats');
            renderStats();
            alert('✅ Статистика сброшена!');
        }
    });
    
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'start.html';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initStatsPage();
});