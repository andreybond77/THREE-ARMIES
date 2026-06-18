// ============================================================
// ВЫБОР СЛОЖНОСТИ
// ============================================================

function initDifficultyPage() {
    let selected = localStorage.getItem('tripleColorDifficulty') || 'easy';
    
    const descriptions = {
        easy: '🟢 ЛЁГКАЯ: Ты только вступаешь на ратный путь, ты молод и полон решимости, ты не боишься грядущих битв, ты встречаешь врага лицом к лицу. Хоть ты и молод, но ты хорошо понимаешь тактику боя и мудро выстраиваешь боевой порядок своей армии, выбирая из разных видов войск и видя, какие боевые порядки у врагов, а у врагов уже от страха трясутся ноги, ведь им предстоит сразиться с будущим великим полководцем.',
        medium: '🟡 СРЕДНЯЯ: Ты провёл много битв. У тебя было много побед, и к твоей горечи были поражения. Но поражения для тебя не прошли даром, ты извлёк из них тяжёлый, трудный, но жизненно важный опыт, который впоследствии спасал твои армии в боях. Теперь, не видя противника, ты можешь выстраивать боевой порядок своей армии из предоставленных видов войск.',
        hard: '🔴 СЛОЖНАЯ: Ты — Великий полководец. Твой путь к вершине Олимпа неумолим и идёт шаг за шагом от победы к победе. Ты уже потерял счёт победам, но хорошо помнишь каждое своё поражение, хоть их было мало. Ты настолько мастерски овладел тактикой боя, что тебе для успешной битвы не нужно видеть боевые порядки врагов и выстраивать свои. Ты способен сражаться любой армией против любого врага.'
    };
    
    const btns = document.querySelectorAll('.difficulty-btn');
    btns.forEach(btn => {
        if (btn.dataset.diff === selected) btn.classList.add('active');
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selected = btn.dataset.diff;
            localStorage.setItem('tripleColorDifficulty', selected);
            const descDiv = document.getElementById('difficultyDescription');
            descDiv.innerHTML = `<p>${descriptions[selected]}</p>`;
        });
    });
    
    const descDiv = document.getElementById('difficultyDescription');
    descDiv.innerHTML = `<p>${descriptions[selected]}</p>`;
    
    document.getElementById('startGameBtn').addEventListener('click', () => {
        window.location.href = 'game.html';
    });
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'start.html';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initDifficultyPage();
});