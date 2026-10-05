// --- State Management ---
const state = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  gameActive: true,
  mode: 'ai-easy', // 'pvp', 'ai-easy', 'ai-hard'
  scores: {
    X: 0,
    O: 0,
    ties: 0,
  },
  soundEnabled: true,
};

// Winning Combinations
const WINNING_COMBOS = [
  [0, 1, 2], // Row 1
  [3, 4, 5], // Row 2
  [6, 7, 8], // Row 3
  [0, 3, 6], // Col 1
  [1, 4, 7], // Col 2
  [2, 5, 8], // Col 3
  [0, 4, 8], // Diag 1
  [2, 4, 6], // Diag 2
];

// --- Audio Synthesizer (Zero external dependencies) ---
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
}

function playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
  if (!state.soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}

function soundMove(player) {
  if (player === 'X') {
    playTone(480, 'sine', 0.12, 0.2);
  } else {
    playTone(360, 'triangle', 0.14, 0.2);
  }
}

function soundWin() {
  if (!state.soundEnabled) return;
  const notes = [440, 554.37, 659.25, 880];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 'sine', 0.3, 0.25);
    }, idx * 110);
  });
}

function soundDraw() {
  if (!state.soundEnabled) return;
  playTone(220, 'sawtooth', 0.25, 0.15);
  setTimeout(() => playTone(180, 'sawtooth', 0.35, 0.15), 180);
}

// --- DOM Elements ---
const cells = document.querySelectorAll('.cell');
const statusMessage = document.getElementById('statusMessage');
const scoreXElem = document.getElementById('scoreX');
const scoreOElem = document.getElementById('scoreO');
const scoreTiesElem = document.getElementById('scoreTies');
const nameXElem = document.getElementById('nameX');
const nameOElem = document.getElementById('nameO');
const scoreCardX = document.getElementById('scoreCardX');
const scoreCardO = document.getElementById('scoreCardO');
const gameModeSelect = document.getElementById('gameMode');
const soundToggleBtn = document.getElementById('soundToggle');
const restartBtn = document.getElementById('restartBtn');
const resetScoreBtn = document.getElementById('resetScoreBtn');

// --- Initialization ---
function init() {
  cells.forEach((cell) => {
    cell.addEventListener('click', handleCellClick);
  });

  gameModeSelect.addEventListener('change', handleModeChange);
  soundToggleBtn.addEventListener('click', toggleSound);
  restartBtn.addEventListener('click', restartGame);
  resetScoreBtn.addEventListener('click', resetScores);

  updateLabels();
  updateStatus();
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  soundToggleBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
  soundToggleBtn.style.opacity = state.soundEnabled ? '1' : '0.6';
}

function handleModeChange(e) {
  state.mode = e.target.value;
  updateLabels();
  restartGame();
}

function updateLabels() {
  if (state.mode === 'pvp') {
    nameXElem.textContent = 'Player X';
    nameOElem.textContent = 'Player O';
  } else {
    nameXElem.textContent = 'You (X)';
    nameOElem.textContent = 'Computer (O)';
  }
}

// --- Game Logic ---
function handleCellClick(e) {
  const index = parseInt(e.target.dataset.index, 10);

  // If cell is taken, game is over, or waiting on AI
  if (state.board[index] !== null || !state.gameActive) {
    return;
  }

  // Make move for current player
  makeMove(index, state.currentPlayer);

  // Check game state after player move
  const result = checkGameStatus(state.board);
  if (result) {
    endRound(result);
    return;
  }

  // Switch turn
  state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
  updateStatus();

  // If AI mode and it's O's turn
  if (state.gameActive && state.mode.startsWith('ai') && state.currentPlayer === 'O') {
    lockBoard(true);
    setTimeout(() => {
      aiMove();
      lockBoard(false);
    }, 450);
  }
}

function lockBoard(lock) {
  cells.forEach((cell) => {
    if (lock) {
      cell.setAttribute('disabled', 'true');
    } else if (state.board[cell.dataset.index] === null) {
      cell.removeAttribute('disabled');
    }
  });
}

function makeMove(index, player) {
  state.board[index] = player;
  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add(player.toLowerCase(), 'taken');
  cell.setAttribute('disabled', 'true');
  soundMove(player);
}

function checkGameStatus(board) {
  for (let combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo: combo };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: 'tie' };
  }

  return null;
}

function endRound(result) {
  state.gameActive = false;

  if (result.winner === 'tie') {
    state.scores.ties++;
    scoreTiesElem.textContent = state.scores.ties;
    statusMessage.innerHTML = `<span>It's a <strong>Tie!</strong> 🤝</span>`;
    soundDraw();
  } else {
    const winner = result.winner;
    state.scores[winner]++;
    if (winner === 'X') {
      scoreXElem.textContent = state.scores.X;
    } else {
      scoreOElem.textContent = state.scores.O;
    }

    // Highlight winning cells
    result.combo.forEach((idx) => {
      cells[idx].classList.add('winner');
    });

    const winnerName = winner === 'X' ? nameXElem.textContent : nameOElem.textContent;
    statusMessage.innerHTML = `<span>🎉 <strong class="turn-mark ${winner.toLowerCase()}">${winnerName}</strong> Wins!</span>`;
    soundWin();
  }

  highlightTurn();
}

function updateStatus() {
  const currentName = state.currentPlayer === 'X' ? nameXElem.textContent : nameOElem.textContent;
  const markClass = state.currentPlayer.toLowerCase();

  statusMessage.innerHTML = `<span class="turn-indicator">Turn: <strong class="turn-mark ${markClass}">${currentName}</strong></span>`;
  highlightTurn();
}

function highlightTurn() {
  if (!state.gameActive) {
    scoreCardX.classList.remove('active');
    scoreCardO.classList.remove('active');
    return;
  }

  if (state.currentPlayer === 'X') {
    scoreCardX.classList.add('active');
    scoreCardO.classList.remove('active');
  } else {
    scoreCardO.classList.add('active');
    scoreCardX.classList.remove('active');
  }
}

// --- AI Opponents ---
function aiMove() {
  if (!state.gameActive) return;

  let moveIndex;
  if (state.mode === 'ai-easy') {
    moveIndex = getEasyAiMove();
  } else {
    moveIndex = getBestAiMove();
  }

  if (moveIndex !== undefined && moveIndex !== -1) {
    makeMove(moveIndex, 'O');

    const result = checkGameStatus(state.board);
    if (result) {
      endRound(result);
    } else {
      state.currentPlayer = 'X';
      updateStatus();
    }
  }
}

// Easy AI: 70% random, 30% check for immediate win/block
function getEasyAiMove() {
  const emptyIndices = state.board
    .map((val, idx) => (val === null ? idx : null))
    .filter((v) => v !== null);

  if (emptyIndices.length === 0) return -1;

  // 35% chance to play casually/randomly
  if (Math.random() < 0.35) {
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  // Check if AI can win in 1 move
  for (let idx of emptyIndices) {
    const tempBoard = [...state.board];
    tempBoard[idx] = 'O';
    const res = checkGameStatus(tempBoard);
    if (res && res.winner === 'O') return idx;
  }

  // Check if player X can win in 1 move and block
  for (let idx of emptyIndices) {
    const tempBoard = [...state.board];
    tempBoard[idx] = 'X';
    const res = checkGameStatus(tempBoard);
    if (res && res.winner === 'X') return idx;
  }

  // Otherwise pick center, or random
  if (emptyIndices.includes(4) && Math.random() < 0.6) return 4;

  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// Smart AI: Minimax algorithm (optimal play)
function getBestAiMove() {
  let bestScore = -Infinity;
  let move = -1;

  for (let i = 0; i < 9; i++) {
    if (state.board[i] === null) {
      state.board[i] = 'O';
      let score = minimax(state.board, 0, false);
      state.board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }

  return move;
}

function minimax(board, depth, isMaximizing) {
  const result = checkGameStatus(board);
  if (result) {
    if (result.winner === 'O') return 10 - depth;
    if (result.winner === 'X') return depth - 10;
    if (result.winner === 'tie') return 0;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        let evaluation = minimax(board, depth + 1, false);
        board[i] = null;
        maxEval = Math.max(maxEval, evaluation);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        let evaluation = minimax(board, depth + 1, true);
        board[i] = null;
        minEval = Math.min(minEval, evaluation);
      }
    }
    return minEval;
  }
}

// --- Round & Score Resets ---
function restartGame() {
  state.board = Array(9).fill(null);
  state.currentPlayer = 'X';
  state.gameActive = true;

  cells.forEach((cell) => {
    cell.textContent = '';
    cell.className = 'cell';
    cell.removeAttribute('disabled');
  });

  updateStatus();
}

function resetScores() {
  state.scores.X = 0;
  state.scores.O = 0;
  state.scores.ties = 0;
  scoreXElem.textContent = '0';
  scoreOElem.textContent = '0';
  scoreTiesElem.textContent = '0';
  restartGame();
}

// Start game
init();
