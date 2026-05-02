(function () {
  "use strict";

  var GRID_SIZE = 5;
  var CELL_COUNT = GRID_SIZE * GRID_SIZE;
  var TOTAL_ROUNDS = 3;
  var LAUNCH_DATE = "2026-05-02";

  var ROW_SYMBOLS = [
    { label: "☾", name: "moon" },
    { label: "◆", name: "diamond" },
    { label: "♛", name: "crown" },
    { label: "☇", name: "lightning" },
    { label: "◉", name: "eye" }
  ];
  var ARROWS = [
    { label: "↑", name: "up arrow" },
    { label: "↗", name: "up-right arrow" },
    { label: "→", name: "right arrow" },
    { label: "↘", name: "down-right arrow" },
    { label: "↓", name: "down arrow" },
    { label: "↙", name: "down-left arrow" },
    { label: "←", name: "left arrow" },
    { label: "↖", name: "up-left arrow" }
  ];
  var MIRROR_PAIRS = [
    { left: "☾", right: "☀", leftName: "moon", rightName: "sun" },
    { left: "☠", right: "⚚", leftName: "skull", rightName: "bone mark" },
    { left: "♛", right: "♔", leftName: "dark crown", rightName: "light crown" },
    { left: "◆", right: "◇", leftName: "filled diamond", rightName: "open diamond" },
    { left: "◉", right: "◎", leftName: "watchful eye", rightName: "open eye" }
  ];

  var grid = document.getElementById("grid");
  var gameArea = document.getElementById("gameArea");
  var puzzleText = document.getElementById("puzzleText");
  var timerText = document.getElementById("timerText");
  var roundText = document.getElementById("roundText");
  var mistakeText = document.getElementById("mistakeText");
  var roundName = document.getElementById("roundName");
  var ruleText = document.getElementById("ruleText");
  var instructionText = document.getElementById("instructionText");
  var feedbackPanel = document.getElementById("feedbackPanel");
  var feedbackTitle = document.getElementById("feedbackTitle");
  var feedbackText = document.getElementById("feedbackText");
  var resultPanel = document.getElementById("resultPanel");
  var solvedText = document.getElementById("solvedText");
  var finalTimeText = document.getElementById("finalTimeText");
  var finalMistakeText = document.getElementById("finalMistakeText");
  var scoreText = document.getElementById("scoreText");
  var sharePreview = document.getElementById("sharePreview");
  var startButton = document.getElementById("startButton");
  var shareButton = document.getElementById("shareButton");
  var restartButton = document.getElementById("restartButton");

  var todayKey = getLocalDateKey(new Date());
  var puzzleNumber = getPuzzleNumber(todayKey);
  var puzzle = createDailyPuzzle(todayKey);
  var state = createFreshState();
  var timerId = null;
  var wrongFeedbackId = null;

  if (!validatePuzzle(puzzle)) {
    throw new Error("Generated daily puzzle is invalid.");
  }

  puzzleText.textContent = "Puzzle #" + padNumber(puzzleNumber, 3);
  startButton.addEventListener("click", handlePrimaryAction);
  restartButton.addEventListener("click", startGame);
  shareButton.addEventListener("click", shareResult);

  renderIdle();

  function createFreshState() {
    return {
      phase: "idle",
      roundIndex: 0,
      totalMistakes: 0,
      activeElapsedMs: 0,
      activeStartedAt: 0,
      rounds: puzzle.rounds.map(function () {
        return {
          solved: false,
          mistakes: 0
        };
      })
    };
  }

  function handlePrimaryAction() {
    if (state.phase === "idle" || state.phase === "complete") {
      startGame();
      return;
    }

    if (state.phase === "correct") {
      if (state.roundIndex + 1 >= TOTAL_ROUNDS) {
        completeGame();
      } else {
        startRound(state.roundIndex + 1);
      }
    }
  }

  function startGame() {
    clearTimers();
    state = createFreshState();
    resultPanel.hidden = true;
    shareButton.hidden = true;
    sharePreview.value = "";
    startRound(0);
  }

  function startRound(roundIndex) {
    var round = puzzle.rounds[roundIndex];

    state.phase = "active";
    state.roundIndex = roundIndex;
    state.activeStartedAt = performance.now();
    hideFeedback();
    updateHeader(round);
    updateButtons();
    updateGameAreaState("active");
    renderRound(round);
    startTimer();
  }

  function handleCellClick(event) {
    if (state.phase !== "active") {
      return;
    }

    var cell = event.currentTarget;
    var index = Number(cell.dataset.index);
    var round = puzzle.rounds[state.roundIndex];
    var roundState = state.rounds[state.roundIndex];

    if (index === round.answerIndex) {
      pauseActiveTimer();
      state.phase = "correct";
      roundState.solved = true;
      showFeedback("Correct", round.explanation, "success");
      updateButtons();
      updateGameAreaState("correct");
      renderRound(round, {
        correctIndex: round.answerIndex,
        relatedIndexes: round.relatedIndexes
      });
      return;
    }

    state.totalMistakes += 1;
    roundState.mistakes += 1;
    updateMistakes();
    showFeedback("Try again", round.hint, "warning");
    renderRound(round, { wrongIndex: index });

    if (wrongFeedbackId) {
      window.clearTimeout(wrongFeedbackId);
    }

    wrongFeedbackId = window.setTimeout(function () {
      if (state.phase === "active") {
        renderRound(round);
      }
    }, 650);
  }

  function completeGame() {
    var elapsedMs = getElapsedMs();
    var score = calculateScore(elapsedMs, state.totalMistakes);
    var round = puzzle.rounds[state.roundIndex];

    pauseActiveTimer();
    stopTimer();
    state.phase = "complete";
    updateGameAreaState("complete");
    updateHeaderForComplete();
    updateButtons();
    renderRound(round, {
      correctIndex: round.answerIndex,
      relatedIndexes: round.relatedIndexes
    });

    solvedText.textContent = "3 of 3";
    finalTimeText.textContent = formatSeconds(elapsedMs);
    finalMistakeText.textContent = String(state.totalMistakes);
    scoreText.textContent = String(score);
    sharePreview.value = buildShareText(elapsedMs);
    resultPanel.hidden = false;
  }

  function renderIdle() {
    updateGameAreaState("idle");
    roundText.textContent = "Ready";
    mistakeText.textContent = "Mistakes 0";
    roundName.textContent = "Logic-first daily puzzle";
    ruleText.textContent = "Infer the rule. Tap the symbol that breaks it.";
    instructionText.textContent = "Three boards, each with its own visual rule system. No memory tricks, no plain spot-the-difference.";
    timerText.textContent = "0.0s";
    hideFeedback();
    updateButtons();
    renderCells(makeIdleCells(), { disabled: true });
  }

  function makeIdleCells() {
    var cycle = ["☾", "◆", "♛", "☇", "◉"];

    return makeArray(null).map(function (_, index) {
      var row = Math.floor(index / GRID_SIZE);
      var column = index % GRID_SIZE;
      var label = cycle[(row + column) % cycle.length];

      return createTokenCell(label, getSymbolName(label), "logic");
    });
  }

  function renderRound(round, markers) {
    markers = markers || {};
    renderCells(round.cells, {
      disabled: state.phase !== "active",
      correctIndex: markers.correctIndex,
      wrongIndex: markers.wrongIndex,
      relatedIndexes: markers.relatedIndexes || [],
      round: round
    });
  }

  function renderCells(cells, options) {
    options = options || {};
    options.relatedIndexes = options.relatedIndexes || [];
    grid.innerHTML = "";
    grid.setAttribute("aria-disabled", options.disabled ? "true" : "false");

    cells.forEach(function (cellData, index) {
      var cell = document.createElement("button");
      var row = Math.floor(index / GRID_SIZE) + 1;
      var column = (index % GRID_SIZE) + 1;

      cell.type = "button";
      cell.className = getCellClassName(cellData, index, options);
      cell.dataset.index = String(index);
      cell.disabled = Boolean(options.disabled);
      cell.textContent = cellData.label || "";
      cell.setAttribute("aria-label", getCellAriaLabel(cellData, row, column));
      cell.addEventListener("click", handleCellClick);
      grid.appendChild(cell);
    });
  }

  function getCellClassName(cellData, index, options) {
    var classNames = ["cell", "tile--" + cellData.kind];

    if (cellData.zone) {
      classNames.push("zone--" + cellData.zone);
    }

    if (index === options.correctIndex) {
      classNames.push("is-correct");
    }

    if (index === options.wrongIndex) {
      classNames.push("is-wrong-tap");
    }

    if (options.relatedIndexes.indexOf(index) !== -1) {
      classNames.push("is-related");
    }

    return classNames.join(" ");
  }

  function getCellAriaLabel(cellData, row, column) {
    var location = "Row " + row + ", column " + column;

    if (cellData.kind === "spine") {
      return location + ", mirror divider";
    }

    return location + ", " + cellData.name + " symbol";
  }

  function updateHeader(round) {
    roundText.textContent = "Round " + (state.roundIndex + 1) + " of " + TOTAL_ROUNDS;
    roundName.textContent = round.title;
    ruleText.textContent = round.rule;
    instructionText.textContent = round.instruction;
    updateMistakes();
  }

  function updateHeaderForComplete() {
    roundText.textContent = "Complete";
    roundName.textContent = "Daily puzzle solved";
    ruleText.textContent = "Solved 3 of 3";
    instructionText.textContent = "Share your result or restart today's puzzle.";
    updateMistakes();
  }

  function updateMistakes() {
    mistakeText.textContent = "Mistakes " + state.totalMistakes;
  }

  function updateButtons() {
    startButton.hidden = true;
    shareButton.hidden = true;
    restartButton.hidden = true;

    if (state.phase === "idle") {
      startButton.hidden = false;
      startButton.textContent = "Start";
      return;
    }

    if (state.phase === "active") {
      restartButton.hidden = false;
      return;
    }

    if (state.phase === "correct") {
      startButton.hidden = false;
      startButton.textContent = state.roundIndex + 1 >= TOTAL_ROUNDS ? "See results" : "Next Round";
      restartButton.hidden = false;
      return;
    }

    if (state.phase === "complete") {
      shareButton.hidden = false;
      restartButton.hidden = false;
    }
  }

  function updateGameAreaState(phase) {
    gameArea.className = "board-card is-" + phase;
  }

  function showFeedback(title, text, tone) {
    feedbackPanel.hidden = false;
    feedbackPanel.className = "feedback-panel is-" + tone;
    feedbackTitle.textContent = title;
    feedbackText.textContent = text;
  }

  function hideFeedback() {
    feedbackPanel.hidden = true;
    feedbackPanel.className = "feedback-panel";
    feedbackTitle.textContent = "";
    feedbackText.textContent = "";
  }

  function startTimer() {
    if (!timerId) {
      timerId = window.setInterval(updateTimer, 100);
    }
    updateTimer();
  }

  function pauseActiveTimer() {
    if (state.activeStartedAt) {
      state.activeElapsedMs += performance.now() - state.activeStartedAt;
      state.activeStartedAt = 0;
      updateTimer();
    }
  }

  function getElapsedMs() {
    if (state.activeStartedAt) {
      return state.activeElapsedMs + (performance.now() - state.activeStartedAt);
    }

    return state.activeElapsedMs;
  }

  function updateTimer() {
    timerText.textContent = formatSeconds(getElapsedMs());
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function clearTimers() {
    if (wrongFeedbackId) {
      window.clearTimeout(wrongFeedbackId);
      wrongFeedbackId = null;
    }
    stopTimer();
  }

  function formatSeconds(milliseconds) {
    return (milliseconds / 1000).toFixed(1) + "s";
  }

  function calculateScore(milliseconds, mistakes) {
    var seconds = milliseconds / 1000;

    return Math.max(0, 1000 - Math.floor(seconds * 10) - mistakes * 50);
  }

  function shareResult() {
    var text = buildShareText(getElapsedMs());

    sharePreview.value = text;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        temporarilyLabelShareButton("Copied");
      }).catch(function () {
        showShareFallback(text);
      });
      return;
    }

    showShareFallback(text);
  }

  function showShareFallback(text) {
    sharePreview.focus();
    sharePreview.select();
    window.alert(text);
  }

  function temporarilyLabelShareButton(label) {
    var original = shareButton.textContent;

    shareButton.textContent = label;
    window.setTimeout(function () {
      shareButton.textContent = original;
    }, 1200);
  }

  function buildShareText(elapsedMs) {
    return [
      "One Wrong Move #" + padNumber(puzzleNumber, 3),
      "✅✅✅",
      formatSeconds(elapsedMs),
      "Mistakes: " + state.totalMistakes,
      "",
      "Round 1: Rule Rows",
      "Round 2: Rotation Logic",
      "Round 3: Mirror Trap"
    ].join("\n");
  }

  function createDailyPuzzle(dateKey) {
    var random = mulberry32(hashString(dateKey));
    var rounds = [
      createRuleRowsRound(random),
      createRotationLogicRound(random),
      createMirrorTrapRound(random)
    ];

    return {
      dateKey: dateKey,
      rounds: rounds
    };
  }

  function createRuleRowsRound(random) {
    var offset = randomIndex(random, ROW_SYMBOLS.length);
    var expected = [];
    var cells = [];
    var answerIndex = chooseInteriorIndex(random);
    var answerExpected = null;
    var replacement = null;

    for (var row = 0; row < GRID_SIZE; row += 1) {
      for (var column = 0; column < GRID_SIZE; column += 1) {
        var symbol = ROW_SYMBOLS[(offset + row + column) % ROW_SYMBOLS.length];
        expected.push(symbol.label);
        cells.push(createTokenCell(symbol.label, symbol.name, "logic"));
      }
    }

    answerExpected = expected[answerIndex];
    replacement = chooseDifferentSymbol(random, ROW_SYMBOLS, answerExpected);
    cells[answerIndex] = createTokenCell(replacement.label, replacement.name, "logic");

    return {
      id: "rule-rows",
      title: "Round 1: Rule Rows",
      rule: "Each row uses the same five-symbol recipe, shifted one place. One glyph breaks the row grammar.",
      instruction: "Compare rows as sequences, not as pictures. Tap the symbol that does not belong in its row.",
      hint: "The row should be a shifted version of the others. Look for the broken recipe, not the rarest symbol.",
      explanation: "That glyph breaks the shifted row sequence.",
      answerIndex: answerIndex,
      expected: expected,
      cells: cells
    };
  }

  function createRotationLogicRound(random) {
    var offset = randomIndex(random, ARROWS.length);
    var expected = [];
    var cells = [];
    var answerIndex = chooseInteriorIndex(random);
    var expectedLabel = null;
    var replacement = null;

    for (var row = 0; row < GRID_SIZE; row += 1) {
      for (var column = 0; column < GRID_SIZE; column += 1) {
        var arrow = ARROWS[(offset + row + column * 2) % ARROWS.length];
        expected.push(arrow.label);
        cells.push(createTokenCell(arrow.label, arrow.name, "arrow"));
      }
    }

    expectedLabel = expected[answerIndex];
    replacement = chooseDifferentSymbol(random, ARROWS, expectedLabel);
    cells[answerIndex] = createTokenCell(replacement.label, replacement.name, "arrow");

    return {
      id: "rotation-logic",
      title: "Round 2: Rotation Logic",
      rule: "Across each row, arrows rotate a quarter-turn clockwise. Each new row starts one tick later.",
      instruction: "Read the grid like a mechanical pattern. Tap the arrow that missed its turn.",
      hint: "Move left to right: each arrow should turn 90 degrees clockwise. Rows also drift one arrow forward.",
      explanation: "That arrow breaks the rotation sequence.",
      answerIndex: answerIndex,
      expected: expected,
      cells: cells
    };
  }

  function createMirrorTrapRound(random) {
    var cells = makeArray(null);
    var expected = makeArray(null);
    var leftSequence = shuffleMirrorSource(random);
    var answerChoices = [];
    var answerIndex = null;
    var wrongPair = null;

    for (var row = 0; row < GRID_SIZE; row += 1) {
      cells[positionToIndex(row, 2)] = {
        kind: "spine",
        label: "↔",
        name: "mirror divider",
        expectedLabel: "↔",
        zone: "spine"
      };
      expected[positionToIndex(row, 2)] = "↔";

      for (var leftColumn = 0; leftColumn < 2; leftColumn += 1) {
        var sourcePair = leftSequence[row * 2 + leftColumn];
        var leftIndex = positionToIndex(row, leftColumn);
        var rightIndex = positionToIndex(row, GRID_SIZE - 1 - leftColumn);

        cells[leftIndex] = createTokenCell(sourcePair.left, sourcePair.leftName, "mirror-left");
        cells[leftIndex].zone = "source";
        cells[rightIndex] = createTokenCell(sourcePair.right, sourcePair.rightName, "mirror-right");
        cells[rightIndex].zone = "copy";
        expected[leftIndex] = sourcePair.left;
        expected[rightIndex] = sourcePair.right;
        answerChoices.push({ index: rightIndex, pair: sourcePair });
      }
    }

    answerChoices = answerChoices.filter(function (choice) {
      return countLeftOccurrences(leftSequence, choice.pair.left) > 1;
    });
    wrongPair = answerChoices[randomIndex(random, answerChoices.length)];
    answerIndex = wrongPair.index;
    cells[answerIndex] = createTokenCell(chooseWrongMirrorLabel(random, wrongPair.pair.right), "wrong partner", "mirror-right");
    cells[answerIndex].zone = "copy";

    return {
      id: "mirror-trap",
      title: "Round 3: Mirror Trap",
      rule: "The right half mirrors the left, but every symbol changes into its paired counterpart.",
      instruction: "Infer the symbol pairs from repeats, then tap the right-side symbol with the wrong partner.",
      hint: "Only the mirrored side can be wrong. Find a source symbol whose partner is used consistently elsewhere.",
      explanation: "That mirrored symbol uses the wrong counterpart.",
      answerIndex: answerIndex,
      relatedIndexes: [findSourceIndexForMirror(answerIndex)],
      expected: expected,
      cells: cells
    };
  }

  function createTokenCell(label, name, kind) {
    return {
      kind: kind,
      label: label,
      name: name,
      expectedLabel: label
    };
  }

  function chooseInteriorIndex(random) {
    var candidates = [];

    for (var row = 1; row < GRID_SIZE - 1; row += 1) {
      for (var column = 1; column < GRID_SIZE - 1; column += 1) {
        candidates.push(positionToIndex(row, column));
      }
    }

    return candidates[randomIndex(random, candidates.length)];
  }

  function chooseDifferentSymbol(random, symbols, expectedLabel) {
    var choices = symbols.filter(function (symbol) {
      return symbol.label !== expectedLabel;
    });

    return choices[randomIndex(random, choices.length)];
  }

  function shuffleMirrorSource(random) {
    var source = MIRROR_PAIRS.concat(MIRROR_PAIRS);

    for (var index = source.length - 1; index > 0; index -= 1) {
      var swapIndex = randomIndex(random, index + 1);
      var temp = source[index];
      source[index] = source[swapIndex];
      source[swapIndex] = temp;
    }

    return source;
  }

  function countLeftOccurrences(sequence, leftLabel) {
    return sequence.filter(function (pair) {
      return pair.left === leftLabel;
    }).length;
  }

  function chooseWrongMirrorLabel(random, expectedLabel) {
    var choices = MIRROR_PAIRS.map(function (pair) {
      return pair.right;
    }).filter(function (label) {
      return label !== expectedLabel;
    });

    return choices[randomIndex(random, choices.length)];
  }

  function findSourceIndexForMirror(index) {
    var row = Math.floor(index / GRID_SIZE);
    var column = index % GRID_SIZE;

    return positionToIndex(row, GRID_SIZE - 1 - column);
  }

  function validatePuzzle(dailyPuzzle) {
    return validateExpectedMismatch(dailyPuzzle.rounds[0]) &&
      validateExpectedMismatch(dailyPuzzle.rounds[1]) &&
      validateMirrorTrap(dailyPuzzle.rounds[2]);
  }

  function validateExpectedMismatch(round) {
    var mismatches = getMismatches(round);

    return mismatches.length === 1 && mismatches[0] === round.answerIndex;
  }

  function validateMirrorTrap(round) {
    var mismatches = getMismatches(round);

    return mismatches.length === 1 &&
      mismatches[0] === round.answerIndex &&
      round.answerIndex % GRID_SIZE > 2;
  }

  function getMismatches(round) {
    var mismatches = [];

    round.cells.forEach(function (cell, index) {
      if (cell.label !== round.expected[index]) {
        mismatches.push(index);
      }
    });

    return mismatches;
  }

  function makeArray(value) {
    return Array.from({ length: CELL_COUNT }, function () {
      return value;
    });
  }

  function getSymbolName(label) {
    var allSymbols = ROW_SYMBOLS.concat(ARROWS);
    var match = allSymbols.filter(function (symbol) {
      return symbol.label === label;
    })[0];

    return match ? match.name : "symbol";
  }

  function positionToIndex(row, column) {
    return row * GRID_SIZE + column;
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
        answerIndex: puzzle.rounds[state.roundIndex] ? puzzle.rounds[state.roundIndex].answerIndex : null,
        totalMistakes: state.totalMistakes,
        elapsedMs: getElapsedMs(),
        validation: {
          ruleRows: validateExpectedMismatch(puzzle.rounds[0]),
          rotationLogic: validateExpectedMismatch(puzzle.rounds[1]),
          mirrorTrap: validateMirrorTrap(puzzle.rounds[2])
        },
        roundIds: puzzle.rounds.map(function (round) {
          return round.id;
        }),
        rounds: state.rounds.map(function (roundState) {
          return {
            solved: roundState.solved,
            mistakes: roundState.mistakes
          };
        })
      };
    },
    start: startGame
  };
}());
