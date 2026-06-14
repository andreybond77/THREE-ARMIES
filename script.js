// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let ysdk = null;
let isAuthenticated = false;
let playerName = 'ИГРОК';
let currentLanguage = 'ru';
let sdkInitialized = false;

// ==================== ИНИЦИАЛИЗАЦИЯ SDK ====================
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
            
            // Не проверяем авторизацию автоматически, ждём действия пользователя
            
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
            console.warn('SDK Яндекс Игр не загружен');
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

// Авторизация через Яндекс ID
async function loginToYa() {
    if (!ysdk) return;
    try {
        const player = await ysdk.getPlayer({ scopes: true });
        isAuthenticated = true;
        playerName = player.getName() || 'ИГРОК';
        console.log(`✅ Авторизация успешна: ${playerName}`);
        
        // Показываем уведомление об успешном входе
        alert(`Добро пожаловать, ${playerName}!`);
        
        // Возвращаемся на стартовую страницу
        window.location.href = 'start.html';
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        alert('Не удалось войти в аккаунт');
    }
}

// Выход из аккаунта (если понадобится)
async function logoutFromYa() {
    if (!ysdk) return;
    try {
        await ysdk.getPlayer({ scopes: false, logout: true });
        isAuthenticated = false;
        playerName = 'ИГРОК';
        console.log('✅ Выход из аккаунта выполнен');
        alert('Вы вышли из аккаунта');
        window.location.href = 'start.html';
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
}

// ==================== СТАТИСТИКА ====================
let selectedDifficulty = localStorage.getItem('tripleColorDifficulty') || 'easy';

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

// ==================== НАВИГАЦИЯ ====================

function initFacadePage() {
    const menuBtn = document.getElementById('facadeMenuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            window.location.href = 'start.html';
        });
    }
}

function initStartPage() {
    document.getElementById('rulesBtn').addEventListener('click', () => window.location.href = 'rules.html');
    document.getElementById('difficultyBtn').addEventListener('click', () => window.location.href = 'difficulty.html');
    document.getElementById('startBtn').addEventListener('click', () => window.location.href = 'game.html');
    document.getElementById('statsBtn').addEventListener('click', () => window.location.href = 'stats.html');
    
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.addEventListener('click', () => window.location.href = 'auth.html');
    }
}

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

function initRulesPage() {
    document.getElementById('backBtn').addEventListener('click', () => window.location.href = 'start.html');
}

function initDifficultyPage() {
    let selected = localStorage.getItem('tripleColorDifficulty') || 'easy';
    const descriptions = {
        easy: 'Ты только вступаешь на ратный путь, ты молод и полон решимости, ты не боишься грядущих битв, ты встречаешь врага лицом к лицу. Хоть ты и молод, но ты хорошо понимаешь тактику боя и мудро выстраиваешь боевой порядок своей армии, выбирая из разных видов войск и видя, какие боевые порядки у врагов, а у врагов уже от страха трясутся ноги, ведь им предстоит сразиться с будущим великим полководцем.',
        medium: 'Ты провёл много битв. У тебя было много побед, и к твоей горечи были поражения. Но поражения для тебя не прошли даром, ты извлёк из них тяжёлый, трудный, но жизненно важный опыт, который впоследствии спасал твои армии в боях. Теперь, не видя противника, ты можешь выстраивать боевой порядок своей армии из предоставленных видов войск.',
        hard: 'Ты — Великий полководец. Твой путь к вершине Олимпа неумолим и идёт шаг за шагом от победы к победе. Ты уже потерял счёт победам, но хорошо помнишь каждое своё поражение, хоть их было мало. Ты настолько мастерски овладел тактикой боя, что тебе для успешной битвы не нужно видеть боевые порядки врагов и выстраивать свои. Ты способен сражаться любой армией против любого врага.'
    };
    
    const btns = document.querySelectorAll('.difficulty-page-btn');
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
    
    document.getElementById('startGameBtn').addEventListener('click', () => window.location.href = 'game.html');
    document.getElementById('backBtn').addEventListener('click', () => window.location.href = 'start.html');
}

function initStatsPage() {
    document.getElementById('resetStatsBtn').addEventListener('click', () => {
        if (confirm('⚠️ Сбросить всю статистику?')) {
            localStorage.removeItem('tripleColorStats');
            renderStats();
            alert('✅ Статистика сброшена!');
        }
    });
    document.getElementById('backBtn').addEventListener('click', () => window.location.href = 'start.html');
}

function initGamePage() {
    const difficulty = localStorage.getItem('tripleColorDifficulty') || 'easy';
    window.game = new TripleColorGame(difficulty);
}

// ==================== КЛАСС ИГРЫ ====================
class TripleColorGame {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.cellSize = 60;
        this.canvas = document.getElementById('boardCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.currentPlayer = 0;
        this.playerScore = 0;
        this.computerScore = 0;
        this.selectedPiece = null;
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.gameActive = true;
        
        this.colors = ['red', 'green', 'blue'];
        this.predatorMap = { 'red': 'green', 'green': 'blue', 'blue': 'red' };
        
        this.waitingForPlacement = false;
        this.placementRemaining = 0;
        this.currentPlacementColor = null;
        this.placementIndex = 0;
        this.placementColors = [];
        
        this.setupEventListeners();
        this.initGame();
    }
    
    setupEventListeners() {
        if (this.canvas) this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        const exitBtn = document.getElementById('exitBtn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                if (confirm('Выйти в главное меню?')) window.location.href = 'index.html';
            });
        }
    }
    
    initGame() {
        if (this.difficulty === 'easy') this.setupEasyMode();
        else if (this.difficulty === 'medium') this.setupMediumMode();
        else this.setupHardMode();
        this.updateUI();
        this.draw();
    }
    
    // ==================== ЛЁГКИЙ УРОВЕНЬ ====================
    setupEasyMode() {
        const computerPositions = this.getComputerPositions();
        const colorOrder = ['red', 'green', 'blue'];
        let colorIdx = 0;
        for (const pos of computerPositions) {
            this.board[pos.row][pos.col] = { color: colorOrder[colorIdx % 3], player: 1 };
            colorIdx++;
        }
        this.startPlacementEasy();
        this.showMessage('Расставьте 12 шашек. Выбирайте цвет шашки', '#2196F3');
    }
    
    startPlacementEasy() {
        this.waitingForPlacement = true;
        this.placementRemaining = 12;
        this.selectColorMode = true;
        this.createEasyColorSelector();
    }
    
    createEasyColorSelector() {
        const panel = document.getElementById('placementPanel');
        panel.innerHTML = '';
        
        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'color-selector-circle';
        
        const colorMap = {
            red: { emoji: '🔴', name: 'КРАСНАЯ' },
            green: { emoji: '🟢', name: 'ЗЕЛЁНАЯ' },
            blue: { emoji: '🔵', name: 'СИНЯЯ' }
        };
        
        for (const color of this.colors) {
            const btn = document.createElement('button');
            btn.className = 'circle-piece-btn';
            btn.setAttribute('data-color', color);
            btn.innerHTML = colorMap[color].emoji;
            btn.title = colorMap[color].name;
            btn.onclick = () => {
                this.currentPlacementColor = color;
                this.showMessage(`Выбран цвет: ${colorMap[color].name}. Выберите клетку (осталось ${this.placementRemaining})`, '#4CAF50');
                document.querySelectorAll('.circle-piece-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            selectorDiv.appendChild(btn);
        }
        
        panel.appendChild(selectorDiv);
        panel.style.display = 'block';
        this.showMessage(`Выберите цвет шашки (осталось ${this.placementRemaining})`, '#2196F3');
        this.draw();
    }
    
    // ==================== СРЕДНИЙ УРОВЕНЬ ====================
    setupMediumMode() {
        const computerPositions = this.getComputerPositions();
        const colorOrder = ['red', 'green', 'blue'];
        let colorIdx = 0;
        for (const pos of computerPositions) {
            this.board[pos.row][pos.col] = { color: colorOrder[colorIdx % 3], player: 1 };
            colorIdx++;
        }
        
        this.computerBoardBackup = JSON.parse(JSON.stringify(this.board));
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j] && this.board[i][j].player === 1) this.board[i][j] = null;
            }
        }
        
        this.startPlacementMedium();
    }
    
    startPlacementMedium() {
        this.waitingForPlacement = true;
        this.placementRemaining = 12;
        this.placementIndex = 0;
        this.placementColors = [];
        for (let i = 0; i < 12; i++) {
            this.placementColors.push(this.colors[Math.floor(Math.random() * 3)]);
        }
        
        const panel = document.getElementById('placementPanel');
        panel.innerHTML = '';
        
        const mediumContainer = document.createElement('div');
        mediumContainer.className = 'medium-placement';
        
        const pseudoPiece = document.createElement('div');
        pseudoPiece.className = 'medium-pseudo-piece';
        pseudoPiece.id = 'mediumPseudoPiece';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'medium-placement-text';
        textDiv.id = 'mediumPlacementText';
        
        mediumContainer.appendChild(pseudoPiece);
        mediumContainer.appendChild(textDiv);
        panel.appendChild(mediumContainer);
        panel.style.display = 'block';
        
        this.updateMediumPlacementDisplay();
        this.draw();
    }
    
    updateMediumPlacementDisplay() {
        const pseudoPiece = document.getElementById('mediumPseudoPiece');
        const textDiv = document.getElementById('mediumPlacementText');
        
        if (!pseudoPiece || !textDiv) return;
        
        if (this.placementIndex < 12) {
            const color = this.placementColors[this.placementIndex];
            const colorMap = { red: '🔴', green: '🟢', blue: '🔵' };
            const colorNameMap = { red: 'КРАСНУЮ', green: 'ЗЕЛЁНУЮ', blue: 'СИНЮЮ' };
            const remaining = 12 - this.placementIndex;
            
            pseudoPiece.innerHTML = colorMap[color];
            textDiv.innerHTML = `Поставьте ${colorNameMap[color]} шашку (осталось ${remaining})`;
        }
    }
    
    // ==================== СЛОЖНЫЙ УРОВЕНЬ ====================
    setupHardMode() {
        const computerPositions = this.getComputerPositions();
        const shuffledComp = [...computerPositions];
        for (let i = shuffledComp.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledComp[i], shuffledComp[j]] = [shuffledComp[j], shuffledComp[i]];
        }
        const compColors = [];
        for (let i = 0; i < 12; i++) compColors.push(this.colors[Math.floor(Math.random() * 3)]);
        for (let i = 0; i < 12; i++) {
            this.board[shuffledComp[i].row][shuffledComp[i].col] = { color: compColors[i], player: 1 };
        }
        
        const playerPositions = this.getPlayerPositions();
        const shuffledPlayer = [...playerPositions];
        for (let i = shuffledPlayer.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlayer[i], shuffledPlayer[j]] = [shuffledPlayer[j], shuffledPlayer[i]];
        }
        const playerColorsList = [];
        for (let i = 0; i < 12; i++) playerColorsList.push(this.colors[Math.floor(Math.random() * 3)]);
        for (let i = 0; i < 12; i++) {
            this.board[shuffledPlayer[i].row][shuffledPlayer[i].col] = { color: playerColorsList[i], player: 0 };
        }
        
        this.gameActive = true;
        this.currentPlayer = 0;
        this.showMessage('Игра началась! Ваш ход', '#4CAF50');
        this.draw();
    }
    
    finishPlacement() {
        this.waitingForPlacement = false;
        if (this.difficulty === 'medium' && this.computerBoardBackup) {
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if (this.computerBoardBackup[i][j] && this.computerBoardBackup[i][j].player === 1) {
                        this.board[i][j] = this.computerBoardBackup[i][j];
                    }
                }
            }
        }
        const panel = document.getElementById('placementPanel');
        if (panel) panel.style.display = 'none';
        this.gameActive = true;
        this.currentPlayer = 0;
        this.updateUI();
        this.draw();
        this.showMessage('Расстановка завершена! Ваш ход', '#4CAF50');
    }
    
    handlePlacement(row, col) {
        if (!this.waitingForPlacement) return false;
        if (row < 5 || row > 7) {
            this.showMessage('Шашки можно ставить только в свои ряды (5-7)', '#f44336');
            return false;
        }
        if ((row + col) % 2 !== 1) {
            this.showMessage('Шашки ставятся только на тёмные клетки', '#f44336');
            return false;
        }
        if (this.board[row][col] !== null) {
            this.showMessage('Эта клетка уже занята', '#f44336');
            return false;
        }
        
        if (this.difficulty === 'easy') {
            if (!this.currentPlacementColor) {
                this.showMessage('Сначала выберите цвет шашки', '#f44336');
                return false;
            }
            this.board[row][col] = { color: this.currentPlacementColor, player: 0 };
            this.placementRemaining--;
            if (this.placementRemaining > 0) {
                this.showMessage(`Выберите цвет для следующей шашки (осталось ${this.placementRemaining})`, '#2196F3');
                document.querySelectorAll('.circle-piece-btn').forEach(b => b.classList.remove('active'));
                this.currentPlacementColor = null;
            } else {
                this.finishPlacement();
            }
        } else if (this.difficulty === 'medium') {
            this.board[row][col] = { color: this.currentPlacementColor, player: 0 };
            this.placementIndex++;
            if (this.placementIndex < 12) {
                this.currentPlacementColor = this.placementColors[this.placementIndex];
                this.updateMediumPlacementDisplay();
                this.showMessage(`Поставьте шашку на свободную клетку`, '#4CAF50');
                this.draw();
            } else {
                this.finishPlacement();
            }
        }
        this.draw();
        return true;
    }
    
    getComputerPositions() {
        const positions = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) positions.push({ row, col });
            }
        }
        return positions;
    }
    
    getPlayerPositions() {
        const positions = [];
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) positions.push({ row, col });
            }
        }
        return positions;
    }
    
    getColorName(color) {
        return color === 'red' ? '🔴 КРАСНАЯ' : (color === 'green' ? '🟢 ЗЕЛЁНАЯ' : '🔵 СИНЯЯ');
    }
    
    handleCanvasClick(e) {
        if (!this.gameActive && !this.waitingForPlacement) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        const col = Math.floor(mouseX / this.cellSize);
        const row = Math.floor(mouseY / this.cellSize);
        
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return;
        
        if (this.waitingForPlacement) {
            this.handlePlacement(row, col);
            return;
        }
        
        if (this.currentPlayer !== 0) {
            this.showMessage('Сейчас ход компьютера', '#f44336');
            return;
        }
        
        if (this.selectedPiece === null) {
            const piece = this.board[row][col];
            if (piece && piece.player === 0) {
                this.selectedPiece = { row, col, piece };
                this.showMessage(`Выбрана ${this.getColorName(piece.color)} шашка. Выберите клетку`, '#4CAF50');
                this.draw();
                this.drawSelectedHighlight(row, col);
            } else {
                this.showMessage('Выберите свою шашку', '#f44336');
            }
        } else {
            this.makeMove(this.selectedPiece.row, this.selectedPiece.col, row, col);
        }
    }
    
    isValidMove(piece, fromRow, fromCol, toRow, toCol) {
        const target = this.board[toRow][toCol];
        const dx = toCol - fromCol;
        const dy = toRow - fromRow;
        const isMove = (Math.abs(dx) + Math.abs(dy) === 1) && (dx === 0 || dy === 0);
        const isCapture = (Math.abs(dx) === 1 && Math.abs(dy) === 1);
        
        if (isMove && target === null) return { valid: true, type: 'move' };
        if (isCapture && target && target.player === 1) {
            if (this.predatorMap[piece.color] === target.color) return { valid: true, type: 'capture', target };
            if (piece.color === target.color) return { valid: true, type: 'swap', target };
        }
        return { valid: false };
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.player !== 0) {
            this.showMessage('Ошибка: шашка не найдена', '#f44336');
            this.selectedPiece = null;
            return;
        }
        
        const move = this.isValidMove(piece, fromRow, fromCol, toRow, toCol);
        if (!move.valid) {
            this.showMessage('Недопустимый ход', '#f44336');
            this.selectedPiece = null;
            this.draw();
            return;
        }
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        if (move.type === 'capture') {
            this.playerScore++;
            this.updateUI();
            this.showMessage(`+1 очко! Съедена ${this.getColorName(move.target.color)} шашка`, '#4CAF50');
        } else if (move.type === 'swap') {
            const targetPiece = move.target;
            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = targetPiece;
            this.showMessage('Шашки поменялись местами', '#ff9800');
        }
        
        this.selectedPiece = null;
        this.draw();
        this.checkGameOver();
        
        if (this.gameActive) {
            this.currentPlayer = 1;
            this.updateUI();
            this.showMessage('Ход компьютера...', '#ff9800');
            setTimeout(() => this.computerMove(), 400);
        }
    }
    
    computerMove() {
        if (!this.gameActive || this.currentPlayer !== 1) return;
        
        const computerPieces = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.board[i][j];
                if (p && p.player === 1) computerPieces.push({ row: i, col: j, piece: p });
            }
        }
        
        if (computerPieces.length === 0) { this.endGame('player'); return; }
        
        let moves = [];
        for (const piece of computerPieces) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const newRow = piece.row + dr;
                    const newCol = piece.col + dc;
                    if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) continue;
                    const target = this.board[newRow][newCol];
                    const isDiagonal = Math.abs(dr) === 1 && Math.abs(dc) === 1;
                    const isStraight = (dr === 0 || dc === 0) && Math.abs(dr) + Math.abs(dc) === 1;
                    
                    if (isStraight && target === null) {
                        moves.push({ from: piece, to: { row: newRow, col: newCol }, type: 'move', score: 0 });
                    }
                    if (isDiagonal && target && target.player === 0) {
                        if (this.predatorMap[piece.piece.color] === target.color) {
                            moves.push({ from: piece, to: { row: newRow, col: newCol }, type: 'capture', target, score: 100 });
                        }
                        if (piece.piece.color === target.color) {
                            moves.push({ from: piece, to: { row: newRow, col: newCol }, type: 'swap', target, score: 30 });
                        }
                    }
                }
            }
        }
        
        if (moves.length === 0) {
            if (this.hasPlayerMoves()) {
                this.currentPlayer = 0;
                this.updateUI();
                this.showMessage('Ваш ход', '#4CAF50');
            } else {
                this.endGame('computer');
            }
            return;
        }
        
        let selectedMove;
        
        if (this.difficulty === 'easy') {
            selectedMove = moves[Math.floor(Math.random() * moves.length)];
        } else {
            for (const move of moves) {
                let extraScore = move.score;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const checkRow = move.to.row + dr;
                        const checkCol = move.to.col + dc;
                        if (checkRow >= 0 && checkRow < 8 && checkCol >= 0 && checkCol < 8) {
                            const nearby = this.board[checkRow][checkCol];
                            if (nearby && nearby.player === 0) {
                                if (this.predatorMap[move.from.piece.color] === nearby.color) extraScore += 50;
                                if (this.predatorMap[nearby.color] === move.from.piece.color) extraScore -= 30;
                            }
                        }
                    }
                }
                move.score = extraScore;
            }
            moves.sort((a, b) => b.score - a.score);
            const bestScore = moves[0].score;
            const bestMoves = moves.filter(m => m.score === bestScore);
            selectedMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
        
        const from = selectedMove.from;
        const to = selectedMove.to;
        
        if (selectedMove.type === 'capture') {
            this.computerScore++;
            this.updateUI();
            this.board[to.row][to.col] = from.piece;
            this.board[from.row][from.col] = null;
            this.showMessage(`Компьютер съел вашу шашку! -1 очко`, '#f44336');
        } else if (selectedMove.type === 'swap') {
            const targetPiece = this.board[to.row][to.col];
            this.board[to.row][to.col] = from.piece;
            this.board[from.row][from.col] = targetPiece;
            this.showMessage('Компьютер поменялся шашками', '#ff9800');
        } else {
            this.board[to.row][to.col] = from.piece;
            this.board[from.row][from.col] = null;
            this.showMessage('Компьютер сделал ход', '#ff9800');
        }
        
        this.draw();
        this.checkGameOver();
        
        if (this.gameActive) {
            this.currentPlayer = 0;
            this.updateUI();
            this.showMessage('Ваш ход. Выберите шашку', '#4CAF50');
        }
    }
    
    hasPlayerMoves() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.board[i][j];
                if (p && p.player === 0) {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const newRow = i + dr;
                            const newCol = j + dc;
                            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                                if (this.isValidMove(p, i, j, newRow, newCol).valid) return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
    
    checkGameOver() {
        let playerPieces = 0, computerPieces = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.board[i][j];
                if (p) p.player === 0 ? playerPieces++ : computerPieces++;
            }
        }
        if (playerPieces === 0) this.endGame('computer');
        else if (computerPieces === 0) this.endGame('player');
        else if (!this.hasPlayerMoves()) this.endGame('computer');
    }
    
    endGame(winner) {
        this.gameActive = false;
        saveGameResult(this.difficulty, winner);
        const message = winner === 'player' ? '🏆 ПОБЕДИЛ ИГРОК! 🏆' : '🏆 ПОБЕДИЛ КОМПЬЮТЕР! 🏆';
        this.showMessage(message, winner === 'player' ? '#4CAF50' : '#f44336');
        setTimeout(() => {
            if (confirm(`${message}\n\nХотите сыграть ещё?`)) {
                window.location.reload();
            } else {
                window.location.href = 'index.html';
            }
        }, 500);
    }
    
    updateUI() {
        document.getElementById('playerScore').textContent = this.playerScore;
        document.getElementById('computerScore').textContent = this.computerScore;
        document.getElementById('turnIndicator').textContent = this.currentPlayer === 0 ? '⚡ ХОДИТ: ИГРОК' : '🤖 ХОДИТ: КОМПЬЮТЕР';
        const badges = { easy: '🟢 ЛЁГКАЯ', medium: '🟡 СРЕДНЯЯ', hard: '🔴 СЛОЖНАЯ' };
        document.getElementById('difficultyBadge').textContent = badges[this.difficulty];
    }
    
    showMessage(msg, color) {
        const msgDiv = document.getElementById('gameMessage');
        msgDiv.textContent = msg;
        msgDiv.style.color = color;
    }
    
    drawSelectedHighlight(row, col, cellSize) {
        const actualCellSize = cellSize || this.cellSize;
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(col * actualCellSize + 2, row * actualCellSize + 2, actualCellSize - 4, actualCellSize - 4);
    }
    
    draw() {
        const rect = this.canvas.getBoundingClientRect();
        const scale = rect.width / 480;
        const actualCellSize = this.cellSize * scale;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isDark = (row + col) % 2 === 1;
                this.ctx.fillStyle = isDark ? '#8B4513' : '#F0D9B5';
                this.ctx.fillRect(col * actualCellSize, row * actualCellSize, actualCellSize, actualCellSize);
                
                const piece = this.board[row][col];
                if (piece) {
                    const centerX = col * actualCellSize + actualCellSize / 2;
                    const centerY = row * actualCellSize + actualCellSize / 2;
                    const radius = actualCellSize / 2 - 6;
                    
                    const mainColor = piece.player === 0 ? '#ffffff' : '#000000';
                    
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    this.ctx.fillStyle = mainColor;
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#aaa';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.stroke();
                    
                    const emojiSize = radius - 4;
                    this.ctx.font = `${emojiSize}px "Segoe UI"`;
                    this.ctx.fillStyle = '#333';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    const emoji = piece.color === 'red' ? '🔴' : (piece.color === 'green' ? '🟢' : '🔵');
                    this.ctx.fillText(emoji, centerX, centerY);
                }
            }
        }
        
        if (this.selectedPiece) {
            this.drawSelectedHighlight(this.selectedPiece.row, this.selectedPiece.col, actualCellSize);
        }
        
        if (this.waitingForPlacement && this.difficulty !== 'medium') {
            for (let row = 5; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if ((row + col) % 2 === 1 && this.board[row][col] === null) {
                        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
                        this.ctx.fillRect(col * actualCellSize, row * actualCellSize, actualCellSize, actualCellSize);
                    }
                }
            }
        }
    }
}

// ==================== ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ ====================
async function initPages() {
    await initSDK();
    
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    
    if (filename === 'index.html') {
        initFacadePage();
    } else if (filename === 'start.html') {
        initStartPage();
    } else if (filename === 'game.html') {
        initGamePage();
    } else if (filename === 'stats.html') {
        renderStats();
        initStatsPage();
    } else if (filename === 'rules.html') {
        initRulesPage();
    } else if (filename === 'difficulty.html') {
        initDifficultyPage();
    } else if (filename === 'auth.html') {
        initAuthPage();
    }
}

document.addEventListener('DOMContentLoaded', initPages);
