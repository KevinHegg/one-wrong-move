(function () {
  "use strict";

  var GRID_SIZE = 5;
  var CELL_COUNT = GRID_SIZE * GRID_SIZE;
  var TOTAL_ROUNDS = 3;
  var PREVIEW_MS = 2000;
  var LAUNCH_DATE = "2026-05-02";

  var grid = document.getElementById("grid");
  var gameArea = document.getElementById("gameArea");
  var roundText = document.getElementById("roundText");
  var statusText = document.getElementById("statusText");
  var timerText = document.getElementById("timerText");
  var puzzleText = document.getElementById("puzzleText");
  var startButton = document.getElementById("startButton");
  var shareButton = document.getElementById("shareButton");
  var resultPanel = document.getElementById("resultPanel");
  var resultText = document.getElementById("resultText");
  var sharePreview = document.getElementById("sharePreview");

  // The local YYYY-MM-DD string is the only input to the daily puzzle seed.
  var todayKey = getLocalDateKey(new Date());
  var puzzleNumber = getPuzzleNumber(todayKey);
  var puzzle = createDailyPuzzle(todayKey);
  var state = createFreshState();
  var timerId = null;
  var previewId = null;
  var feedbackId = null;

  puzzleText.textContent = "Puzzle #" + padNumber(puzzleNumber, 3);
  buildGrid();
  renderIdleBoard();

  startButton.addEventListener("click", startGame);
  shareButton.addEventListener("click", shareResult);

  function createFreshState() {
    return {
      phase: "idle",
      roundIndex: 0,
      totalMistakes: 0,
      startedAt: 0,
      endedAt: 0,
      elapsedMs: 0,
      rounds: puzzle.rounds.map(function () {
        return {
          solved: false,
          mistakes: 0,
          timeMs: 0
        };
      })
    };
  }

  function buildGrid() {
    grid.innerHTML = "";

    for (var index = 0; index < CELL_COUNT; index += 1) {
      var cell = document.createElement("button");
      var row = Math.floor(index / GRID_SIZE) + 1;
      var column = (index % GRID_SIZE) + 1;

      cell.type = "button";
      cell.className = "cell cell--paper";
      cell.dataset.index = String(index);
      cell.setAttribute("aria-label", "Row " + row + ", column " + column);
      cell.addEventListener("click", handleCellClick);
      grid.appendChild(cell);
    }
  }

  function startGame() {
    clearTimers();
    state = createFreshState();
    state.phase = "preview";
    state.startedAt = performance.now();
    startButton.textContent = "Restart";
    shareButton.hidden = true;
    resultPanel.hidden = true;
    sharePreview.textContent = "";
    startTimer();
    startRound(0);
  }

  function startRound(roundIndex) {
    state.roundIndex = roundIndex;
    state.phase = "preview";
    updateGameAreaState("preview");
    updateRoundText();
    statusText.textContent = getRoundName(roundIndex) + ": memorize the perfect pattern.";
    grid.setAttribute("aria-disabled", "true");
    renderCells(puzzle.rounds[roundIndex].preview);

    // After the memory window, swap in the altered board and allow taps.
    previewId = window.setTimeout(function () {
      state.phase = "active";
      updateGameAreaState("active");
      statusText.textContent = "One cell changed. Tap the wrong move.";
      grid.setAttribute("aria-disabled", "false");
      renderCells(puzzle.rounds[roundIndex].active);
    }, PREVIEW_MS);
  }

  function handleCellClick(event) {
    if (state.phase !== "active") {
      return;
    }

    var cell = event.currentTarget;
    var index = Number(cell.dataset.index);
    var round = puzzle.rounds[state.roundIndex];
    var result = state.rounds[state.roundIndex];

    // Correct taps lock the board briefly before the next round begins.
    if (index === round.wrongIndex) {
      state.phase = "locked";
      result.solved = true;
      result.timeMs = performance.now() - state.startedAt;
      cell.classList.add("is-correct");
      statusText.textContent = "Correct. Hold that picture for the next one.";
      grid.setAttribute("aria-disabled", "true");

      feedbackId = window.setTimeout(function () {
        if (state.roundIndex + 1 >= TOTAL_ROUNDS) {
          completeGame();
        } else {
          startRound(state.roundIndex + 1);
        }
      }, 700);

      return;
    }

    state.totalMistakes += 1;
    result.mistakes += 1;
    cell.classList.add("is-incorrect");
    statusText.textContent = "Not that cell. Keep looking.";

    window.setTimeout(function () {
      cell.classList.remove("is-incorrect");
    }, 450);
  }

  function completeGame() {
    state.phase = "complete";
    state.endedAt = performance.now();
    state.elapsedMs = state.endedAt - state.startedAt;
    stopTimer();
    updateGameAreaState("complete");
    grid.setAttribute("aria-disabled", "true");
    roundText.textContent = "Complete";
    statusText.textContent = "Game complete. Come back tomorrow for a new pattern.";

    var seconds = formatSeconds(state.elapsedMs);
    var score = calculateScore(state.elapsedMs, state.totalMistakes);
    resultText.textContent = "Solved 3 of 3 in " + seconds + " with " + state.totalMistakes + " mistakes. Score: " + score + ".";
    sharePreview.textContent = buildShareText();
    resultPanel.hidden = false;
    shareButton.hidden = false;
  }

  function renderIdleBoard() {
    updateGameAreaState("idle");
    renderCells(makeIdlePattern());
    grid.setAttribute("aria-disabled", "true");
    roundText.textContent = "Round 1 of 3";
    statusText.textContent = "Press start to see today's pattern.";
    timerText.textContent = "0.0s";
  }

  function renderCells(values) {
    var cells = grid.querySelectorAll(".cell");

    values.forEach(function (value, index) {
      var cell = cells[index];
      var parsed = parseCellValue(value);

      cell.className = "cell cell--" + parsed.kind;
      cell.textContent = parsed.label;
      cell.disabled = state.phase !== "active";
    });
  }

  function parseCellValue(value) {
    var pieces = value.split(":");

    return {
      kind: pieces[0],
      label: pieces[1] || ""
    };
  }

  function updateGameAreaState(phase) {
    gameArea.className = "game-area is-" + phase;
  }

  function updateRoundText() {
    roundText.textContent = "Round " + (state.roundIndex + 1) + " of " + TOTAL_ROUNDS;
  }

  function startTimer() {
    stopTimer();
    updateTimer();
    timerId = window.setInterval(updateTimer, 100);
  }

  function updateTimer() {
    if (!state.startedAt) {
      timerText.textContent = "0.0s";
      return;
    }

    var end = state.endedAt || performance.now();
    state.elapsedMs = end - state.startedAt;
    timerText.textContent = formatSeconds(state.elapsedMs);
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function clearTimers() {
    if (previewId) {
      window.clearTimeout(previewId);
      previewId = null;
    }

    if (feedbackId) {
      window.clearTimeout(feedbackId);
      feedbackId = null;
    }

    stopTimer();
  }

  function formatSeconds(milliseconds) {
    return (milliseconds / 1000).toFixed(1) + "s";
  }

  function calculateScore(milliseconds, mistakes) {
    var speedPenalty = Math.round(milliseconds / 100);
    var mistakePenalty = mistakes * 75;

    return Math.max(0, 1000 - speedPenalty - mistakePenalty);
  }

  function shareResult() {
    var text = buildShareText();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        var originalText = shareButton.textContent;

        shareButton.textContent = "Copied";
        window.setTimeout(function () {
          shareButton.textContent = originalText;
        }, 1200);
      }).catch(function () {
        window.alert(text);
      });

      return;
    }

    window.alert(text);
  }

  function buildShareText() {
    var rows = state.rounds.map(function (round) {
      return round.mistakes > 0 ? "🟩🟥🟩" : "🟩🟩🟩";
    });

    return [
      "One Wrong Move #" + padNumber(puzzleNumber, 3),
      countSolvedRounds() + "/" + TOTAL_ROUNDS,
      formatSeconds(state.elapsedMs),
      "Mistakes: " + state.totalMistakes,
      "",
      rows.join("\n")
    ].join("\n");
  }

  function countSolvedRounds() {
    return state.rounds.filter(function (round) {
      return round.solved;
    }).length;
  }

  function getRoundName(index) {
    return ["Checker", "Symmetry", "Path"][index];
  }

  function createDailyPuzzle(dateKey) {
    // A seeded random function keeps the same date identical for every player.
    var random = mulberry32(hashString(dateKey));

    return {
      dateKey: dateKey,
      rounds: [
        createCheckerRound(random),
        createSymmetryRound(random),
        createPathRound(random)
      ]
    };
  }

  function createCheckerRound(random) {
    var offset = randomInt(random, 0, 1);
    var preview = makeArray("paper");

    for (var index = 0; index < CELL_COUNT; index += 1) {
      var row = Math.floor(index / GRID_SIZE);
      var column = index % GRID_SIZE;
      preview[index] = (row + column + offset) % 2 === 0 ? "paper" : "ink";
    }

    return makeRound(preview, randomIndex(random, CELL_COUNT), ["paper", "ink"], "checker");
  }

  function createSymmetryRound(random) {
    var palette = ["paper", "ink", "sage"];
    var preview = makeArray("paper");

    for (var row = 0; row < GRID_SIZE; row += 1) {
      for (var column = 0; column <= 2; column += 1) {
        var value = palette[randomIndex(random, palette.length)];
        var left = row * GRID_SIZE + column;
        var right = row * GRID_SIZE + (GRID_SIZE - 1 - column);

        preview[left] = value;
        preview[right] = value;
      }
    }

    var candidateIndexes = [];
    for (var index = 0; index < CELL_COUNT; index += 1) {
      if (index % GRID_SIZE !== 2) {
        candidateIndexes.push(index);
      }
    }

    return makeRound(preview, candidateIndexes[randomIndex(random, candidateIndexes.length)], palette, "symmetry");
  }

  function createPathRound(random) {
    // Fixed path templates keep the sequence valid while the seed picks the route.
    var templates = [
      [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [3, 4], [4, 4]],
      [[4, 0], [3, 0], [2, 0], [2, 1], [1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 4]],
      [[0, 4], [1, 4], [1, 3], [2, 3], [2, 2], [3, 2], [3, 1], [4, 1], [4, 0]],
      [[0, 1], [1, 1], [1, 0], [2, 0], [2, 1], [2, 2], [3, 2], [3, 3], [4, 3], [4, 4]]
    ];
    var path = templates[randomIndex(random, templates.length)];
    var preview = makeArray("paper");

    path.forEach(function (position, index) {
      preview[positionToIndex(position)] = "path:" + (index + 1);
    });

    var wrongStep = randomInt(random, 1, path.length - 2);
    var wrongIndex = positionToIndex(path[wrongStep]);
    var active = preview.slice();
    active[wrongIndex] = "paper";

    return {
      type: "path",
      preview: preview,
      active: active,
      wrongIndex: wrongIndex
    };
  }

  function makeRound(preview, wrongIndex, palette, type) {
    var active = preview.slice();
    var choices = palette.filter(function (value) {
      return value !== preview[wrongIndex];
    });

    active[wrongIndex] = choices[wrongIndex % choices.length];

    return {
      type: type,
      preview: preview,
      active: active,
      wrongIndex: wrongIndex
    };
  }

  function makeIdlePattern() {
    var values = makeArray("paper");

    for (var index = 0; index < CELL_COUNT; index += 1) {
      if (index % 2 === 0) {
        values[index] = "sage";
      }
    }

    return values;
  }

  function makeArray(value) {
    return Array.from({ length: CELL_COUNT }, function () {
      return value;
    });
  }

  function positionToIndex(position) {
    return position[0] * GRID_SIZE + position[1];
  }

  function getLocalDateKey(date) {
    var year = date.getFullYear();
    var month = padNumber(date.getMonth() + 1, 2);
    var day = padNumber(date.getDate(), 2);

    return year + "-" + month + "-" + day;
  }

  function getPuzzleNumber(dateKey) {
    var start = dateKeyToUtc(LAUNCH_DATE);
    var current = dateKeyToUtc(dateKey);
    var dayMs = 24 * 60 * 60 * 1000;

    return Math.max(1, Math.floor((current - start) / dayMs) + 1);
  }

  function dateKeyToUtc(dateKey) {
    var parts = dateKey.split("-").map(Number);

    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }

  function padNumber(number, length) {
    return String(number).padStart(length, "0");
  }

  function randomIndex(random, length) {
    return Math.floor(random() * length);
  }

  function randomInt(random, min, max) {
    return min + Math.floor(random() * (max - min + 1));
  }

  function hashString(value) {
    var hash = 2166136261;

    for (var index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  window.OneWrongMove = {
    getSnapshot: function () {
      return {
        dateKey: todayKey,
        puzzleNumber: puzzleNumber,
        phase: state.phase,
        roundIndex: state.roundIndex,
        wrongIndex: puzzle.rounds[state.roundIndex] ? puzzle.rounds[state.roundIndex].wrongIndex : null,
        totalMistakes: state.totalMistakes,
        elapsedMs: state.elapsedMs,
        rounds: state.rounds.map(function (round) {
          return {
            solved: round.solved,
            mistakes: round.mistakes,
            timeMs: round.timeMs
          };
        })
      };
    },
    start: startGame
  };
}());
