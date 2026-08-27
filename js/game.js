/**
 * Wordle Unlimited Main Game Engine (Ultra-Polished Modern UI/UX)
 * Includes Web Audio API, Confetti, Completion Timer, HTML5 Canvas Picture Scorecard,
 * Social Sharing (WhatsApp, X, Facebook, Instagram), Give Up & Answer Reveal, and Keyboard Sync.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Config State
  const state = {
    wordLength: 5,
    maxGuesses: 6,
    targetWord: '',
    currentGuess: '',
    guesses: [], // Array of { word, states: [] }
    currentRow: 0,
    isGameOver: false,
    hardMode: false,
    soundEnabled: true,
    darkTheme: false,
    startTime: null,
    elapsedSeconds: 0,
    stats: {
      played: 0,
      wins: 0,
      streak: 0,
      maxStreak: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    },
    keyStates: {}
  };

  // Web Audio Synthesizer for High-End Tactile UI Feedback
  const AudioEngine = {
    ctx: null,
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    },
    playPop() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(840, this.ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
      } catch (e) {}
    },
    playTileReveal(tileType) {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        let freq = 260;
        if (tileType === 'correct') freq = 523.25; // C5
        else if (tileType === 'present') freq = 440.00; // A4
        else freq = 293.66; // D4

        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
      } catch (e) {}
    },
    playWinChord() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
        notes.forEach((freq, index) => {
          setTimeout(() => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.5);
          }, index * 100);
        });
      } catch (e) {}
    },
    playError() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
      } catch (e) {}
    }
  };

  // DOM Elements
  const gameGrid = document.getElementById('game-grid');
  const keyboardContainer = document.getElementById('virtual-keyboard');
  const toastContainer = document.getElementById('toast-container');
  const nextGameBtn = document.getElementById('next-game-btn');
  const playAgainBtn = document.getElementById('play-again-btn');
  
  const statsModal = document.getElementById('stats-modal');
  const helpModal = document.getElementById('help-modal');
  const settingsModal = document.getElementById('settings-modal');
  const createModal = document.getElementById('create-modal');

  // Time & Helper functions
  function calculateElapsedSeconds() {
    if (!state.startTime) state.startTime = Date.now();
    return Math.max(1, Math.round((Date.now() - state.startTime) / 1000));
  }

  function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  // Load Saved Stats & Theme
  loadLocalStorage();
  checkURLCustomWord();
  initGame();
  setupEventListeners();

  function loadLocalStorage() {
    const savedStats = localStorage.getItem('wordle_unlimited_stats');
    if (savedStats) {
      try { state.stats = JSON.parse(savedStats); } catch (e) {}
    }

    const savedTheme = localStorage.getItem('wordle_unlimited_theme');
    if (savedTheme !== null) {
      state.darkTheme = savedTheme === 'dark';
    } else {
      state.darkTheme = false;
    }
    applyTheme();

    const savedHard = localStorage.getItem('wordle_unlimited_hard_mode');
    if (savedHard !== null) {
      state.hardMode = savedHard === 'true';
      const chk = document.getElementById('hard-mode-checkbox');
      if (chk) chk.checked = state.hardMode;
    }
  }

  function saveLocalStorage() {
    localStorage.setItem('wordle_unlimited_stats', JSON.stringify(state.stats));
    localStorage.setItem('wordle_unlimited_theme', state.darkTheme ? 'dark' : 'light');
    localStorage.setItem('wordle_unlimited_hard_mode', state.hardMode);
  }

  function applyTheme() {
    if (state.darkTheme) {
      document.documentElement.classList.add('dark-mode');
      if (document.body) document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      if (document.body) document.body.classList.remove('dark-mode');
    }
  }

  function checkURLCustomWord() {
    const params = new URLSearchParams(window.location.search);
    const custom = params.get('w');
    if (custom) {
      try {
        const decoded = atob(custom).toUpperCase();
        if (decoded.length === 5) {
          state.customWord = decoded;
        }
      } catch (e) {}
    }
  }

  function initGame() {
    state.isGameOver = false;
    state.currentGuess = '';
    state.guesses = [];
    state.currentRow = 0;
    state.keyStates = {};
    state.startTime = Date.now();
    state.elapsedSeconds = 0;

    if (state.customWord) {
      state.targetWord = state.customWord;
      showToast("Custom challenge loaded! Good luck.", 2500);
      state.customWord = null;
    } else {
      const targetPool = DICTIONARY[5].target;
      state.targetWord = targetPool[Math.floor(Math.random() * targetPool.length)].toUpperCase();
    }
    console.log(`[Target Word]: ${state.targetWord}`);

    renderGrid();
    renderKeyboard();
  }

  function renderGrid() {
    if (!gameGrid) return;
    gameGrid.innerHTML = '';
    for (let r = 0; r < 6; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'grid-row';
      rowDiv.dataset.row = r;

      for (let c = 0; c < 5; c++) {
        const tileDiv = document.createElement('div');
        tileDiv.className = 'tile';
        tileDiv.dataset.row = r;
        tileDiv.dataset.col = c;
        rowDiv.appendChild(tileDiv);
      }
      gameGrid.appendChild(rowDiv);
    }
  }

  function renderKeyboard() {
    if (!keyboardContainer) return;
    const layout = [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["DELETE", "Z", "X", "C", "V", "B", "N", "M", "ENTER"]
    ];

    keyboardContainer.innerHTML = '';
    layout.forEach(rowKeys => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'keyboard-row';
      rowKeys.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'key-btn';
        if (key === 'ENTER' || key === 'DELETE') btn.classList.add('large-key');
        btn.dataset.key = key;

        if (key === 'DELETE') {
          btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>`;
        } else if (key === 'ENTER') {
          btn.textContent = 'ENTER';
        } else {
          btn.textContent = key;
        }

        btn.addEventListener('click', () => handleKeyPress(key));
        rowDiv.appendChild(btn);
      });
      keyboardContainer.appendChild(rowDiv);
    });
  }

  function updateKeyboardColors() {
    if (!keyboardContainer) return;
    const buttons = keyboardContainer.querySelectorAll('.key-btn');
    buttons.forEach(btn => {
      const key = btn.dataset.key;
      const status = state.keyStates[key];
      if (status) {
        btn.classList.remove('correct', 'present', 'absent');
        btn.classList.add(status);
      }
    });
  }

  function handleKeyPress(key) {
    if (state.isGameOver) return;

    if (key === 'BACKSPACE' || key === 'DELETE') {
      deleteLetter();
    } else if (key === 'ENTER') {
      submitGuess();
    } else if (/^[a-zA-Z]$/.test(key)) {
      addLetter(key.toUpperCase());
    }
  }

  function addLetter(letter) {
    if (state.currentGuess.length < 5) {
      state.currentGuess += letter;
      AudioEngine.playPop();
      updateCurrentRowTiles();
    }
  }

  function deleteLetter() {
    if (state.currentGuess.length > 0) {
      state.currentGuess = state.currentGuess.slice(0, -1);
      AudioEngine.playPop();
      updateCurrentRowTiles();
    }
  }

  function updateCurrentRowTiles() {
    if (!gameGrid) return;
    const rowTiles = gameGrid.querySelectorAll(`.grid-row[data-row="${state.currentRow}"] .tile`);
    rowTiles.forEach((tile, index) => {
      const char = state.currentGuess[index] || '';
      tile.textContent = char;
      if (char) {
        tile.classList.add('pop');
        tile.setAttribute('data-letter', char);
      } else {
        tile.classList.remove('pop');
        tile.removeAttribute('data-letter');
      }
    });
  }

  function submitGuess() {
    if (state.currentGuess.length !== 5) {
      AudioEngine.playError();
      showToast("Not enough letters", 1500);
      shakeRow(state.currentRow);
      return;
    }

    const lowerGuess = state.currentGuess.toLowerCase();
    const dictionary = DICTIONARY[5];
    const isValid = dictionary.target.includes(lowerGuess) || dictionary.allowed.includes(lowerGuess);

    if (!isValid) {
      AudioEngine.playError();
      showToast("Not in word list", 1500);
      shakeRow(state.currentRow);
      return;
    }

    // Hard Mode Enforcement
    if (state.hardMode && state.guesses.length > 0) {
      const lastAttempt = state.guesses[state.guesses.length - 1];
      for (let i = 0; i < 5; i++) {
        if (lastAttempt.states[i] === 'correct' && state.currentGuess[i] !== lastAttempt.word[i]) {
          AudioEngine.playError();
          showToast(`Must use ${lastAttempt.word[i]} in position ${i + 1}`, 2000);
          shakeRow(state.currentRow);
          return;
        }
      }
    }

    const evalStates = evaluateGuess(state.currentGuess, state.targetWord);
    state.guesses.push({ word: state.currentGuess, states: evalStates });

    revealRow(state.currentRow, evalStates, () => {
      state.currentGuess.split('').forEach((ch, idx) => {
        const st = evalStates[idx];
        const existing = state.keyStates[ch];
        if (st === 'correct') state.keyStates[ch] = 'correct';
        else if (st === 'present' && existing !== 'correct') state.keyStates[ch] = 'present';
        else if (st === 'absent' && !existing) state.keyStates[ch] = 'absent';
      });
      updateKeyboardColors();

      if (state.currentGuess === state.targetWord) {
        handleWin();
      } else if (state.currentRow >= 5) {
        handleLoss();
      } else {
        state.currentRow++;
        state.currentGuess = '';
      }
    });
  }

  function evaluateGuess(guess, target) {
    const result = Array(5).fill('absent');
    const targetArr = target.split('');
    const guessArr = guess.split('');

    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === targetArr[i]) {
        result[i] = 'correct';
        targetArr[i] = null;
      }
    }

    for (let i = 0; i < 5; i++) {
      if (result[i] !== 'correct') {
        const matchIdx = targetArr.indexOf(guessArr[i]);
        if (matchIdx !== -1) {
          result[i] = 'present';
          targetArr[matchIdx] = null;
        }
      }
    }

    return result;
  }

  function revealRow(rowIdx, states, callback) {
    if (!gameGrid) return;
    const rowTiles = gameGrid.querySelectorAll(`.grid-row[data-row="${rowIdx}"] .tile`);
    rowTiles.forEach((tile, colIdx) => {
      setTimeout(() => {
        tile.classList.add('flip');
        setTimeout(() => {
          tile.classList.add(states[colIdx]);
          AudioEngine.playTileReveal(states[colIdx]);
        }, 250);
      }, colIdx * 280);
    });

    setTimeout(() => {
      if (callback) callback();
    }, 5 * 280 + 300);
  }

  function shakeRow(rowIdx) {
    if (!gameGrid) return;
    const row = gameGrid.querySelector(`.grid-row[data-row="${rowIdx}"]`);
    if (row) {
      row.classList.add('shake');
      setTimeout(() => row.classList.remove('shake'), 500);
    }
  }

  function handleWin() {
    state.isGameOver = true;
    state.elapsedSeconds = calculateElapsedSeconds();
    state.stats.played++;
    state.stats.wins++;
    state.stats.streak++;
    if (state.stats.streak > state.stats.maxStreak) state.stats.maxStreak = state.stats.streak;
    const guessNum = state.currentRow + 1;
    state.stats.distribution[guessNum] = (state.stats.distribution[guessNum] || 0) + 1;
    saveLocalStorage();

    // Cascading wave bounce across winning row
    if (gameGrid) {
      const winningTiles = gameGrid.querySelectorAll(`.grid-row[data-row="${state.currentRow}"] .tile`);
      winningTiles.forEach((tile, idx) => {
        setTimeout(() => {
          tile.classList.add('win-bounce');
        }, idx * 100);
      });
    }

    AudioEngine.playWinChord();
    triggerConfetti();

    const praises = ["Magnificent! 🎉", "Genius! 🌟", "Impressive! 🚀", "Splendid! ✨", "Phew! 🎯"];
    const praise = praises[Math.min(state.currentRow, praises.length - 1)];
    const timeFormatted = formatTime(state.elapsedSeconds);
    showToast(`${praise} Solved in ${timeFormatted}! ⏱️`, 3800);
    setTimeout(() => showStatsModal(true), 2400);
  }

  function handleLoss() {
    state.isGameOver = true;
    state.elapsedSeconds = calculateElapsedSeconds();
    state.stats.played++;
    state.stats.streak = 0;
    saveLocalStorage();

    const timeFormatted = formatTime(state.elapsedSeconds);
    showToast(`The word was: ${state.targetWord} (⏱️ ${timeFormatted})`, 4500);
    setTimeout(() => showStatsModal(false), 2800);
  }

  function giveHint() {
    if (state.isGameOver) return;
    for (let i = 0; i < 5; i++) {
      const correctChar = state.targetWord[i];
      let alreadySolved = state.guesses.some(g => g.states[i] === 'correct');
      if (!alreadySolved) {
        showToast(`💡 Hint: Position ${i + 1} is '${correctChar}'`, 3500);
        return;
      }
    }
    showToast("You've already uncovered all letter positions!", 2000);
  }

  function handleGiveUp() {
    if (state.isGameOver) {
      showToast(`The word was: ${state.targetWord}`, 4000);
      return;
    }

    AudioEngine.playError();
    state.isGameOver = true;
    state.elapsedSeconds = calculateElapsedSeconds();
    state.stats.played++;
    state.stats.streak = 0;
    saveLocalStorage();

    // Reveal target word with animations on current row
    if (gameGrid) {
      const targetLetters = state.targetWord.split('');
      const rowTiles = gameGrid.querySelectorAll(`.grid-row[data-row="${state.currentRow}"] .tile`);
      rowTiles.forEach((tile, idx) => {
        tile.textContent = targetLetters[idx];
        setTimeout(() => {
          tile.classList.add('flip');
          setTimeout(() => {
            tile.classList.add('correct');
          }, 250);
        }, idx * 150);
      });

      targetLetters.forEach(ch => {
        state.keyStates[ch] = 'correct';
      });
      setTimeout(updateKeyboardColors, 5 * 150 + 200);
    }

    const timeFormatted = formatTime(state.elapsedSeconds);
    showToast(`🏳️ Surrendered in ${timeFormatted}! The word was: ${state.targetWord}`, 5000);
    setTimeout(() => {
      showStatsModal(false);
    }, 2200);
  }

  function triggerConfetti() {
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#22c55e', '#eab308', '#38bdf8', '#a855f7', '#f43f5e', '#ffffff'];
    for (let i = 0; i < 100; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: 7 + Math.random() * 8,
        h: 7 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: 2 + Math.random() * 5,
        vx: -2 + Math.random() * 4,
        rot: Math.random() * 360
      });
    }

    let startTime = Date.now();
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.rot += 4;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (Date.now() - startTime < 3000) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }
    animate();
  }

  function showToast(msg, duration = 2000) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  function showStatsModal(won) {
    if (!statsModal) return;
    const playedEl = document.getElementById('stat-played');
    const winPctEl = document.getElementById('stat-win-pct');
    const streakEl = document.getElementById('stat-streak');
    const maxStreakEl = document.getElementById('stat-max-streak');
    const distContainer = document.getElementById('dist-container');
    const revealBanner = document.getElementById('reveal-word-banner');

    if (revealBanner) {
      if (state.isGameOver) {
        revealBanner.style.display = 'block';
        const timeText = formatTime(state.elapsedSeconds);
        revealBanner.innerHTML = won
          ? `<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
               <div><span style="color: var(--color-correct); font-weight: 700;">Solved! 🎉</span> Word: <strong style="letter-spacing: 0.1em; color: var(--text-color); font-size: 1.15rem; text-transform: uppercase;">${state.targetWord}</strong></div>
               <div style="font-size: 0.86rem; color: var(--text-muted); background: var(--bg-color); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--card-border);">⏱️ <strong>${timeText}</strong> (${state.currentRow + 1}/6)</div>
             </div>`
          : `<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
               <div><span style="color: #ef4444; font-weight: 700;">Secret Word:</span> <strong style="letter-spacing: 0.1em; color: var(--text-color); font-size: 1.15rem; text-transform: uppercase;">${state.targetWord}</strong></div>
               <div style="font-size: 0.86rem; color: var(--text-muted); background: var(--bg-color); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--card-border);">⏱️ <strong>${timeText}</strong></div>
             </div>`;
      } else {
        revealBanner.style.display = 'none';
      }
    }

    if (playedEl) playedEl.textContent = state.stats.played;
    if (winPctEl) winPctEl.textContent = state.stats.played ? Math.round((state.stats.wins / state.stats.played) * 100) : 0;
    if (streakEl) streakEl.textContent = state.stats.streak;
    if (maxStreakEl) maxStreakEl.textContent = state.stats.maxStreak;

    if (distContainer) {
      distContainer.innerHTML = '';
      const maxCount = Math.max(...Object.values(state.stats.distribution), 1);
      for (let i = 1; i <= 6; i++) {
        const count = state.stats.distribution[i] || 0;
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '6px';
        row.style.marginBottom = '3px';
        row.innerHTML = `<span style="font-weight: 700; font-size: 0.78rem; width: 10px; color: var(--text-muted);">${i}</span>
          <div style="flex: 1; background: var(--bg-color); border-radius: 4px; overflow: hidden; height: 18px; display: flex; align-items: center;">
            <div style="background: ${won && state.currentRow + 1 === i ? 'var(--color-correct)' : 'var(--color-absent)'}; width: ${Math.max(8, (count / maxCount) * 100)}%; height: 100%; display: flex; align-items: center; justify-content: flex-end; padding-right: 6px; color: #fff; font-weight: 700; font-size: 0.72rem; border-radius: 4px; transition: width 0.5s ease;">${count}</div>
          </div>`;
        distContainer.appendChild(row);
      }
    }

    statsModal.classList.add('active');
  }

  // Generate HD Picture Scorecard Image on Canvas
  function generateScoreCardCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 740;
    const ctx = canvas.getContext('2d');

    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Card Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(14, 14, canvas.width - 28, canvas.height - 28, 16);
      ctx.stroke();
    } else {
      ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    }

    // Title Badge
    ctx.fillStyle = '#22c55e';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 140, 42, 280, 46, 10);
      ctx.fill();
    } else {
      ctx.fillRect(canvas.width / 2 - 140, 42, 280, 46);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WORDLE UNLIMITED', canvas.width / 2, 73);

    // Outcome & Time Subtitle
    const isWon = state.guesses.some(g => g.word === state.targetWord);
    const guessCountText = isWon ? `${state.guesses.length}/6 Guesses` : 'X/6 Attempts';
    const timeFormatted = formatTime(state.elapsedSeconds);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 17px Poppins, sans-serif';
    ctx.fillText(`${isWon ? 'Solved! 🎉' : 'Puzzle Ended'} • ${guessCountText} • ⏱️ ${timeFormatted}`, canvas.width / 2, 122);

    // Draw the 5x6 Tile Grid
    const tileSize = 58;
    const tileGap = 8;
    const gridTotalWidth = 5 * tileSize + 4 * tileGap;
    const startX = (canvas.width - gridTotalWidth) / 2;
    const startY = 150;

    for (let r = 0; r < 6; r++) {
      const guess = state.guesses[r];
      for (let c = 0; c < 5; c++) {
        const x = startX + c * (tileSize + tileGap);
        const y = startY + r * (tileSize + tileGap);

        let bgColor = '#1e293b';
        let strokeColor = '#334155';
        let letter = '';

        if (guess) {
          letter = guess.word[c] || '';
          const st = guess.states[c];
          if (st === 'correct') {
            bgColor = '#538d4e';
            strokeColor = '#538d4e';
          } else if (st === 'present') {
            bgColor = '#b59f3b';
            strokeColor = '#b59f3b';
          } else {
            bgColor = '#3a3a3c';
            strokeColor = '#3a3a3c';
          }
        }

        // Draw Tile Box
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, tileSize, tileSize, 8);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(x, y, tileSize, tileSize);
          ctx.strokeRect(x, y, tileSize, tileSize);
        }

        // Draw Letter Text
        if (letter) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 26px Poppins, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter, x + tileSize / 2, y + tileSize / 2 + 1);
        }
      }
    }

    // Secret Word Banner at bottom
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#334155';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 130, 575, 260, 42, 8);
      ctx.fill();
    } else {
      ctx.fillRect(canvas.width / 2 - 130, 575, 260, 42);
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 16px Poppins, sans-serif';
    ctx.fillText(`WORD: ${state.targetWord}`, canvas.width / 2, 602);

    // Footer Watermark
    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px Poppins, sans-serif';
    ctx.fillText('Play free online at wordle-unlimited.app', canvas.width / 2, 655);

    return canvas;
  }

  function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      handleKeyPress(e.key);
    });

    if (nextGameBtn) nextGameBtn.addEventListener('click', initGame);
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        statsModal.classList.remove('active');
        initGame();
      });
    }

    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) hintBtn.addEventListener('click', giveHint);

    const giveUpBtn = document.getElementById('give-up-btn');
    if (giveUpBtn) giveUpBtn.addEventListener('click', handleGiveUp);

    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) statsBtn.addEventListener('click', () => showStatsModal(false));

    const helpBtn = document.getElementById('help-btn');
    if (helpBtn && helpModal) helpBtn.addEventListener('click', () => helpModal.classList.add('active'));

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn && settingsModal) settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));

    const createBtn = document.getElementById('create-game-btn');
    if (createBtn && createModal) createBtn.addEventListener('click', () => createModal.classList.add('active'));

    // Theme Toggle in settings modal
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        if (typeof window.toggleGlobalTheme === 'function') {
          window.toggleGlobalTheme();
        }
      });
    }

    // Listen for global theme changes from any button
    window.addEventListener('themechange', (e) => {
      state.darkTheme = e.detail.isDark;
    });

    // Hard Mode Checkboxes
    const hardModeCheckbox = document.getElementById('hard-mode-checkbox');
    function setHardMode(val) {
      state.hardMode = val;
      if (hardModeCheckbox) hardModeCheckbox.checked = val;
      saveLocalStorage();
      showToast(`Hard Mode: ${state.hardMode ? 'ON' : 'OFF'}`, 1500);
    }

    if (hardModeCheckbox) {
      hardModeCheckbox.addEventListener('change', (e) => setHardMode(e.target.checked));
    }

    // Custom Word Creator Link Generator
    const genLinkBtn = document.getElementById('generate-link-btn');
    const customWordInput = document.getElementById('custom-word-input');
    if (genLinkBtn && customWordInput) {
      genLinkBtn.addEventListener('click', () => {
        const word = customWordInput.value.trim().toUpperCase();
        if (word.length !== 5 || !/^[A-Z]+$/.test(word)) {
          showToast("Must be exactly 5 letters", 2000);
          return;
        }
        const encoded = btoa(word);
        const link = `${window.location.origin}${window.location.pathname}?w=${encoded}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(link);
          showToast("Custom challenge link copied to clipboard! 📋", 2500);
          createModal.classList.remove('active');
        }
      });
    }

    // Modal Close buttons
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        statsModal.classList.remove('active');
        if (helpModal) helpModal.classList.remove('active');
        if (settingsModal) settingsModal.classList.remove('active');
        if (createModal) createModal.classList.remove('active');
      });
    });

    // WhatsApp Sharing
    const whatsappBtn = document.getElementById('share-whatsapp-btn');
    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', () => {
        const isWon = state.guesses.some(g => g.word === state.targetWord);
        const timeText = formatTime(state.elapsedSeconds);
        let text = `*Wordle Unlimited* ${isWon ? state.guesses.length : 'X'}/6 (⏱️ ${timeText})\n\n`;
        state.guesses.forEach(g => {
          g.states.forEach(st => {
            if (st === 'correct') text += '🟩';
            else if (st === 'present') text += '🟨';
            else text += '⬛';
          });
          text += '\n';
        });
        text += `\nPlay online: https://wordle-unlimited.app/`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      });
    }

    // X (Twitter) Sharing
    const xBtn = document.getElementById('share-x-btn');
    if (xBtn) {
      xBtn.addEventListener('click', () => {
        const isWon = state.guesses.some(g => g.word === state.targetWord);
        const timeText = formatTime(state.elapsedSeconds);
        let text = `Wordle Unlimited ${isWon ? state.guesses.length : 'X'}/6 (⏱️ ${timeText})\n\n`;
        state.guesses.forEach(g => {
          g.states.forEach(st => {
            if (st === 'correct') text += '🟩';
            else if (st === 'present') text += '🟨';
            else text += '⬛';
          });
          text += '\n';
        });
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://wordle-unlimited.app/')}`;
        window.open(url, '_blank');
      });
    }

    // Facebook Sharing
    const fbBtn = document.getElementById('share-fb-btn');
    if (fbBtn) {
      fbBtn.addEventListener('click', () => {
        const timeText = formatTime(state.elapsedSeconds);
        const quote = `I played Wordle Unlimited in ${timeText}!`;
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://wordle-unlimited.app/')}&quote=${encodeURIComponent(quote)}`;
        window.open(url, '_blank');
      });
    }

    // Instagram / Image Share Button (Native Mobile Share with Picture File or Instant PNG Download)
    const instagramBtn = document.getElementById('share-instagram-btn');
    if (instagramBtn) {
      instagramBtn.addEventListener('click', () => {
        const canvas = generateScoreCardCanvas();
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'wordle-scorecard.png', { type: 'image/png' });
          const shareData = {
            title: 'Wordle Unlimited Score',
            text: `I finished Wordle Unlimited in ${formatTime(state.elapsedSeconds)} (${state.guesses.length}/6)! Can you beat me? https://wordle-unlimited.app/`,
            files: [file]
          };

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share(shareData);
              showToast("Score Card Shared! 📸", 2500);
              return;
            } catch (err) {}
          }

          // Fallback: Download Image for Instagram Story / Post
          const link = document.createElement('a');
          link.download = `wordle-scorecard-${state.targetWord.toLowerCase()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          showToast("Card Image downloaded! Ready for Instagram Story & Posts 📸", 3500);
        });
      });
    }

    // Download HD Picture Card Button
    const downloadCardBtn = document.getElementById('download-card-btn');
    if (downloadCardBtn) {
      downloadCardBtn.addEventListener('click', () => {
        const canvas = generateScoreCardCanvas();
        const link = document.createElement('a');
        link.download = `wordle-unlimited-${state.targetWord.toLowerCase()}-${state.elapsedSeconds}s.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast("HD Score Card downloaded! 📸", 2500);
      });
    }

    // Share Text button (Clipboard)
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const timeText = formatTime(state.elapsedSeconds);
        const isWon = state.guesses.some(g => g.word === state.targetWord);
        let gridText = `Wordle Unlimited ${isWon ? state.guesses.length : 'X'}/6 (⏱️ ${timeText})\n\n`;
        state.guesses.forEach(g => {
          g.states.forEach(st => {
            if (st === 'correct') gridText += '🟩';
            else if (st === 'present') gridText += '🟨';
            else gridText += '⬛';
          });
          gridText += '\n';
        });
        gridText += '\nPlay online for free: https://wordle-unlimited.app/';

        if (navigator.clipboard) {
          navigator.clipboard.writeText(gridText);
          showToast("Score text copied to clipboard! 📋", 2200);
        }
      });
    }

    // Horizontal Blog Carousel Navigation Controls
    const carouselTrack = document.getElementById('blog-carousel-track');
    const prevBtn = document.getElementById('carousel-prev-btn');
    const nextBtn = document.getElementById('carousel-next-btn');
    if (carouselTrack && prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        carouselTrack.scrollBy({ left: -300, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
        carouselTrack.scrollBy({ left: 300, behavior: 'smooth' });
      });
    }
  }
});
