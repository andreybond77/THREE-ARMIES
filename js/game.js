// ===== ЧИТАЕМ СЛОЖНОСТЬ =====
const savedDifficulty = localStorage.getItem('tripleColorDifficulty') || 'medium';
const DIFFICULTY_LABELS = {
    easy: '🟢 ЛЁГКАЯ',
    medium: '🟡 СРЕДНЯЯ',
    hard: '🔴 СЛОЖНАЯ'
};
document.getElementById('difficultyBadge').textContent = DIFFICULTY_LABELS[savedDifficulty] || '🟡 СРЕДНЯЯ';

// ===== КАНВАС =====
const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    const containerRect = container.getBoundingClientRect();
    const size = Math.min(containerRect.width, containerRect.height);
    canvas.width = size;
    canvas.height = size;
    setTimeout(() => draw(), 10);
}

// ===== СОСТОЯНИЕ ИГРЫ =====
let board = [];
let currentPlayer = 0;
let playerScore = 0;
let computerScore = 0;
let selectedPiece = null;
let validMoves = [];
let gameActive = false;
let waitingForPlacement = false;
let placementRemaining = 0;
let currentPlacementColor = null;
let placementIndex = 0;
let placementColors = [];
let computerBoardBackup = null;
let difficulty = savedDifficulty;
let isAnimating = false;

const COLORS = ['red', 'green', 'blue'];
const EMOJI = { red: '🔴', green: '🟢', blue: '🔵' };
const PREDATOR = { red: 'green', green: 'blue', blue: 'red' };

// ===== ЗВУКИ (Web Audio API) =====
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API не поддерживается');
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!soundEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

const sounds = {
    move: () => playTone(440, 0.1, 'sine', 0.2),
    capture: () => {
        playTone(220, 0.12, 'sawtooth', 0.25);
        setTimeout(() => playTone(165, 0.15, 'sawtooth', 0.2), 60);
    },
    swap: () => {
        playTone(330, 0.1, 'triangle', 0.2);
        setTimeout(() => playTone(440, 0.1, 'triangle', 0.2), 80);
    },
    win: () => {
        [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.25, 'sine', 0.3), i * 120);
        });
    },
    lose: () => {
        [400, 300, 200].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.3, 'sawtooth', 0.2), i * 150);
        });
    },
    click: () => playTone(800, 0.05, 'sine', 0.15),
    select: () => playTone(660, 0.08, 'sine', 0.2),
    error: () => playTone(150, 0.15, 'square', 0.15)
};

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('tripleColorSound', soundEnabled ? '1' : '0');
    const btn = document.getElementById('soundBtn');
    btn.textContent = soundEnabled ? '🔊' : '🔇';
    btn.classList.toggle('muted', !soundEnabled);
    if (soundEnabled) {
        initAudio();
        sounds.click();
    }
}

// Загрузка состояния звука
(function loadSoundState() {
    const saved = localStorage.getItem('tripleColorSound');
    if (saved === '0') {
        soundEnabled = false;
        const btn = document.getElementById('soundBtn');
        if (btn) {
            btn.textContent = '🔇';
            btn.classList.add('muted');
        }
    }
})();

// ===== ДОСКА =====
function initBoard() {
    board = [];
    for (let i = 0; i < 8; i++) {
        board[i] = [];
        for (let j = 0; j < 8; j++) {
            board[i][j] = null;
        }
    }
}

function getComputerPositions() {
    const positions = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) positions.push({ row, col });
        }
    }
    return positions;
}

function getPlayerPositions() {
    const positions = [];
    for (let row = 5; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) positions.push({ row, col });
        }
    }
    return positions;
}

function getColorName(color) {
    return color === 'red' ? '🔴 КРАСНАЯ' : (color === 'green' ? '🟢 ЗЕЛЁНАЯ' : '🔵 СИНЯЯ');
}

// ===== UI =====
function showMessage(msg, color) {
    const el = document.getElementById('gameMessage');
    el.textContent = msg;
    el.classList.remove('success', 'error', 'info', 'warning');
    if (color === '#4CAF50') el.classList.add('success');
    else if (color === '#f44336') el.classList.add('error');
    else if (color === '#2196F3') el.classList.add('info');
    else if (color === '#ff9800') el.classList.add('warning');
    el.style.color = color || '#ff9800';
}

function updateUI() {
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
    const turnEl = document.getElementById('turnIndicator');
    turnEl.classList.remove('computer-turn', 'game-over');
    if (currentPlayer === 0) {
        turnEl.textContent = '⚡ ХОДИТ: ИГРОК';
    } else {
        turnEl.textContent = '🤖 ХОДИТ: КОМПЬЮТЕР';
        turnEl.classList.add('computer-turn');
    }
    const badges = { easy: '🟢 ЛЁГКАЯ', medium: '🟡 СРЕДНЯЯ', hard: '🔴 СЛОЖНАЯ' };
    document.getElementById('difficultyBadge').textContent = badges[difficulty] || '🟡 СРЕДНЯЯ';
}

// ===== ОТРИСОВКА =====
function drawPieceAt(x, y, piece, cell) {
    const radius = cell / 2 - 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = piece.player === 0 ? '#ffffff' : '#222222';
    ctx.fill();
    ctx.strokeStyle = piece.player === 0 ? '#999' : '#555';
    ctx.lineWidth = Math.max(1.5, cell / 40);
    ctx.stroke();
    const emojiSize = Math.max(radius - 3, 12);
    ctx.font = `${emojiSize}px "Segoe UI Emoji", "Segoe UI", sans-serif`;
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJI[piece.color], x, y);
}

function draw() {
    if (canvas.width === 0 || canvas.height === 0) return;
    const cell = canvas.width / 8;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const isDark = (row + col) % 2 === 1;
            ctx.fillStyle = isDark ? '#8B4513' : '#F0D9B5';
            ctx.fillRect(col * cell, row * cell, cell, cell);
            const piece = board[row][col];
            if (piece) {
                const x = col * cell + cell / 2;
                const y = row * cell + cell / 2;
                drawPieceAt(x, y, piece, cell);
            }
        }
    }

    if (selectedPiece) {
        const x = selectedPiece.col * cell;
        const y = selectedPiece.row * cell;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = Math.max(3, cell / 20);
        ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
    }

    if (selectedPiece && validMoves.length > 0) {
        for (const move of validMoves) {
            const x = move.col * cell + cell / 2;
            const y = move.row * cell + cell / 2;
            const radius = cell / 4;

            if (move.type === 'capture') {
                ctx.beginPath();
                ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(244, 67, 54, 0.9)';
                ctx.lineWidth = Math.max(3, cell / 15);
                ctx.stroke();
            } else if (move.type === 'swap') {
                ctx.beginPath();
                ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 193, 7, 0.9)';
                ctx.lineWidth = Math.max(3, cell / 15);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(76, 175, 80, 0.55)';
                ctx.fill();
            }
        }
    }

    if (waitingForPlacement && difficulty !== 'medium') {
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1 && board[row][col] === null) {
                    ctx.fillStyle = 'rgba(76, 175, 80, 0.25)';
                    ctx.fillRect(col * cell, row * cell, cell, cell);
                }
            }
        }
    }
}

// ===== ПРАВИЛА ХОДОВ =====
function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
    const target = board[toRow][toCol];
    const dx = toCol - fromCol;
    const dy = toRow - fromRow;
    const isMove = (Math.abs(dx) + Math.abs(dy) === 1) && (dx === 0 || dy === 0);
    const isCapture = (Math.abs(dx) === 1 && Math.abs(dy) === 1);

    if (isMove && target === null) return { valid: true, type: 'move' };

    if (isCapture && target && target.player === 1) {
        // Захват: хищник vs жертва (разные цвета)
        if (PREDATOR[piece.color] === target.color) {
            return { valid: true, type: 'capture', target };
        }
        // Обмен: одинаковые цвета (нейтральные) — просто меняются местами
        if (piece.color === target.color) {
            return { valid: true, type: 'swap', target };
        }
    }
    return { valid: false };
}

function calculateValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece || piece.player !== 0) return [];
    const moves = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const result = isValidMove(piece, row, col, nr, nc);
                if (result.valid) {
                    moves.push({ row: nr, col: nc, type: result.type, target: result.target });
                }
            }
        }
    }
    return moves;
}

// ===== АНИМАЦИЯ ХОДА =====
function animateMove(fromRow, fromCol, toRow, toCol, piece, callback) {
    isAnimating = true;
    const cell = canvas.width / 8;
    const startX = fromCol * cell + cell / 2;
    const startY = fromRow * cell + cell / 2;
    const endX = toCol * cell + cell / 2;
    const endY = toRow * cell + cell / 2;
    const duration = 220;
    const startTime = performance.now();

    function frame(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentX = startX + (endX - startX) * easeProgress;
        const currentY = startY + (endY - startY) * easeProgress;

        draw();
        drawPieceAt(currentX, currentY, piece, cell);

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            isAnimating = false;
            callback();
        }
    }
    requestAnimationFrame(frame);
}

// ===== ВЫПОЛНЕНИЕ ХОДА С АНИМАЦИЕЙ =====
function makeMoveAnimated(fromRow, fromCol, toRow, toCol, moveInfo) {
    const piece = board[fromRow][fromCol];
    selectedPiece = null;
    validMoves = [];

    // Временно убираем шашку для анимации
    board[fromRow][fromCol] = null;

    animateMove(fromRow, fromCol, toRow, toCol, piece, () => {
        if (moveInfo.type === 'capture') {
            // ЗАХВАТ: шашка игрока встаёт на место врага
            board[toRow][toCol] = piece;
            playerScore++;
            sounds.capture();
            updateUI();
            showMessage(`+1 очко! Съедена ${getColorName(moveInfo.target.color)} шашка`, '#4CAF50');
        } else if (moveInfo.type === 'swap') {
            // ===== ОБМЕН МЕСТАМИ (SWAP) =====
            // Получаем шашку противника с целевой клетки
            const targetPiece = board[toRow][toCol];

            // Меняем местами, СОХРАНЯЯ все свойства (цвет и принадлежность)
            board[toRow][toCol] = piece;           // игрок → на место компьютера
            board[fromRow][fromCol] = targetPiece; // компьютер → на место игрока

            // ===== ВАЖНО: НИЧЕГО НЕ МЕНЯЕМ! =====
            // piece.player остаётся 0 (игрок)
            // targetPiece.player остаётся 1 (компьютер)
            // piece.color остаётся тем же (red/green/blue)
            // targetPiece.color остаётся тем же (red/green/blue)

            sounds.swap();
            showMessage('Шашки поменялись местами', '#ff9800');
        } else {
            // Обычный ход
            board[toRow][toCol] = piece;
            sounds.move();
        }

        draw();
        checkGameOver();

        if (gameActive) {
            currentPlayer = 1;
            updateUI();
            showMessage('Ход компьютера...', '#ff9800');
            setTimeout(() => computerMove(), 400);
        }
    });
}

// ===== ПРОВЕРКА КОНЦА ИГРЫ =====
function hasPlayerMoves() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = board[i][j];
            if (p && p.player === 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = i + dr, nc = j + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                            if (isValidMove(p, i, j, nr, nc).valid) return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function hasComputerMoves() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = board[i][j];
            if (p && p.player === 1) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = i + dr, nc = j + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                            const target = board[nr][nc];
                            const isDiag = Math.abs(dr) === 1 && Math.abs(dc) === 1;
                            const isStraight = (dr === 0 || dc === 0) && Math.abs(dr) + Math.abs(dc) === 1;
                            if (isStraight && target === null) return true;
                            if (isDiag && target && target.player === 0) {
                                if (PREDATOR[p.color] === target.color) return true;
                                if (p.color === target.color) return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

function checkGameOver() {
    let playerPieces = 0, computerPieces = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = board[i][j];
            if (p) {
                if (p.player === 0) playerPieces++;
                else computerPieces++;
            }
        }
    }
    if (playerPieces === 0) endGame('computer');
    else if (computerPieces === 0) endGame('player');
    else if (!hasPlayerMoves() && currentPlayer === 0) endGame('computer');
    else if (!hasComputerMoves() && currentPlayer === 1) endGame('player');
}

function endGame(winner) {
    gameActive = false;
    const message = winner === 'player' ? '🏆 ПОБЕДИЛ ИГРОК! 🏆' : '🏆 ПОБЕДИЛ КОМПЬЮТЕР! 🏆';
    showMessage(message, winner === 'player' ? '#4CAF50' : '#f44336');

    const turnEl = document.getElementById('turnIndicator');
    turnEl.classList.remove('computer-turn');
    turnEl.classList.add('game-over');
    turnEl.textContent = winner === 'player' ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ';

    if (winner === 'player') sounds.win();
    else sounds.lose();

    if (typeof saveGameResult === 'function') {
        saveGameResult(difficulty, winner);
    }

    setTimeout(() => {
        if (confirm(`${message}\n\nХотите сыграть ещё?`)) {
            location.reload();
        } else {
            location.href = 'start.html';
        }
    }, 800);
}

// ===== MINIMAX ИИ (для HARD) =====
function getAllMoves(boardState, player) {
    const moves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = boardState[i][j];
            if (!p || p.player !== player) continue;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = i + dr, nc = j + dc;
                    if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
                    const target = boardState[nr][nc];
                    const isDiag = Math.abs(dr) === 1 && Math.abs(dc) === 1;
                    const isStraight = (dr === 0 || dc === 0) && Math.abs(dr) + Math.abs(dc) === 1;
                    if (isStraight && target === null) {
                        moves.push({ from: {row: i, col: j}, to: {row: nr, col: nc}, type: 'move', piece: p });
                    }
                    if (isDiag && target && target.player !== player) {
                        // Захват: хищник vs жертва (разные цвета)
                        if (PREDATOR[p.color] === target.color) {
                            moves.push({ from: {row: i, col: j}, to: {row: nr, col: nc}, type: 'capture', piece: p, target });
                        }
                        // Обмен: одинаковые цвета (нейтральные)
                        if (p.color === target.color) {
                            moves.push({ from: {row: i, col: j}, to: {row: nr, col: nc}, type: 'swap', piece: p, target });
                        }
                    }
                }
            }
        }
    }
    return moves;
}

function simulateMove(boardState, move) {
    const newBoard = boardState.map(row => row.slice());
    const piece = newBoard[move.from.row][move.from.col];
    newBoard[move.to.row][move.to.col] = piece;
    newBoard[move.from.row][move.from.col] = null;
    return newBoard;
}

function evaluateBoard(boardState) {
    let score = 0;
    let playerPieces = 0, computerPieces = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = boardState[i][j];
            if (!p) continue;
            const centerBonus = (3.5 - Math.abs(i - 3.5)) * 2 + (3.5 - Math.abs(j - 3.5)) * 2;
            const baseValue = 10 + centerBonus;
            if (p.player === 1) {
                score += baseValue;
                computerPieces++;
            } else {
                score -= baseValue;
                playerPieces++;
            }
        }
    }
    score += (computerPieces - playerPieces) * 5;
    return score;
}

function minimax(boardState, depth, alpha, beta, isMaximizing) {
    if (depth === 0) return evaluateBoard(boardState);
    const player = isMaximizing ? 1 : 0;
    const moves = getAllMoves(boardState, player);
    if (moves.length === 0) return isMaximizing ? -1000 : 1000;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const newBoard = simulateMove(boardState, move);
            let evalScore = minimax(newBoard, depth - 1, alpha, beta, false);
            if (move.type === 'capture') evalScore += 50;
            else if (move.type === 'swap') evalScore += 20;
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const newBoard = simulateMove(boardState, move);
            let evalScore = minimax(newBoard, depth - 1, alpha, beta, true);
            if (move.type === 'capture') evalScore -= 50;
            else if (move.type === 'swap') evalScore -= 20;
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function getBestMoveMinimax(depth = 3) {
    const moves = getAllMoves(board, 1);
    if (moves.length === 0) return null;
    let bestMove = null;
    let bestScore = -Infinity;
    const bestMoves = [];

    for (const move of moves) {
        const newBoard = simulateMove(board, move);
        let score = minimax(newBoard, depth - 1, -Infinity, Infinity, false);
        if (move.type === 'capture') score += 50;
        else if (move.type === 'swap') score += 20;

        if (score > bestScore) {
            bestScore = score;
            bestMoves.length = 0;
            bestMoves.push(move);
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// ===== ХОД КОМПЬЮТЕРА =====
function computerMove() {
    if (!gameActive || currentPlayer !== 1) return;

    const computerPieces = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = board[i][j];
            if (p && p.player === 1) computerPieces.push({ row: i, col: j, piece: p });
        }
    }
    if (computerPieces.length === 0) { endGame('player'); return; }

    let selectedMove = null;

    if (difficulty === 'easy') {
        const moves = getAllMoves(board, 1);
        if (moves.length === 0) {
            if (hasPlayerMoves()) { currentPlayer = 0; updateUI(); showMessage('Ваш ход', '#4CAF50'); }
            else endGame('computer');
            return;
        }
        selectedMove = moves[Math.floor(Math.random() * moves.length)];
    } else if (difficulty === 'medium') {
        const moves = getAllMoves(board, 1);
        if (moves.length === 0) {
            if (hasPlayerMoves()) { currentPlayer = 0; updateUI(); showMessage('Ваш ход', '#4CAF50'); }
            else endGame('computer');
            return;
        }
        for (const move of moves) {
            let extra = move.type === 'capture' ? 100 : (move.type === 'swap' ? 30 : 0);
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const cr = move.to.row + dr, cc = move.to.col + dc;
                    if (cr >= 0 && cr < 8 && cc >= 0 && cc < 8) {
                        const nearby = board[cr][cc];
                        if (nearby && nearby.player === 0) {
                            if (PREDATOR[move.piece.color] === nearby.color) extra += 50;
                            if (PREDATOR[nearby.color] === move.piece.color) extra -= 30;
                        }
                    }
                }
            }
            move.score = extra;
        }
        moves.sort((a, b) => b.score - a.score);
        const best = moves[0].score;
        const bestMoves = moves.filter(m => m.score === best);
        selectedMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    } else {
        selectedMove = getBestMoveMinimax(3);
        if (!selectedMove) {
            if (hasPlayerMoves()) { currentPlayer = 0; updateUI(); showMessage('Ваш ход', '#4CAF50'); }
            else endGame('computer');
            return;
        }
    }

    const from = selectedMove.from;
    const to = selectedMove.to;
    const piece = board[from.row][from.col];
    board[from.row][from.col] = null;

    animateMove(from.row, from.col, to.row, to.col, piece, () => {
        if (selectedMove.type === 'capture') {
            board[to.row][to.col] = piece;
            computerScore++;
            sounds.capture();
            updateUI();
            showMessage('Компьютер съел вашу шашку!', '#f44336');
        } else if (selectedMove.type === 'swap') {
            // ===== ОБМЕН МЕСТАМИ (SWAP) ДЛЯ КОМПЬЮТЕРА =====
            const targetPiece = board[to.row][to.col];

            // Меняем местами, СОХРАНЯЯ все свойства
            board[to.row][to.col] = piece;           // компьютер → на место игрока
            board[from.row][from.col] = targetPiece; // игрок → на место компьютера

            // ===== ВАЖНО: НИЧЕГО НЕ МЕНЯЕМ! =====
            // piece.player остаётся 1 (компьютер)
            // targetPiece.player остаётся 0 (игрок)
            // piece.color остаётся тем же
            // targetPiece.color остаётся тем же

            sounds.swap();
            showMessage('Компьютер поменялся шашками', '#ff9800');
        } else {
            board[to.row][to.col] = piece;
            sounds.move();
            showMessage('Компьютер сделал ход', '#ff9800');
        }

        draw();
        checkGameOver();

        if (gameActive) {
            currentPlayer = 0;
            updateUI();
            showMessage('Ваш ход. Выберите шашку', '#4CAF50');
        }
    });
}

// ===== РАССТАНОВКА =====
function startPlacementEasy() {
    waitingForPlacement = true;
    placementRemaining = 12;
    document.getElementById('placementPanel').style.display = 'block';
    const container = document.getElementById('colorSelector');
    container.innerHTML = '';
    for (const color of COLORS) {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.textContent = EMOJI[color];
        btn.onclick = () => {
            initAudio();
            sounds.click();
            currentPlacementColor = color;
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showMessage(`Выбран цвет: ${getColorName(color)}. Выберите клетку (осталось ${placementRemaining})`, '#4CAF50');
        };
        container.appendChild(btn);
    }
    showMessage(`Выберите цвет шашки (осталось ${placementRemaining})`, '#2196F3');
    draw();
}

function startPlacementMedium() {
    waitingForPlacement = true;
    placementRemaining = 12;
    placementIndex = 0;
    placementColors = [];
    for (let i = 0; i < 12; i++) placementColors.push(COLORS[Math.floor(Math.random() * 3)]);
    currentPlacementColor = placementColors[0];
    const panel = document.getElementById('placementPanel');
    panel.style.display = 'block';
    document.getElementById('colorSelector').style.display = 'none';
    document.getElementById('mediumPlace').style.display = 'flex';
    updateMediumDisplay();
    draw();
}

function updateMediumDisplay() {
    if (placementIndex < 12) {
        const color = placementColors[placementIndex];
        document.getElementById('mediumPiece').textContent = EMOJI[color];
        document.getElementById('mediumText').textContent = `Поставьте ${getColorName(color)} шашку (осталось ${12 - placementIndex})`;
    }
}

function finishPlacement() {
    waitingForPlacement = false;
    document.getElementById('placementPanel').style.display = 'none';
    if (difficulty === 'medium' && computerBoardBackup) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (computerBoardBackup[i][j] && computerBoardBackup[i][j].player === 1) {
                    board[i][j] = computerBoardBackup[i][j];
                }
            }
        }
    }
    gameActive = true;
    currentPlayer = 0;
    updateUI();
    draw();
    showMessage('Расстановка завершена! Ваш ход', '#4CAF50');
}

function handlePlacement(row, col) {
    if (!waitingForPlacement) return false;
    if (row < 5 || row > 7) {
        showMessage('Шашки можно ставить только в свои ряды (5-7)', '#f44336');
        sounds.error();
        return false;
    }
    if ((row + col) % 2 !== 1) {
        showMessage('Шашки ставятся только на тёмные клетки', '#f44336');
        sounds.error();
        return false;
    }
    if (board[row][col] !== null) {
        showMessage('Эта клетка уже занята', '#f44336');
        sounds.error();
        return false;
    }
    if (difficulty === 'easy') {
        if (!currentPlacementColor) {
            showMessage('Сначала выберите цвет шашки', '#f44336');
            sounds.error();
            return false;
        }
        board[row][col] = { color: currentPlacementColor, player: 0 };
        placementRemaining--;
        sounds.move();
        if (placementRemaining > 0) {
            showMessage(`Выберите цвет для следующей шашки (осталось ${placementRemaining})`, '#2196F3');
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            currentPlacementColor = null;
        } else {
            finishPlacement();
        }
    } else if (difficulty === 'medium') {
        board[row][col] = { color: currentPlacementColor, player: 0 };
        placementIndex++;
        sounds.move();
        if (placementIndex < 12) {
            currentPlacementColor = placementColors[placementIndex];
            updateMediumDisplay();
            showMessage('Поставьте шашку на свободную клетку', '#4CAF50');
            draw();
        } else {
            finishPlacement();
        }
    }
    draw();
    return true;
}

// ===== ОБРАБОТКА КЛИКОВ =====
function handleClick(e) {
    if (!gameActive && !waitingForPlacement) return;
    if (isAnimating) return;

    initAudio();

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const cell = canvas.width / 8;
    const col = Math.floor(x / cell);
    const row = Math.floor(y / cell);
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return;

    if (waitingForPlacement) {
        handlePlacement(row, col);
        return;
    }

    if (currentPlayer !== 0) {
        showMessage('Сейчас ход компьютера', '#f44336');
        return;
    }

    const piece = board[row][col];

    if (selectedPiece === null) {
        if (piece && piece.player === 0) {
            selectedPiece = { row, col, piece };
            validMoves = calculateValidMoves(row, col);
            sounds.select();
            showMessage(`Выбрана ${getColorName(piece.color)} шашка. ${validMoves.length > 0 ? 'Выберите клетку' : 'Нет доступных ходов'}`, '#4CAF50');
            draw();
        } else {
            showMessage('Выберите свою шашку', '#f44336');
            sounds.error();
        }
    } else {
        const move = validMoves.find(m => m.row === row && m.col === col);
        if (move) {
            makeMoveAnimated(selectedPiece.row, selectedPiece.col, row, col, move);
        } else if (piece && piece.player === 0 && !(row === selectedPiece.row && col === selectedPiece.col)) {
            selectedPiece = { row, col, piece };
            validMoves = calculateValidMoves(row, col);
            sounds.select();
            draw();
        } else if (row === selectedPiece.row && col === selectedPiece.col) {
            selectedPiece = null;
            validMoves = [];
            draw();
        } else {
            selectedPiece = null;
            validMoves = [];
            showMessage('Недопустимый ход', '#f44336');
            sounds.error();
            draw();
        }
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initGame() {
    resizeCanvas();
    setTimeout(() => {
        initBoard();
        if (difficulty === 'easy') {
            const compPos = getComputerPositions();
            const order = ['red', 'green', 'blue'];
            let idx = 0;
            for (const pos of compPos) {
                board[pos.row][pos.col] = { color: order[idx % 3], player: 1 };
                idx++;
            }
            startPlacementEasy();
        } else if (difficulty === 'medium') {
            const compPos = getComputerPositions();
            const order = ['red', 'green', 'blue'];
            let idx = 0;
            for (const pos of compPos) {
                board[pos.row][pos.col] = { color: order[idx % 3], player: 1 };
                idx++;
            }
            computerBoardBackup = JSON.parse(JSON.stringify(board));
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if (board[i][j] && board[i][j].player === 1) board[i][j] = null;
                }
            }
            startPlacementMedium();
        } else {
            const compPos = getComputerPositions();
            const shuffledComp = [...compPos];
            for (let i = shuffledComp.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledComp[i], shuffledComp[j]] = [shuffledComp[j], shuffledComp[i]];
            }
            const compColors = [];
            for (let i = 0; i < 12; i++) compColors.push(COLORS[Math.floor(Math.random() * 3)]);
            for (let i = 0; i < 12; i++) {
                board[shuffledComp[i].row][shuffledComp[i].col] = { color: compColors[i], player: 1 };
            }
            const playerPos = getPlayerPositions();
            const shuffledPlayer = [...playerPos];
            for (let i = shuffledPlayer.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledPlayer[i], shuffledPlayer[j]] = [shuffledPlayer[j], shuffledPlayer[i]];
            }
            const playerColors = [];
            for (let i = 0; i < 12; i++) playerColors.push(COLORS[Math.floor(Math.random() * 3)]);
            for (let i = 0; i < 12; i++) {
                board[shuffledPlayer[i].row][shuffledPlayer[i].col] = { color: playerColors[i], player: 0 };
            }
            gameActive = true;
            currentPlayer = 0;
            showMessage('Игра началась! Ваш ход', '#4CAF50');
            updateUI();
            draw();
        }
    }, 100);
}

// ===== СОБЫТИЯ =====
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const click = new MouseEvent('click', { clientX: touch.clientX, clientY: touch.clientY });
    handleClick(click);
}, { passive: false });

document.getElementById('soundBtn').addEventListener('click', toggleSound);
document.getElementById('exitBtn').addEventListener('click', () => {
    sounds.click();
    if (confirm('Выйти в главное меню?')) location.href = 'start.html';
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
    setTimeout(() => {
        initGame();
        console.log('✅ Игра запущена!');
    }, 200);
});
