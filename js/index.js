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
}

document.addEventListener('DOMContentLoaded', function() {
    initFacadePage();
});