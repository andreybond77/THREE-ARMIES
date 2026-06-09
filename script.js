// ==================== НАВИГАЦИЯ И СТАТИСТИКА ====================
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

// ==================== КЛАСС ИГРЫ ====================
class TripleColorGame {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.boardSize = 8;
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
        this.placementRemaining = [];
        this.currentPlacementColor = null;
        this.placementIndex = 0;
        
        this.setupEventListeners();
        this.initGame();
    }
    
    setupEventListeners() {
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        }
        const exitBtn = document.getElementById('exitBtn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                if (confirm('Выйти в главное меню?')) {
                    window.location.href = 'index.html';
                }
            });
        }
    }
    
    initGame() {
        if (this.difficulty === 'easy') {
            this.setupEasyMode();
        } else if (this.difficulty === 'medium') {
            this.setupMediumMode();
        } else {
            this.setupHardMode();
        }
        this.updateUI();
        this.draw();
    }
    
    setupEasyMode() {
        const computerPositions = this.getComputerPositions();
        const colorOrder = ['red', 'green', 'blue'];
        let colorIdx = 0;
        for (const pos of computerPositions) {
            this.board[pos.row][pos.col] = { color: colorOrder[colorIdx % 3], player: 1 };
            colorIdx++;
        }
        this.startPlacement(12, true, true);
        this.showMessage('Расставьте 12 шашек. Выбирайте цвет и клетку', '#2196F3');
    }
    
    setupMediumMode() {
        const computerPositions = this.getComputerPositions();
        const computerColors = [];
        for (let i = 0; i < computerPositions.length; i++) {
            computerColors.push(this.colors[Math.floor(Math.random() * 3)]);
        }
        for (let i = 0; i < computerPositions.length; i++) {
            this.board[computerPositions[i].row][computerPositions[i].col] = {
                color: computerColors[i], player: 1
            };
        }
        this.computerBoardBackup = JSON.parse(JSON.stringify(this.board));
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j] && this.board[i][j].player === 1) {
                    this.board[i][j] = null;
                }
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
        this.selectColorMode = true;
        this.createColorSelector();
        this.showMessage(`Выберите цвет и клетку для шашки 1/12`, '#2196F3');
    }
    
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
    
    startPlacement(total, selectColor, showComputer) {
        this.waitingForPlacement = true;
        this.placementRemaining = total;
        this.selectColorMode = selectColor;
        if (selectColor) {
            this.createColorSelector();
        }
    }
    
    createColorSelector() {
        const panel = document.getElementById('placementPanel');
        const selector = document.getElementById('colorSelector');
        selector.innerHTML = '';
        for (const color of this.colors) {
            const btn = document.createElement('button');
            btn.className = `color-btn ${color}`;
            btn.textContent = color === 'red' ? '🔴 КРАСНАЯ' : (color === 'green' ? '🟢 ЗЕЛЁНАЯ' : '🔵 СИНЯЯ');
            btn.onclick = () => {
                this.currentPlacementColor = color;
                this.showMessage(`Выбран цвет: ${btn.textContent}. Выберите клетку`, '#4CAF50');
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            selector.appendChild(btn);
        }
        panel.style.display = 'block';
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
        
        let color = this.currentPlacementColor;
        if (this.difficulty === 'medium') {
            color = this.placementColors[this.placementIndex];
        }
        
        this.board[row][col] = { color: color, player: 0 };
        this.placementRemaining--;
        
        if (this.difficulty === 'medium') {
            this.placementIndex++;
            if (this.placementIndex < 12) {
                this.showMessage(`Шаг ${this.placementIndex + 1}/12. Выпал цвет: ${this.getColorName(this.placementColors[this.placementIndex])}. Выберите клетку`, '#ff9800');
                this.draw();
            } else {
                this.finishPlacement();
            }
        } else if (this.selectColorMode) {
            if (this.placementRemaining > 0) {
                this.showMessage(`Выберите цвет для следующей шашки (осталось ${this.placementRemaining})`, '#2196F3');
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
        } 
        else if (this.difficulty === 'medium') {
            for (const move of moves) {
                let extraScore = 0;
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
                move.score += extraScore;
            }
            moves.sort((a, b) => b.score - a.score);
            const bestScore = moves[0].score;
            const bestMoves = moves.filter(m => m.score === bestScore);
            selectedMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        } 
        else {
            for (const move of moves) {
                let globalScore = move.score;
                let minPreyDist = Infinity;
                let minPredatorDist = Infinity;
                for (let i = 0; i < 8; i++) {
                    for (let j = 0; j < 8; j++) {
                        const p = this.board[i][j];
                        if (p && p.player === 0) {
                            const dist = Math.abs(move.to.row - i) + Math.abs(move.to.col - j);
                            if (this.predatorMap[move.from.piece.color] === p.color) {
                                minPreyDist = Math.min(minPreyDist, dist);
                            }
                            if (this.predatorMap[p.color] === move.from.piece.color) {
                                minPredatorDist = Math.min(minPredatorDist, dist);
                            }
                        }
                    }
                }
                if (minPreyDist < 4) globalScore += 40;
                if (minPredatorDist < 3) globalScore -= 35;
                move.score = globalScore;
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
    
    drawSelectedHighlight(row, col) {
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(col * this.cellSize + 2, row * this.cellSize + 2, this.cellSize - 4, this.cellSize - 4);
    }
    
    draw() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isDark = (row + col) % 2 === 1;
                this.ctx.fillStyle = isDark ? '#8B4513' : '#F0D9B5';
                this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
                
                const piece = this.board[row][col];
                if (piece) {
                    const centerX = col * this.cellSize + this.cellSize / 2;
                    const centerY = row * this.cellSize + this.cellSize / 2;
                    const radius = this.cellSize / 2 - 6;
                    
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
        if (this.selectedPiece) this.drawSelectedHighlight(this.selectedPiece.row, this.selectedPiece.col);
        if (this.waitingForPlacement) {
            for (let row = 5; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if ((row + col) % 2 === 1 && this.board[row][col] === null) {
                        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
                        this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
                    }
                }
            }
        }
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ СТРАНИЦ ====================
document.addEventListener('DOMContentLoaded', () => {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    if (filename === 'index.html') initStartPage();
    else if (filename === 'game.html') initGamePage();
    else if (filename === 'stats.html') { renderStats(); initStatsPage(); }
});

function initStartPage() {
    const diffBtns = document.querySelectorAll('.difficulty-btn');
    let selected = localStorage.getItem('tripleColorDifficulty') || 'easy';
    diffBtns.forEach(btn => {
        if (btn.dataset.diff === selected) btn.classList.add('active');
        btn.addEventListener('click', () => {
            diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            localStorage.setItem('tripleColorDifficulty', btn.dataset.diff);
        });
    });
    document.getElementById('startBtn').addEventListener('click', () => window.location.href = 'game.html');
    document.getElementById('statsBtn').addEventListener('click', () => window.location.href = 'stats.html');
}

function initGamePage() {
    const difficulty = localStorage.getItem('tripleColorDifficulty') || 'easy';
    window.game = new TripleColorGame(difficulty);
}

function initStatsPage() {
    document.getElementById('resetStatsBtn').addEventListener('click', () => {
        if (confirm('⚠️ Сбросить всю статистику?')) {
            localStorage.removeItem('tripleColorStats');
            renderStats();
            alert('✅ Статистика сброшена!');
        }
    });
    document.getElementById('backBtn').addEventListener('click', () => window.location.href = 'index.html');
}
