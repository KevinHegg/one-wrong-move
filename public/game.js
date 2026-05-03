(function () {
  "use strict";

  var Puzzles = window.OneWrongMovePuzzles;
  var Scoring = window.OneWrongMoveScoring;
  var TOTAL_ROUNDS = 3;
  var ANSWER_MODES = {
    IDENTIFY_ONE: (Puzzles.ANSWER_MODES && Puzzles.ANSWER_MODES.identifyOne) || "identifyOne",
    CHOOSE_ONE: (Puzzles.ANSWER_MODES && Puzzles.ANSWER_MODES.chooseOne) || "chooseOne",
    MULTI_SELECT: (Puzzles.ANSWER_MODES && Puzzles.ANSWER_MODES.multiSelect) || "multiSelect"
  };

  var grid = document.getElementById("grid");
  var gameArea = document.getElementById("gameArea");
  var boardPlaceholder = document.getElementById("boardPlaceholder");
  var placeholderText = document.getElementById("placeholderText");
  var puzzleText = document.getElementById("puzzleText");
  var variantText = document.getElementById("variantText");
  var timerText = document.getElementById("timerText");
  var roundText = document.getElementById("roundText");
  var mistakeText = document.getElementById("mistakeText");
  var roundName = document.getElementById("roundName");
  var ruleText = document.getElementById("ruleText");
  var instructionText = document.getElementById("instructionText");
  var briefingDetails = document.getElementById("briefingDetails");
  var symbolText = document.getElementById("symbolText");
  var exampleBoard = document.getElementById("exampleBoard");
  var exampleCaption = document.getElementById("exampleCaption");
  var feedbackPanel = document.getElementById("feedbackPanel");
  var feedbackTitle = document.getElementById("feedbackTitle");
  var feedbackText = document.getElementById("feedbackText");
  var resultPanel = document.getElementById("resultPanel");
  var solvedText = document.getElementById("solvedText");
  var finalTimeText = document.getElementById("finalTimeText");
  var baseScoreText = document.getElementById("baseScoreText");
  var finalMistakeText = document.getElementById("finalMistakeText");
  var penaltyText = document.getElementById("penaltyText");
  var scoreFormulaText = document.getElementById("scoreFormulaText");
  var scoreText = document.getElementById("scoreText");
  var sharePreview = document.getElementById("sharePreview");
  var startButton = document.getElementById("startButton");
  var submitButton = document.getElementById("submitButton");
  var clearSelectionButton = document.getElementById("clearSelectionButton");
  var shareButton = document.getElementById("shareButton");
  var playMixButton = document.getElementById("playMixButton");
  var restartButton = document.getElementById("restartButton");

  var todayKey = Puzzles.getLocalDateKey(new Date());
  var puzzleNumber = Puzzles.getPuzzleNumber(todayKey);
  var attemptKey = "owm:" + todayKey + ":sessionAttempt";
  var signatureKey = "owm:" + todayKey + ":breakSignatures";
  var sessionAttempt = getStoredAttempt();
  var usedBreakSignatures = getStoredSignatures();
  var puzzle = createPuzzleForAttempt(sessionAttempt);
  var signaturesRemembered = false;
  var timerId = null;
  var wrongFeedbackId = null;
  var state = createFreshState("intro");

  puzzleText.textContent = "Puzzle #" + padNumber(puzzleNumber, 3);
  startButton.addEventListener("click", handlePrimaryAction);
  submitButton.addEventListener("click", handleSelectionSubmit);
  clearSelectionButton.addEventListener("click", clearSelection);
  restartButton.addEventListener("click", startVariantMix);
  playMixButton.addEventListener("click", startVariantMix);
  shareButton.addEventListener("click", shareResult);

  renderIntro();

  function createFreshState(phase) {
    return {
      phase: phase,
      roundIndex: 0,
      totalMistakes: 0,
      activeElapsedMs: 0,
      activeStartedAt: 0,
      rounds: puzzle.rounds.map(function () {
        return {
          solved: false,
          mistakes: 0,
          selectedIndices: [],
          wrongIndices: []
        };
      })
    };
  }

  function handlePrimaryAction() {
    if (state.phase === "intro") {
      rememberCurrentBreakSignatures();
      enterBriefing(0);
      return;
    }

    if (state.phase === "briefing") {
      startActiveRound();
      return;
    }

    if (state.phase === "feedback") {
      if (state.roundIndex + 1 >= TOTAL_ROUNDS) {
        completeGame();
      } else {
        enterBriefing(state.roundIndex + 1);
      }
    }
  }

  function startVariantMix() {
    pauseTimer();
    clearTimers();
    sessionAttempt += 1;
    window.sessionStorage.setItem(attemptKey, String(sessionAttempt));
    usedBreakSignatures = getStoredSignatures();
    puzzle = createPuzzleForAttempt(sessionAttempt);
    signaturesRemembered = false;
    state = createFreshState("intro");
    renderIntro();
  }

  function createPuzzleForAttempt(attempt) {
    var avoid = attempt > 1 ? usedBreakSignatures : [];

    return Puzzles.generateDailyPuzzle(todayKey, attempt, avoid);
  }

  function rememberCurrentBreakSignatures() {
    if (signaturesRemembered) {
      return;
    }

    usedBreakSignatures = getStoredSignatures();
    puzzle.rounds.forEach(function (round) {
      if (usedBreakSignatures.indexOf(round.breakSignature) === -1) {
        usedBreakSignatures.push(round.breakSignature);
      }
    });
    window.sessionStorage.setItem(signatureKey, JSON.stringify(usedBreakSignatures));
    signaturesRemembered = true;
  }

  function renderIntro() {
    stopTimer();
    state.phase = "intro";
    state.roundIndex = 0;
    resultPanel.hidden = true;
    hideFeedback();
    hideBriefingDetails();
    hideBoard("The board stays hidden until you open a round briefing.");
    updateVariantLabel();
    roundText.textContent = "Ready";
    mistakeText.textContent = "Mistakes " + state.totalMistakes;
    timerText.textContent = formatSeconds(state.activeElapsedMs);
    roundName.textContent = sessionAttempt > 1 ? "Replay variant ready" : "Daily puzzle ready";
    ruleText.textContent = "One board. One rule. One move — or one precise set of moves.";
    instructionText.textContent = "Score = rounded-up solving time + 10s per mistake. Lower is better.";
    updateButtons();
  }

  function enterBriefing(roundIndex) {
    var round = puzzle.rounds[roundIndex];

    pauseTimer();
    state.phase = "briefing";
    state.roundIndex = roundIndex;
    state.rounds[roundIndex].selectedIndices = [];
    state.rounds[roundIndex].wrongIndices = [];
    hideFeedback();
    hideBoard("Round " + (roundIndex + 1) + " is hidden until you press Start Round.");
    resultPanel.hidden = true;
    updateHeader(round);
    renderBriefing(round);
    updateButtons();
  }

  function startActiveRound() {
    var round = puzzle.rounds[state.roundIndex];
    var roundState = state.rounds[state.roundIndex];

    roundState.selectedIndices = [];
    roundState.wrongIndices = [];
    state.phase = "active";
    hideFeedback();
    hideBriefingDetails();
    showBoard();
    updateHeader(round);
    renderRound(round);
    startTimer();
    updateButtons();
  }

  function handleCellClick(event) {
    if (state.phase !== "active") {
      return;
    }

    var index = Number(event.currentTarget.dataset.index);
    var round = puzzle.rounds[state.roundIndex];

    if (round.answerMode === ANSWER_MODES.MULTI_SELECT) {
      toggleMultiSelectCell(index, round);
      return;
    }

    handleSingleAnswerTap(index, round);
  }

  function handleSingleAnswerTap(index, round) {
    var roundState = state.rounds[state.roundIndex];
    var answerIndices = getAnswerIndices(round);

    if (answerIndices.indexOf(index) !== -1) {
      pauseTimer();
      state.phase = "feedback";
      roundState.solved = true;
      roundState.selectedIndices = [];
      roundState.wrongIndices = [];
      showFeedback("Correct", round.explanation, "success");
      renderRound(round, {
        correctIndices: answerIndices,
        relatedIndexes: round.relatedIndexes || []
      });
      updateButtons();
      return;
    }

    markMistake(round, [index], round.wrongTapHint || round.hint);
  }

  function toggleMultiSelectCell(index, round) {
    var roundState = state.rounds[state.roundIndex];
    var cell = round.cells[index] || round.board[index];

    if (!cell || cell.selectable === false || cell.interactive === false) {
      showFeedback("Not selectable", round.wrongTapHint || "Select only legal move squares, then submit.", "warning");
      return;
    }

    roundState.wrongIndices = [];

    if (roundState.selectedIndices.indexOf(index) === -1) {
      if (!round.maxSelections || roundState.selectedIndices.length < round.maxSelections) {
        roundState.selectedIndices.push(index);
      }
    } else {
      roundState.selectedIndices = roundState.selectedIndices.filter(function (item) {
        return item !== index;
      });
    }

    roundState.selectedIndices.sort(function (a, b) {
      return a - b;
    });
    hideFeedback();
    renderRound(round);
    updateButtons();
  }

  function handleSelectionSubmit() {
    if (state.phase !== "active") {
      return;
    }

    var round = puzzle.rounds[state.roundIndex];
    var roundState = state.rounds[state.roundIndex];
    var answerIndices = getAnswerIndices(round);
    var selected = roundState.selectedIndices.slice().sort(sortNumbers);
    var minSelections = round.minSelections || answerIndices.length;

    if (round.answerMode !== ANSWER_MODES.MULTI_SELECT) {
      return;
    }

    if (selected.length < minSelections) {
      showFeedback("Keep looking", "Select every required square before submitting.", "warning");
      return;
    }

    if (sameSet(selected, answerIndices)) {
      pauseTimer();
      state.phase = "feedback";
      roundState.solved = true;
      roundState.wrongIndices = [];
      showFeedback("Correct", round.explanation, "success");
      renderRound(round, {
        correctIndices: answerIndices,
        relatedIndexes: round.relatedIndexes || []
      });
      updateButtons();
      return;
    }

    markMistake(round, selected, round.wrongTapHint || "The selected set does not exactly match the rule.");
  }

  function clearSelection() {
    if (state.phase !== "active") {
      return;
    }

    var round = puzzle.rounds[state.roundIndex];
    var roundState = state.rounds[state.roundIndex];

    roundState.selectedIndices = [];
    roundState.wrongIndices = [];
    hideFeedback();
    renderRound(round);
    updateButtons();
  }

  function markMistake(round, indexes, hint) {
    var roundState = state.rounds[state.roundIndex];

    state.totalMistakes += 1;
    roundState.mistakes += 1;
    roundState.wrongIndices = indexes.slice();
    updateMistakes();
    showFeedback("Try again", hint || "That move does not break the rule.", "warning");
    renderRound(round);

    if (wrongFeedbackId) {
      window.clearTimeout(wrongFeedbackId);
    }

    wrongFeedbackId = window.setTimeout(function () {
      if (state.phase === "active") {
        roundState.wrongIndices = [];
        renderRound(round);
      }
    }, 850);
  }

  function completeGame() {
    var elapsedMs = getElapsedMs();
    var score = Scoring.calculateScore(elapsedMs, state.totalMistakes);

    pauseTimer();
    stopTimer();
    state.phase = "complete";
    hideBoard("");
    hideBriefingDetails();
    hideFeedback();
    roundText.textContent = "Complete";
    roundName.textContent = "Daily puzzle solved";
    ruleText.textContent = "Solved 3 of 3";
    instructionText.textContent = "Score = rounded-up solving time + 10s per mistake. Lower is better.";
    solvedText.textContent = "3 of 3";
    finalTimeText.textContent = formatSeconds(elapsedMs);
    baseScoreText.textContent = formatWholeSeconds(score.baseSeconds);
    finalMistakeText.textContent = String(state.totalMistakes);
    penaltyText.textContent = state.totalMistakes + " × " + score.penaltySecondsPerMistake + "s = +" + formatWholeSeconds(score.mistakePenaltySeconds);
    scoreFormulaText.textContent = formatWholeSeconds(score.baseSeconds) + " + " + formatWholeSeconds(score.mistakePenaltySeconds) + " = " + formatWholeSeconds(score.scoreSeconds);
    scoreText.textContent = formatWholeSeconds(score.scoreSeconds);
    sharePreview.value = buildShareText(score);
    resultPanel.hidden = false;
    updateButtons();
  }

  function renderBriefing(round) {
    briefingDetails.hidden = false;
    renderSymbolChips(round.symbolBank || round.symbols || []);
    exampleCaption.textContent = round.exampleData.caption;
    exampleBoard.innerHTML = "";
    exampleBoard.style.gridTemplateColumns = "repeat(" + round.exampleData.columns + ", minmax(0, 1fr))";

    round.exampleData.cells.forEach(renderExampleCell);
  }

  function renderSymbolChips(symbols) {
    symbolText.innerHTML = "";
    symbols.forEach(function (symbol) {
      var chip = document.createElement("span");

      chip.className = "symbol-chip";
      chip.textContent = typeof symbol === "string" ? symbol : symbol.glyph || symbol.label || "";
      symbolText.appendChild(chip);
    });
  }

  function renderExampleCell(label) {
    var cell = document.createElement("span");

    cell.className = "example-cell";
    cell.textContent = typeof label === "string" ? label : label.glyph || label.label || "";
    exampleBoard.appendChild(cell);
  }

  function renderRound(round, markers) {
    var roundState = state.rounds[state.roundIndex];

    markers = markers || {};
    renderCells(round.cells, {
      disabled: state.phase !== "active",
      answerMode: round.answerMode,
      correctIndices: markers.correctIndices || [],
      wrongIndices: markers.wrongIndices || roundState.wrongIndices || [],
      selectedIndices: state.phase === "feedback" ? [] : roundState.selectedIndices || [],
      relatedIndexes: markers.relatedIndexes || []
    });
  }

  function renderCells(cells, options) {
    options.relatedIndexes = options.relatedIndexes || [];
    options.correctIndices = options.correctIndices || [];
    options.wrongIndices = options.wrongIndices || [];
    options.selectedIndices = options.selectedIndices || [];
    grid.innerHTML = "";
    grid.setAttribute("aria-disabled", options.disabled ? "true" : "false");

    cells.forEach(function (cellData, index) {
      var cell = document.createElement("button");
      var row = Math.floor(index / Puzzles.GRID_SIZE) + 1;
      var column = (index % Puzzles.GRID_SIZE) + 1;
      var isSelectable = cellData.selectable !== false && cellData.interactive !== false;

      cell.type = "button";
      cell.className = getCellClassName(cellData, index, options);
      cell.dataset.index = String(index);
      cell.disabled = Boolean(options.disabled || !isSelectable);
      renderCellContents(cell, cellData);
      cell.setAttribute("aria-label", getCellAriaLabel(cellData, row, column, options));

      if (options.answerMode === ANSWER_MODES.MULTI_SELECT) {
        cell.setAttribute("aria-pressed", options.selectedIndices.indexOf(index) !== -1 ? "true" : "false");
      }

      cell.addEventListener("click", handleCellClick);
      grid.appendChild(cell);
    });
  }

  function renderCellContents(cell, cellData) {
    var main = document.createElement("span");

    main.className = "cell-main";
    main.textContent = cellData.glyph || cellData.label || "";
    cell.appendChild(main);

    if (cellData.cornerLabel) {
      var corner = document.createElement("span");

      corner.className = "cell-corner";
      corner.textContent = cellData.cornerLabel;
      cell.appendChild(corner);
    }

    if (cellData.subLabel) {
      var subLabel = document.createElement("span");

      subLabel.className = "cell-sub-label";
      subLabel.textContent = cellData.subLabel;
      cell.appendChild(subLabel);
    }
  }

  function getCellClassName(cellData, index, options) {
    var kindParts = (cellData.kind || "token").split(/\s+/).filter(Boolean);
    var kind = (kindParts[0] || "token").replace(/[^a-z0-9-]/gi, "").toLowerCase() || "token";
    var classNames = ["cell", "tile--" + kind];

    kindParts.slice(1).forEach(function (part) {
      var safePart = part.replace(/[^a-z0-9-]/gi, "").toLowerCase();

      if (safePart) {
        classNames.push(safePart);
      }
    });

    if (cellData.zone) {
      classNames.push("zone--" + cellData.zone);
    }

    (cellData.classNames || []).forEach(function (className) {
      if (className) {
        classNames.push(className);
      }
    });

    if (options.correctIndices.indexOf(index) !== -1) {
      classNames.push("is-correct");
    }

    if (options.wrongIndices.indexOf(index) !== -1) {
      classNames.push("is-wrong-tap");
    }

    if (options.selectedIndices.indexOf(index) !== -1) {
      classNames.push("is-selected");
    }

    if (options.relatedIndexes.indexOf(index) !== -1) {
      classNames.push("is-related");
    }

    return classNames.join(" ");
  }

  function getCellAriaLabel(cellData, row, column, options) {
    var visible = cellData.ariaLabel || cellData.label || cellData.glyph || "empty square";
    var selected = options && options.selectedIndices && options.selectedIndices.indexOf((row - 1) * Puzzles.GRID_SIZE + (column - 1)) !== -1;

    return "Row " + row + ", column " + column + ", " + visible + (selected ? ", selected" : "");
  }

  function updateHeader(round) {
    var activeInstruction = round.instruction;

    if (state.phase === "active" && round.answerMode === ANSWER_MODES.CHOOSE_ONE) {
      activeInstruction = "Choose the best move square.";
    } else if (state.phase === "active" && round.answerMode === ANSWER_MODES.MULTI_SELECT) {
      activeInstruction = "Select every matching square, then submit.";
    }

    roundText.textContent = "Round " + (state.roundIndex + 1) + " of " + TOTAL_ROUNDS;
    roundName.textContent = round.title + " · " + round.sourceWorld;
    ruleText.textContent = state.phase === "briefing" ? round.briefingText : round.rule;
    instructionText.textContent = state.phase === "briefing" ? getBriefingInstruction(round) : activeInstruction;
    updateMistakes();
    updateVariantLabel();
  }

  function getBriefingInstruction(round) {
    if (round.answerMode === ANSWER_MODES.MULTI_SELECT) {
      return "This round uses multiple selections. The board stays hidden and the timer is paused.";
    }

    if (round.answerMode === ANSWER_MODES.CHOOSE_ONE) {
      return "This round asks for one best move. The board stays hidden and the timer is paused.";
    }

    return "Study the mechanic. The board stays hidden and the timer is paused.";
  }

  function updateMistakes() {
    mistakeText.textContent = "Mistakes " + state.totalMistakes;
  }

  function updateVariantLabel() {
    variantText.textContent = sessionAttempt > 1 ? "Variant " + sessionAttempt : "Daily Puzzle";
  }

  function updateButtons() {
    var round = puzzle.rounds[state.roundIndex];
    var roundState = state.rounds[state.roundIndex];
    var isMultiSelect = round && round.answerMode === ANSWER_MODES.MULTI_SELECT;
    var selectedCount = roundState ? roundState.selectedIndices.length : 0;

    startButton.hidden = true;
    submitButton.hidden = true;
    clearSelectionButton.hidden = true;
    shareButton.hidden = true;
    playMixButton.hidden = true;
    restartButton.hidden = true;

    if (state.phase === "intro") {
      startButton.hidden = false;
      startButton.textContent = sessionAttempt > 1 ? "Start Variant" : "Start";
      return;
    }

    if (state.phase === "briefing") {
      startButton.hidden = false;
      startButton.textContent = "Start Round";
      restartButton.hidden = false;
      return;
    }

    if (state.phase === "active") {
      if (isMultiSelect) {
        submitButton.hidden = false;
        submitButton.textContent = round.submitLabel || "Submit";
        submitButton.disabled = selectedCount < (round.minSelections || 1);
        clearSelectionButton.hidden = false;
        clearSelectionButton.disabled = selectedCount === 0;
      }
      restartButton.hidden = false;
      return;
    }

    if (state.phase === "feedback") {
      startButton.hidden = false;
      startButton.textContent = state.roundIndex + 1 >= TOTAL_ROUNDS ? "See Results" : "Next Round";
      restartButton.hidden = false;
      return;
    }

    if (state.phase === "complete") {
      shareButton.hidden = false;
      playMixButton.hidden = false;
      restartButton.hidden = false;
    }
  }

  function showBoard() {
    boardPlaceholder.hidden = true;
    gameArea.hidden = false;
    gameArea.className = "board-card is-active";
  }

  function hideBoard(message) {
    gameArea.hidden = true;
    grid.innerHTML = "";
    boardPlaceholder.hidden = !message;
    placeholderText.textContent = message || "";
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

  function hideBriefingDetails() {
    briefingDetails.hidden = true;
    symbolText.innerHTML = "";
    exampleBoard.innerHTML = "";
    exampleCaption.textContent = "";
  }

  function startTimer() {
    if (!state.activeStartedAt) {
      state.activeStartedAt = performance.now();
    }

    if (!timerId) {
      timerId = window.setInterval(updateTimer, 100);
    }
    updateTimer();
  }

  function pauseTimer() {
    if (state.activeStartedAt) {
      state.activeElapsedMs += performance.now() - state.activeStartedAt;
      state.activeStartedAt = 0;
      updateTimer();
    }

    stopTimer();
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

  function formatWholeSeconds(seconds) {
    return seconds + "s";
  }

  function shareResult() {
    var text = sharePreview.value || buildShareText(Scoring.calculateScore(getElapsedMs(), state.totalMistakes));

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

  function buildShareText(score) {
    var lines = [
      "One Wrong Move #" + padNumber(puzzleNumber, 3),
      "Score: " + formatWholeSeconds(score.scoreSeconds),
      "Lower is better"
    ];

    if (sessionAttempt > 1) {
      lines.push("Variant " + sessionAttempt);
    }

    lines.push(
      "Base: " + formatWholeSeconds(score.baseSeconds),
      "Mistakes: " + state.totalMistakes + " × " + score.penaltySecondsPerMistake + "s = +" + formatWholeSeconds(score.mistakePenaltySeconds),
      "✅✅✅"
    );

    lines.push("");
    puzzle.rounds.forEach(function (round, index) {
      lines.push("Round " + (index + 1) + ": " + round.name);
    });

    return lines.join("\n");
  }

  function getAnswerIndices(round) {
    if (Array.isArray(round.answerIndices) && round.answerIndices.length > 0) {
      return round.answerIndices.slice().sort(sortNumbers);
    }

    return typeof round.answerIndex === "number" ? [round.answerIndex] : [];
  }

  function sameSet(left, right) {
    left = left.slice().sort(sortNumbers);
    right = right.slice().sort(sortNumbers);

    return left.length === right.length && left.every(function (item, index) {
      return item === right[index];
    });
  }

  function sortNumbers(a, b) {
    return a - b;
  }

  function getStoredAttempt() {
    var stored = Number(window.sessionStorage.getItem(attemptKey));

    return stored > 0 ? stored : 1;
  }

  function getStoredSignatures() {
    try {
      var stored = JSON.parse(window.sessionStorage.getItem(signatureKey) || "[]");

      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      return [];
    }
  }

  function padNumber(number, length) {
    return String(number).padStart(length, "0");
  }

  window.OneWrongMove = {
    getSnapshot: function () {
      var currentRound = puzzle.rounds[state.roundIndex];
      var currentRoundState = state.rounds[state.roundIndex];

      return {
        dateKey: todayKey,
        puzzleNumber: puzzleNumber,
        sessionAttempt: sessionAttempt,
        phase: state.phase,
        roundIndex: state.roundIndex,
        answerMode: currentRound ? currentRound.answerMode : null,
        answerIndex: currentRound ? currentRound.answerIndex : null,
        answerIndices: currentRound ? getAnswerIndices(currentRound) : [],
        selectedIndices: currentRoundState ? currentRoundState.selectedIndices.slice() : [],
        breakSignature: currentRound ? currentRound.breakSignature : null,
        totalMistakes: state.totalMistakes,
        elapsedMs: getElapsedMs(),
        score: Scoring.calculateScore(getElapsedMs(), state.totalMistakes),
        timerRunning: Boolean(timerId),
        boardVisible: !gameArea.hidden,
        validation: Puzzles.validatePuzzle(puzzle),
        roundIds: puzzle.rounds.map(function (round) {
          return round.id;
        }),
        answerModes: puzzle.rounds.map(function (round) {
          return round.answerMode;
        }),
        roundNames: puzzle.rounds.map(function (round) {
          return round.name;
        }),
        sourceWorlds: puzzle.rounds.map(function (round) {
          return round.sourceWorld;
        }),
        breakSignatures: puzzle.rounds.map(function (round) {
          return round.breakSignature;
        }),
        evidence: puzzle.rounds.map(function (round) {
          return round.evidence;
        }),
        rounds: state.rounds.map(function (roundState) {
          return {
            solved: roundState.solved,
            mistakes: roundState.mistakes,
            selectedIndices: roundState.selectedIndices.slice()
          };
        })
      };
    }
  };
}());
