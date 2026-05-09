const SIZE = 9;
const BOX = 3;
const EMPTY = 0;
const DIFFICULTY = {
  easy: { holes: 38, label: "Easy" },
  medium: { holes: 46, label: "Medium" },
  hard: { holes: 52, label: "Hard" },
  expert: { holes: 58, label: "Expert" },
  daily: { holes: 50, label: "Daily Challenge" },
};

const boardEl = document.querySelector("#board");
const numberPadEl = document.querySelector("#numberPad");
const timerEl = document.querySelector("#timer");
const scoreEl = document.querySelector("#score");
const mistakesEl = document.querySelector("#mistakes");
const progressEl = document.querySelector("#progress");
const progressBarEl = document.querySelector("#progressBar");
const difficultyLabelEl = document.querySelector("#difficultyLabel");
const modeLabelEl = document.querySelector("#modeLabel");
const toastEl = document.querySelector("#toast");
const streakEl = document.querySelector("#streak");
const recordsEl = document.querySelector("#records");
const celebrationEl = document.querySelector("#celebration");

let solution = [];
let puzzle = [];
let current = [];
let fixedCells = [];
let notes = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => new Set()));
let selected = { row: 0, col: 0 };
let difficulty = "easy";
let noteMode = false;
let mistakes = 0;
let score = 1000;
let seconds = 0;
let timerId = null;
let undoStack = [];
let solved = false;
let soundOn = JSON.parse(localStorage.getItem("sudoku.sound") ?? "true");

const state = {
  theme: localStorage.getItem("sudoku.theme") || "dark",
  streak: Number(localStorage.getItem("sudoku.streak") || "0"),
  lastDailyWin: localStorage.getItem("sudoku.lastDailyWin") || "",
};

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(values, random = Math.random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isSafe(grid, row, col, value) {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === value || grid[i][col] === value) return false;
  }
  const startRow = Math.floor(row / BOX) * BOX;
  const startCol = Math.floor(col / BOX) * BOX;
  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) {
      if (grid[startRow + r][startCol + c] === value) return false;
    }
  }
  return true;
}

// Backtracking creates a complete valid solved grid before cells are removed.
function fillGrid(grid, random = Math.random) {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (grid[row][col] === EMPTY) {
        for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random)) {
          if (isSafe(grid, row, col, value)) {
            grid[row][col] = value;
            if (fillGrid(grid, random)) return true;
            grid[row][col] = EMPTY;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function createSolution(random = Math.random) {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  fillGrid(grid, random);
  return grid;
}

function createPuzzle(fullGrid, holes, random = Math.random) {
  const grid = cloneGrid(fullGrid);
  const cells = shuffle([...Array(81).keys()], random);
  for (let i = 0; i < holes; i++) {
    const row = Math.floor(cells[i] / SIZE);
    const col = cells[i] % SIZE;
    grid[row][col] = EMPTY;
  }
  return grid;
}

function startGame(nextDifficulty = difficulty) {
  difficulty = nextDifficulty;
  const today = new Date().toISOString().slice(0, 10);
  const random = difficulty === "daily" ? seededRandom(today) : Math.random;
  solution = createSolution(random);
  puzzle = createPuzzle(solution, DIFFICULTY[difficulty].holes, random);
  current = cloneGrid(puzzle);
  fixedCells = puzzle.map((row) => row.map(Boolean));
  notes = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => new Set()));
  selected = findFirstEmpty() || { row: 0, col: 0 };
  mistakes = 0;
  score = 1000;
  seconds = 0;
  undoStack = [];
  solved = false;
  updateDifficultyUi();
  renderBoard(true);
  renderStats();
  startTimer();
  playSound("start");
  showToast(difficulty === "daily" ? "Today's unique challenge is loaded." : "Fresh puzzle generated.");
}

function findFirstEmpty() {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!current[row][col]) return { row, col };
    }
  }
  return null;
}

function renderBoard(animated = false) {
  boardEl.innerHTML = "";
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}`);
      if (fixedCells[row][col]) cell.classList.add("fixed");
      if (animated) {
        cell.classList.add("reveal");
        cell.style.animationDelay = `${(row * 9 + col) * 8}ms`;
      }
      cell.addEventListener("click", () => selectCell(row, col));
      boardEl.appendChild(cell);
    }
  }
  updateCells();
}

function updateCells() {
  const selectedValue = current[selected.row]?.[selected.col];
  document.querySelectorAll(".cell").forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const value = current[row][col];
    const sameBox = Math.floor(row / BOX) === Math.floor(selected.row / BOX) && Math.floor(col / BOX) === Math.floor(selected.col / BOX);
    cell.className = "cell";
    if (fixedCells[row][col]) cell.classList.add("fixed");
    if (row === selected.row && col === selected.col) cell.classList.add("selected");
    if (row === selected.row || col === selected.col || sameBox) cell.classList.add("peer");
    if (value && selectedValue && value === selectedValue) cell.classList.add("same");
    if (value && value !== solution[row][col]) cell.classList.add("wrong");
    cell.innerHTML = value ? String(value) : renderNotes(row, col);
  });
}

function renderNotes(row, col) {
  if (!notes[row][col].size) return "";
  return `<span class="notes">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<i>${notes[row][col].has(n) ? n : ""}</i>`).join("")}</span>`;
}

function selectCell(row, col) {
  selected = { row, col };
  updateCells();
  playSound("tap");
}

function enterNumber(value) {
  if (solved) return;
  const { row, col } = selected;
  if (fixedCells[row][col]) {
    showToast("Original clues are locked.");
    playSound("error");
    return;
  }

  const before = current[row][col];
  const beforeNotes = new Set(notes[row][col]);
  undoStack.push({ row, col, before, beforeNotes });

  if (noteMode) {
    if (notes[row][col].has(value)) notes[row][col].delete(value);
    else notes[row][col].add(value);
    current[row][col] = EMPTY;
    playSound("note");
  } else {
    current[row][col] = value;
    notes[row][col].clear();
    clearRelatedNotes(row, col, value);
    if (value !== solution[row][col]) {
      mistakes += 1;
      score = Math.max(0, score - 80);
      playSound("error");
      showToast(mistakes >= 5 ? "Mistake limit reached. Try a reset or solve." : "That number does not fit.");
    } else {
      score += 20;
      playSound("correct");
    }
  }

  updateCells();
  renderStats();
  checkWin();
}

function clearRelatedNotes(row, col, value) {
  for (let i = 0; i < SIZE; i++) {
    notes[row][i].delete(value);
    notes[i][col].delete(value);
  }
  const startRow = Math.floor(row / BOX) * BOX;
  const startCol = Math.floor(col / BOX) * BOX;
  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) notes[startRow + r][startCol + c].delete(value);
  }
}

function eraseCell() {
  const { row, col } = selected;
  if (fixedCells[row][col] || solved) return;
  undoStack.push({ row, col, before: current[row][col], beforeNotes: new Set(notes[row][col]) });
  current[row][col] = EMPTY;
  notes[row][col].clear();
  updateCells();
  renderStats();
  playSound("tap");
}

function undoMove() {
  const move = undoStack.pop();
  if (!move) {
    showToast("Nothing to undo.");
    return;
  }
  current[move.row][move.col] = move.before;
  notes[move.row][move.col] = new Set(move.beforeNotes);
  selected = { row: move.row, col: move.col };
  updateCells();
  renderStats();
  playSound("tap");
}

function giveHint() {
  if (solved) return;
  const empties = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!fixedCells[row][col] && current[row][col] !== solution[row][col]) empties.push({ row, col });
    }
  }
  if (!empties.length) return;
  const pick = empties[Math.floor(Math.random() * empties.length)];
  undoStack.push({ row: pick.row, col: pick.col, before: current[pick.row][pick.col], beforeNotes: new Set(notes[pick.row][pick.col]) });
  current[pick.row][pick.col] = solution[pick.row][pick.col];
  notes[pick.row][pick.col].clear();
  selected = pick;
  score = Math.max(0, score - 120);
  updateCells();
  renderStats();
  playSound("hint");
  showToast("Hint revealed.");
  checkWin();
}

function checkGame() {
  let wrong = 0;
  let filled = 0;
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (current[row][col]) filled += 1;
      if (current[row][col] && current[row][col] !== solution[row][col]) wrong += 1;
    }
  }
  updateCells();
  playSound(wrong ? "error" : "correct");
  showToast(wrong ? `${wrong} cell${wrong > 1 ? "s" : ""} need another look.` : filled === 81 ? "Perfect board." : "Everything filled so far is correct.");
  checkWin();
}

function solveGame() {
  current = cloneGrid(solution);
  notes = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => new Set()));
  score = 0;
  solved = true;
  stopTimer();
  updateCells();
  renderStats();
  playSound("hint");
  showToast("Solution revealed.");
}

function resetGame() {
  current = cloneGrid(puzzle);
  notes = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => new Set()));
  undoStack = [];
  mistakes = 0;
  score = 1000;
  seconds = 0;
  solved = false;
  startTimer();
  updateCells();
  renderStats();
  playSound("start");
  showToast("Puzzle reset.");
}

function checkWin() {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (current[row][col] !== solution[row][col]) return false;
    }
  }
  if (solved) return true;
  solved = true;
  stopTimer();
  const bonus = Math.max(0, 900 - seconds * 2 - mistakes * 120);
  score += bonus;
  updateRecords();
  renderStats();
  launchConfetti();
  playSound("win");
  showToast(`Solved in ${formatTime(seconds)}. Final score ${score}.`);
  return true;
}

function updateRecords() {
  const today = new Date().toISOString().slice(0, 10);
  const key = `sudoku.best.${difficulty}`;
  const best = Number(localStorage.getItem(key) || "0");
  if (!best || seconds < best) localStorage.setItem(key, String(seconds));
  if (difficulty === "daily" && state.lastDailyWin !== today) {
    state.streak += 1;
    state.lastDailyWin = today;
    localStorage.setItem("sudoku.streak", String(state.streak));
    localStorage.setItem("sudoku.lastDailyWin", today);
  }
  renderRecords();
}

function renderStats() {
  const filled = current.flat().filter(Boolean).length;
  const progress = Math.round((filled / 81) * 100);
  timerEl.textContent = formatTime(seconds);
  scoreEl.textContent = score;
  mistakesEl.textContent = mistakes;
  progressEl.textContent = `${progress}%`;
  progressBarEl.style.width = `${progress}%`;
  streakEl.textContent = state.streak;
}

function renderRecords() {
  recordsEl.innerHTML = "";
  Object.keys(DIFFICULTY).forEach((key) => {
    const best = Number(localStorage.getItem(`sudoku.best.${key}`) || "0");
    const row = document.createElement("div");
    row.innerHTML = `<span>${DIFFICULTY[key].label}</span><strong>${best ? formatTime(best) : "--:--"}</strong>`;
    recordsEl.appendChild(row);
  });
  streakEl.textContent = state.streak;
}

function updateDifficultyUi() {
  document.querySelectorAll(".difficulty").forEach((button) => {
    button.classList.toggle("active", button.dataset.difficulty === difficulty);
  });
  difficultyLabelEl.textContent = DIFFICULTY[difficulty].label;
  modeLabelEl.textContent = difficulty === "daily" ? new Date().toDateString() : "Classic run";
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    seconds += 1;
    score = Math.max(0, score - 1);
    renderStats();
  }, 1000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function formatTime(value) {
  const mins = Math.floor(value / 60).toString().padStart(2, "0");
  const secs = (value % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toastEl.classList.remove("show"), 2300);
}

function launchConfetti() {
  celebrationEl.innerHTML = "";
  const colors = ["#66e3c4", "#9c7bff", "#ffd166", "#ff6f91", "#7bdff2"];
  for (let i = 0; i < 110; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    celebrationEl.appendChild(piece);
  }
  setTimeout(() => (celebrationEl.innerHTML = ""), 3400);
}

function playSound(type) {
  if (!soundOn) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const tones = {
    tap: 360,
    note: 520,
    correct: 680,
    error: 140,
    hint: 820,
    start: 440,
    win: 980,
  };
  oscillator.frequency.value = tones[type] || 400;
  oscillator.type = type === "error" ? "sawtooth" : "sine";
  gain.gain.setValueAtTime(0.04, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.17);
}

function buildNumberPad() {
  numberPadEl.innerHTML = "";
  for (let value = 1; value <= 9; value++) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value;
    button.addEventListener("click", () => enterNumber(value));
    numberPadEl.appendChild(button);
  }
}

function bindEvents() {
  document.querySelectorAll(".difficulty").forEach((button) => {
    button.addEventListener("click", () => startGame(button.dataset.difficulty));
  });
  document.querySelector("#newGame").addEventListener("click", () => startGame(difficulty));
  document.querySelector("#checkGame").addEventListener("click", checkGame);
  document.querySelector("#hintGame").addEventListener("click", giveHint);
  document.querySelector("#undoGame").addEventListener("click", undoMove);
  document.querySelector("#resetGame").addEventListener("click", resetGame);
  document.querySelector("#solveGame").addEventListener("click", solveGame);
  document.querySelector("#eraseCell").addEventListener("click", eraseCell);
  document.querySelector("#noteToggle").addEventListener("click", toggleNotes);
  document.querySelector("#themeToggle").addEventListener("click", toggleTheme);
  document.querySelector("#soundToggle").addEventListener("click", toggleSound);
  document.addEventListener("keydown", handleKeys);
}

function toggleNotes() {
  noteMode = !noteMode;
  const button = document.querySelector("#noteToggle");
  button.classList.toggle("active", noteMode);
  button.setAttribute("aria-pressed", String(noteMode));
  showToast(noteMode ? "Pencil notes on." : "Pencil notes off.");
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("sudoku.theme", state.theme);
  applyTheme();
}

function applyTheme() {
  document.body.classList.toggle("light", state.theme === "light");
}

function toggleSound() {
  soundOn = !soundOn;
  localStorage.setItem("sudoku.sound", JSON.stringify(soundOn));
  updateSoundUi();
  if (soundOn) playSound("tap");
}

function updateSoundUi() {
  document.querySelector("#soundToggle").textContent = soundOn ? "S" : "M";
}

function handleKeys(event) {
  if (/^[1-9]$/.test(event.key)) enterNumber(Number(event.key));
  if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") eraseCell();
  if (event.key.toLowerCase() === "n") toggleNotes();
  if (event.key.toLowerCase() === "h") giveHint();
  if (event.key.toLowerCase() === "u") undoMove();
  if (event.key === "ArrowUp") selectCell(Math.max(0, selected.row - 1), selected.col);
  if (event.key === "ArrowDown") selectCell(Math.min(8, selected.row + 1), selected.col);
  if (event.key === "ArrowLeft") selectCell(selected.row, Math.max(0, selected.col - 1));
  if (event.key === "ArrowRight") selectCell(selected.row, Math.min(8, selected.col + 1));
}

buildNumberPad();
bindEvents();
applyTheme();
renderRecords();
updateSoundUi();
startGame("easy");
