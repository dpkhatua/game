(() => {
  "use strict";

  const CELL = 16;
  const COLS = 25;
  const ROWS = 25;
  const STORAGE_KEY = "snakeHighScore";

  const INITIAL_INTERVAL = 200;
  const MIN_INTERVAL = 40;
  const SPEED_STEP = 10;
  const EAT_MILESTONE = 10;
  const NORMAL_SCORE = 10;
  const BONUS_SCORE = 50;
  const BONUS_DURATION = 4500;

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("highScore");
  const overlay = document.getElementById("overlay");
  const overlayText = document.getElementById("overlayText");
  const startBtn = document.getElementById("startBtn");
  const resetStatsBtn = document.getElementById("resetStatsBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resumeBtn = document.getElementById("resumeBtn");
  const stopBtn = document.getElementById("stopBtn");
  const pauseResumeBtn = document.getElementById("pauseResumeBtn");
  const dpadButtons = document.querySelectorAll(".dpad-cross button[data-dir]");

  let snake, dir, nextDir, food, score, highScore, running, paused, loopId;
  let eatCount, currentInterval, bonusTimeoutId;

  function loadHighScore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  function saveHighScore(value) {
    localStorage.setItem(STORAGE_KEY, String(value));
  }

  function randomFood(isBonus = false) {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
        bonus: isBonus,
      };
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  function clearBonusTimer() {
    if (bonusTimeoutId) {
      clearTimeout(bonusTimeoutId);
      bonusTimeoutId = null;
    }
  }

  function restartLoop() {
    clearInterval(loopId);
    loopId = setInterval(step, currentInterval);
  }

  function resetGame() {
    snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    eatCount = 0;
    currentInterval = INITIAL_INTERVAL;
    clearBonusTimer();
    food = randomFood(false);
    scoreEl.textContent = "0";
    paused = false;
  }

  function updateHighScoreDisplay() {
    highScoreEl.textContent = String(highScore);
  }

  function showOverlay(text, showButton = true) {
    overlayText.textContent = text;
    startBtn.style.display = showButton ? "inline-block" : "none";
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function updateControlButtons() {
    pauseBtn.disabled = !running || paused;
    resumeBtn.disabled = !running || !paused;
    stopBtn.disabled = !running;

    pauseResumeBtn.disabled = !running;
    if (!running || !paused) {
      pauseResumeBtn.textContent = "❙❙"; // pause icon
      pauseResumeBtn.setAttribute("aria-label", "Pause");
    } else {
      pauseResumeBtn.textContent = "▶"; // play/resume icon
      pauseResumeBtn.setAttribute("aria-label", "Resume");
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // food
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    ctx.fillStyle = food.bonus ? "#facc15" : "#f87171";
    ctx.beginPath();
    const radius = food.bonus ? CELL / 2 + 2 : CELL / 2 - 3;
    ctx.arc(fx, fy, radius, 0, Math.PI * 2);
    ctx.fill();
    if (food.bonus) {
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // snake
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? "#4ade80" : "#22c55e";
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }

  function step() {
    if (!running || paused) return;

    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // wrap around the edges instead of dying on the wall
    if (head.x < 0) head.x = COLS - 1;
    else if (head.x >= COLS) head.x = 0;
    if (head.y < 0) head.y = ROWS - 1;
    else if (head.y >= ROWS) head.y = 0;

    // self collision
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      if (food.bonus) {
        // bonus food eaten: points only, no speed/milestone re-trigger
        score += BONUS_SCORE;
        clearBonusTimer();
        food = randomFood(false);
      } else {
        score += NORMAL_SCORE;
        eatCount++;
        if (eatCount % EAT_MILESTONE === 0) {
          // speed up a notch
          currentInterval = Math.max(MIN_INTERVAL, currentInterval - SPEED_STEP);
          restartLoop();
          // spawn a temporary, bigger bonus food
          food = randomFood(true);
          clearBonusTimer();
          bonusTimeoutId = setTimeout(() => {
            if (food.bonus) food = randomFood(false);
            bonusTimeoutId = null;
          }, BONUS_DURATION);
        } else {
          food = randomFood(false);
        }
      }
      scoreEl.textContent = String(score);
    } else {
      snake.pop();
    }

    draw();
  }

  function gameOver() {
    running = false;
    paused = false;
    clearInterval(loopId);
    clearBonusTimer();

    if (score > highScore) {
      highScore = score;
      saveHighScore(highScore);
      updateHighScoreDisplay();
      showOverlay(`New high score: ${highScore}! Press Start to play again.`);
    } else {
      showOverlay(`Game over. Score: ${score}. Press Start to play again.`);
    }
    updateControlButtons();
  }

  function startGame() {
    resetGame();
    hideOverlay();
    running = true;
    draw();
    restartLoop();
    updateControlButtons();
  }

  function pauseGame() {
    if (!running || paused) return;
    paused = true;
    showOverlay("Paused. Press Resume to continue.", false);
    updateControlButtons();
  }

  function resumeGame() {
    if (!running || !paused) return;
    paused = false;
    hideOverlay();
    updateControlButtons();
  }

  function togglePause() {
    if (!running) return;
    if (paused) resumeGame();
    else pauseGame();
  }

  function stopGame() {
    if (!running) return;
    running = false;
    paused = false;
    clearInterval(loopId);
    clearBonusTimer();

    if (score > highScore) {
      highScore = score;
      saveHighScore(highScore);
      updateHighScoreDisplay();
    }
    showOverlay(`Stopped. Score: ${score}. Press Start to play again.`);
    updateControlButtons();
  }

  function setDirection(name) {
    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    const d = map[name];
    if (!d) return;
    // prevent reversing directly into itself
    if (d.x === -dir.x && d.y === -dir.y) return;
    nextDir = d;
  }

  const keyMap = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
  };

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (!running) {
        startGame();
      } else {
        togglePause();
      }
      return;
    }
    const d = keyMap[e.code];
    if (d) {
      e.preventDefault();
      setDirection(d);
    }
  });

  dpadButtons.forEach((btn) => {
    btn.addEventListener("click", () => setDirection(btn.dataset.dir));
  });

  startBtn.addEventListener("click", startGame);
  pauseBtn.addEventListener("click", pauseGame);
  resumeBtn.addEventListener("click", resumeGame);
  stopBtn.addEventListener("click", stopGame);
  pauseResumeBtn.addEventListener("click", togglePause);

  resetStatsBtn.addEventListener("click", () => {
    if (!confirm("Reset your high score to 0?")) return;
    highScore = 0;
    saveHighScore(0);
    updateHighScoreDisplay();
  });

  // init
  highScore = loadHighScore();
  updateHighScoreDisplay();
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  food = randomFood();
  draw();
  showOverlay("Press Space or tap Start to play");
  updateControlButtons();
})();
