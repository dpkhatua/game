(() => {
  "use strict";

  const CELL = 20;
  const COLS = 20;
  const ROWS = 20;
  const STORAGE_KEY = "snakeHighScore";

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("highScore");
  const overlay = document.getElementById("overlay");
  const overlayText = document.getElementById("overlayText");
  const startBtn = document.getElementById("startBtn");
  const resetStatsBtn = document.getElementById("resetStatsBtn");
  const dpadButtons = document.querySelectorAll(".dpad button");

  let snake, dir, nextDir, food, score, highScore, running, paused, loopId;

  function loadHighScore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  function saveHighScore(value) {
    localStorage.setItem(STORAGE_KEY, String(value));
  }

  function randomFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    return pos;
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
    food = randomFood();
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

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // food
    ctx.fillStyle = "#f87171";
    ctx.beginPath();
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    ctx.arc(fx, fy, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();

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
      score += 10;
      scoreEl.textContent = String(score);
      food = randomFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function gameOver() {
    running = false;
    clearInterval(loopId);

    if (score > highScore) {
      highScore = score;
      saveHighScore(highScore);
      updateHighScoreDisplay();
      showOverlay(`New high score: ${highScore}! Press Start to play again.`);
    } else {
      showOverlay(`Game over. Score: ${score}. Press Start to play again.`);
    }
  }

  function startGame() {
    resetGame();
    hideOverlay();
    running = true;
    draw();
    clearInterval(loopId);
    loopId = setInterval(step, 110);
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) {
      showOverlay("Paused. Press Space to resume.", false);
    } else {
      hideOverlay();
    }
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
})();
