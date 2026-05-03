(function () {
  "use strict";

  var Config = window.OWM_CONFIG || {
    levelTimeLimitSeconds: 60,
    lowTimeWarningSeconds: 10,
    maxGeneratedLevels: 100
  };
  var Puzzles = window.OneWrongMovePuzzles;
  var Scoring = window.OneWrongMoveScoring;
  var ANSWER_MODES = {
    IDENTIFY_ONE: (Puzzles.ANSWER_MODES && Puzzles.ANSWER_MODES.identifyOne) || "identifyOne",
    CHOOSE_ONE: (Puzzles.ANSWER_MODES && Puzzles.ANSWER_MODES.chooseOne) || "chooseOne",
    MULTI_SELECT: (Puzzles.ANSWER_MODES && Puzzles.ANSWER_MODES.multiSelect) || "multiSelect",
    TWO_STEP: (Puzzles.ANSWER_MODES && Puzzles.ANSWER_MODES.twoStep) || "twoStep"
  };

  var grid = document.getElementById("grid");
  var gameArea = document.getElementById("gameArea");
  var boardPlaceholder = document.getElementById("boardPlaceholder");
  var placeholderText = document.getElementById("placeholderText");
  var puzzleText = document.getElementById("puzzleText");
  var variantText = document.getElementById("variantText");
  var timerText = document.getElementById("timerText");
  var levelTimerText = document.getElementById("levelTimerText");
  var levelTimerBox = document.getElementById("levelTimerBox");
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
  var signatureKey = "owm:" + todayKey + ":survivalBreakSignatures";
  var sessionAttempt = getStoredAttempt();
  var usedBreakSignatures = getStoredSignatures();
  var levelLimitSeconds = Config.levelTimeLimitSeconds || 60;
  var lowTimeWarningSeconds = Config.lowTimeWarningSeconds || 10;
  var maxGeneratedLevels = Config.maxGeneratedLevels || 100;
  var run = createRun(sessionAttempt);
  var signaturesRemembered = false;
  var timerId = null;
  var state = createFreshState("intro");

  puzzleText.textContent = "Puzzle #" + padNumber(puzzleNumber, 3);
  startButton.addEventListener("click", handlePrimaryAction);
  submitButton.addEventListener("click", handleCommitMove);
  clearSelectionButton.addEventListener("click", clearSelection);
  restartButton.addEventListener("click", startVariantRun);
  playMixButton.addEventListener("click", startVariantRun);
  shareButton.addEventListener("click", shareResult);

  renderIntro();

  function createRun(attempt) {
    return Puzzles.generateSurvivalLevels(todayKey, attempt, attempt > 1 ? usedBreakSignatures : [], maxGeneratedLevels);
  }

  function createFreshState(phase) {
    return {
      phase: phase,
      levelIndex: 0,
      levelsCompleted: 0,
      wrongMoves: 0,
      activeElapsedMs: 0,
      activeStartedAt: 0,
      levelStartedAt: 0,
      endReason: "",
      endedOnLevel: 1,
      selectedIndices: [],
      selectedSteps: {},
      wrongIndices: []
    };
  }

  function handlePrimaryAction() {
    if (state.phase === "intro") {
      rememberCurrentBreakSignatures();
      enterBriefing(0);
      return;
    }

    if (state.phase === "briefing") {
      startActiveLevel();
      return;
    }

    if (state.phase === "feedback") {
      enterBriefing(state.levelIndex + 1);
    }
  }

  function startVariantRun() {
    pauseTimers();
    sessionAttempt += 1;
    window.sessionStorage.setItem(attemptKey, String(sessionAttempt));
    usedBreakSignatures = getStoredSignatures();
    run = createRun(sessionAttempt);
    signaturesRemembered = false;
    state = createFreshState("intro");
    renderIntro();
  }

  function rememberCurrentBreakSignatures() {
    if (signaturesRemembered) {
      return;
    }

    usedBreakSignatures = getStoredSignatures();
    run.levels.forEach(function (level) {
      if (usedBreakSignatures.indexOf(level.breakSignature) === -1) {
        usedBreakSignatures.push(level.breakSignature);
      }
    });
    window.sessionStorage.setItem(signatureKey, JSON.stringify(usedBreakSignatures));
    signaturesRemembered = true;
  }

  function renderIntro() {
    pauseTimers();
    state.phase = "intro";
    state.levelIndex = 0;
    state.selectedIndices = [];
    state.selectedSteps = {};
    state.wrongIndices = [];
    resultPanel.hidden = true;
    hideFeedback();
    hideBriefingDetails();
    hideBoard("The board stays hidden until you start a level.");
    updateVariantLabel();
    roundText.textContent = "Ready";
    mistakeText.textContent = "Lives 1";
    timerText.textContent = formatClock(0);
    levelTimerText.textContent = levelLimitSeconds + "s";
    levelTimerBox.classList.remove("is-low-time");
    roundName.textContent = sessionAttempt > 1 ? "Variant survival run" : "Daily survival run";
    ruleText.textContent = "One board. One rule. One move. Survive until your first wrong move.";
    instructionText.textContent = "Solve as many levels as you can. One wrong move or an expired " + levelLimitSeconds + "s level timer ends the run.";
    updateButtons();
  }

  function enterBriefing(levelIndex) {
    var level = run.levels[levelIndex];

    pauseTimers();
    state.phase = "briefing";
    state.levelIndex = levelIndex;
    resetSelections();
    hideFeedback();
    hideBoard("Level " + (levelIndex + 1) + " is hidden until you press Start Level.");
    resultPanel.hidden = true;
    updateHeader(level);
    renderBriefing(level);
    updateButtons();
  }

  function startActiveLevel() {
    var level = currentLevel();

    resetSelections();
    state.phase = "active";
    hideFeedback();
    hideBriefingDetails();
    showBoard();
    updateHeader(level);
    renderLevel(level);
    startTimers();
    updateButtons();
  }

  function handleCellClick(event) {
    if (state.phase !== "active") {
      return;
    }

    var index = Number(event.currentTarget.dataset.index);
    var level = currentLevel();

    if (level.answerMode === ANSWER_MODES.MULTI_SELECT) {
      toggleMultiSelectCell(index, level);
      return;
    }

    if (level.answerMode === ANSWER_MODES.TWO_STEP) {
      selectTwoStepCell(index, level);
      return;
    }

    handleSingleAnswerTap(index, level);
  }

  function handleSingleAnswerTap(index, level) {
    var answers = getAnswerIndices(level);

    if (answers.indexOf(index) !== -1) {
      completeLevel(level, answers);
      return;
    }

    endRun("wrong-move", [index], "Wrong move", level.wrongTapHint || "That move does not satisfy the rule.");
  }

  function toggleMultiSelectCell(index, level) {
    var cell = level.cells[index] || level.board[index];

    if (!cell || cell.selectable === false || cell.interactive === false) {
      showFeedback("Not selectable", level.wrongTapHint || "Select only legal move squares, then submit.", "warning");
      return;
    }

    state.wrongIndices = [];
    if (state.selectedIndices.indexOf(index) === -1) {
      if (!level.maxSelections || state.selectedIndices.length < level.maxSelections) {
        state.selectedIndices.push(index);
      }
    } else {
      state.selectedIndices = state.selectedIndices.filter(function (item) {
        return item !== index;
      });
    }
    state.selectedIndices.sort(sortNumbers);
    hideFeedback();
    renderLevel(level);
    updateButtons();
  }

  function selectTwoStepCell(index, level) {
    var cell = level.cells[index] || level.board[index];
    var role = cell && cell.value && cell.value.selectionRole;

    if (!role) {
      showFeedback("Not part of the move", level.wrongTapHint || "Choose the requested move parts, then submit.", "warning");
      return;
    }

    state.selectedSteps[role] = index;
    state.selectedIndices = Object.keys(state.selectedSteps).map(function (key) {
      return state.selectedSteps[key];
    }).sort(sortNumbers);
    state.wrongIndices = [];
    hideFeedback();
    renderLevel(level);
    updateButtons();
  }

  function handleCommitMove() {
    if (state.phase !== "active") {
      return;
    }

    var level = currentLevel();
    var answers = getAnswerIndices(level);

    if (level.answerMode === ANSWER_MODES.MULTI_SELECT) {
      if (sameSet(state.selectedIndices, answers)) {
        completeLevel(level, answers);
      } else {
        endRun("wrong-move", state.selectedIndices.slice(), "Wrong move", level.wrongTapHint || "That submitted set is not exact.");
      }
      return;
    }

    if (level.answerMode === ANSWER_MODES.TWO_STEP) {
      if (twoStepIsCorrect(level)) {
        completeLevel(level, answers);
      } else {
        endRun("wrong-move", state.selectedIndices.slice(), "Wrong move", level.wrongTapHint || "That two-step move is not the unique solution.");
      }
    }
  }

  function twoStepIsCorrect(level) {
    return (level.answerSteps || []).every(function (step) {
      return state.selectedSteps[step.role] === step.index;
    });
  }

  function completeLevel(level, answers) {
    pauseTimers();
    state.phase = "feedback";
    state.levelsCompleted += 1;
    state.wrongIndices = [];
    showFeedback("Correct", level.explanation, "success");
    renderLevel(level, {
      correctIndices: answers,
      relatedIndexes: level.relatedIndexes || []
    });
    updateHeader(level);
    updateButtons();
  }

  function endRun(endReason, wrongIndices, title, message) {
    var level = currentLevel();

    pauseTimers();
    state.phase = "complete";
    state.endReason = endReason;
    state.endedOnLevel = state.levelIndex + 1;
    state.wrongMoves = endReason === "wrong-move" ? 1 : 0;
    state.wrongIndices = wrongIndices || [];
    showFeedback(title || "Run ended", message || endReasonLabel(endReason), "warning");
    if (!gameArea.hidden) {
      renderLevel(level, { wrongIndices: state.wrongIndices });
    }
    showRunOver(level);
    updateButtons();
  }

  function showRunOver(level) {
    var score = survivalScore();

    roundText.textContent = "Run over";
    mistakeText.textContent = "Wrong Moves " + state.wrongMoves + "/1";
    roundName.textContent = "Run ended";
    ruleText.textContent = score.levelsCompleted + " levels in " + formatClock(score.totalActiveMs);
    instructionText.textContent = endReasonLabel(score.endReason) + " on Level " + score.endedOnLevel + ". More levels is better; ties go to faster time.";
    solvedText.textContent = String(score.levelsCompleted);
    finalTimeText.textContent = formatClock(score.totalActiveMs);
    baseScoreText.textContent = "Level " + score.endedOnLevel;
    scoreText.textContent = score.levelsCompleted + " levels";
    finalMistakeText.textContent = endReasonLabel(score.endReason);
    penaltyText.textContent = "Level " + score.endedOnLevel + ": " + level.name;
    scoreFormulaText.textContent = levelLimitSeconds + "s/level";
    sharePreview.value = buildShareText(score);
    resultPanel.hidden = false;
  }

  function renderBriefing(level) {
    briefingDetails.hidden = false;
    renderSymbolChips(level.symbolBank || level.symbols || []);
    exampleCaption.textContent = level.exampleData.caption;
    exampleBoard.innerHTML = "";
    exampleBoard.style.gridTemplateColumns = "repeat(" + level.exampleData.columns + ", minmax(0, 1fr))";
    level.exampleData.cells.forEach(renderExampleCell);
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

  function renderLevel(level, markers) {
    markers = markers || {};
    renderCells(level.cells, {
      disabled: state.phase !== "active",
      answerMode: level.answerMode,
      correctIndices: markers.correctIndices || [],
      wrongIndices: markers.wrongIndices || state.wrongIndices || [],
      selectedIndices: state.phase === "feedback" ? [] : state.selectedIndices || [],
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

      if (options.answerMode === ANSWER_MODES.MULTI_SELECT || options.answerMode === ANSWER_MODES.TWO_STEP) {
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

  function updateHeader(level) {
    roundText.textContent = "Level " + (state.levelIndex + 1);
    roundName.textContent = level.title + " · " + level.sourceWorld;
    ruleText.textContent = state.phase === "briefing" ? level.briefingText : level.rule;
    instructionText.textContent = state.phase === "briefing" ? getBriefingInstruction(level) : getActiveInstruction(level);
    mistakeText.textContent = state.phase === "complete" ? "Wrong Moves " + state.wrongMoves + "/1" : "Lives 1";
    updateVariantLabel();
    updateTimerDisplay();
  }

  function getBriefingInstruction(level) {
    return answerModeLabel(level.answerMode) + ". Timer and countdown are paused until Start Level.";
  }

  function getActiveInstruction(level) {
    if (level.answerMode === ANSWER_MODES.CHOOSE_ONE) {
      return "Choose the best move. One wrong move ends the run.";
    }
    if (level.answerMode === ANSWER_MODES.MULTI_SELECT) {
      return "Plan by selecting squares, then commit. A wrong submission ends the run.";
    }
    if (level.answerMode === ANSWER_MODES.TWO_STEP) {
      return "Choose both parts of the move, then commit. A wrong submission ends the run.";
    }
    return "Tap the one move that breaks the rule. One wrong move ends the run.";
  }

  function answerModeLabel(answerMode) {
    if (answerMode === ANSWER_MODES.CHOOSE_ONE) {
      return "Choose one best move";
    }
    if (answerMode === ANSWER_MODES.MULTI_SELECT) {
      return "Select exact squares, then Submit Move";
    }
    if (answerMode === ANSWER_MODES.TWO_STEP) {
      return "Make a two-step move, then Submit Move";
    }
    return "Tap one square";
  }

  function updateVariantLabel() {
    variantText.textContent = sessionAttempt > 1 ? "Variant " + sessionAttempt : "Survival Run";
  }

  function updateButtons() {
    var level = currentLevel();
    var isCommitMode = level && (level.answerMode === ANSWER_MODES.MULTI_SELECT || level.answerMode === ANSWER_MODES.TWO_STEP);
    var selectedCount = state.selectedIndices.length;

    startButton.hidden = true;
    submitButton.hidden = true;
    clearSelectionButton.hidden = true;
    shareButton.hidden = true;
    playMixButton.hidden = true;
    restartButton.hidden = true;
    submitButton.disabled = false;
    clearSelectionButton.disabled = false;

    if (state.phase === "intro") {
      startButton.hidden = false;
      startButton.textContent = "Start Survival Run";
      return;
    }

    if (state.phase === "briefing") {
      startButton.hidden = false;
      startButton.textContent = "Start Level";
      restartButton.hidden = false;
      return;
    }

    if (state.phase === "active") {
      if (isCommitMode) {
        submitButton.hidden = false;
        submitButton.textContent = level.submitLabel || "Submit Move";
        submitButton.disabled = !commitSelectionReady(level);
        clearSelectionButton.hidden = false;
        clearSelectionButton.disabled = selectedCount === 0;
      }
      restartButton.hidden = false;
      return;
    }

    if (state.phase === "feedback") {
      startButton.hidden = false;
      startButton.textContent = "Next Level";
      restartButton.hidden = false;
      return;
    }

    if (state.phase === "complete") {
      shareButton.hidden = false;
      playMixButton.hidden = false;
      playMixButton.textContent = "Play again";
      restartButton.hidden = false;
    }
  }

  function commitSelectionReady(level) {
    if (level.answerMode === ANSWER_MODES.MULTI_SELECT) {
      return state.selectedIndices.length >= (level.minSelections || getAnswerIndices(level).length);
    }
    if (level.answerMode === ANSWER_MODES.TWO_STEP) {
      return (level.answerSteps || []).every(function (step) {
        return typeof state.selectedSteps[step.role] === "number";
      });
    }
    return false;
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

  function startTimers() {
    state.activeStartedAt = performance.now();
    state.levelStartedAt = state.activeStartedAt;
    if (!timerId) {
      timerId = window.setInterval(updateTimerDisplay, 100);
    }
    updateTimerDisplay();
  }

  function pauseTimers() {
    if (state.activeStartedAt) {
      state.activeElapsedMs += performance.now() - state.activeStartedAt;
      state.activeStartedAt = 0;
      state.levelStartedAt = 0;
    }
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    var totalMs = getElapsedMs();
    var levelRemaining = getLevelRemainingMs();

    timerText.textContent = formatClock(totalMs);
    levelTimerText.textContent = Math.max(0, Math.ceil(levelRemaining / 1000)) + "s";
    levelTimerBox.classList.toggle("is-low-time", state.phase === "active" && levelRemaining <= lowTimeWarningSeconds * 1000);

    if (state.phase === "active" && levelRemaining <= 0) {
      endRun("time-expired", [], "Run ended", "Time expired on this level.");
    }
  }

  function getElapsedMs() {
    if (state.activeStartedAt) {
      return state.activeElapsedMs + (performance.now() - state.activeStartedAt);
    }
    return state.activeElapsedMs;
  }

  function getLevelRemainingMs() {
    if (!state.levelStartedAt) {
      return levelLimitSeconds * 1000;
    }
    return levelLimitSeconds * 1000 - (performance.now() - state.levelStartedAt);
  }

  function formatClock(milliseconds) {
    var totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;

    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  function shareResult() {
    var text = sharePreview.value || buildShareText(survivalScore());

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
      "Survival Run",
      score.levelsCompleted + " levels in " + formatClock(score.totalActiveMs),
      "Ended: " + endReasonShareLabel(score.endReason) + " on Level " + score.endedOnLevel,
      "Limit: " + levelLimitSeconds + "s/level"
    ];
    var played = run.levels.slice(0, Math.max(score.endedOnLevel, score.levelsCompleted));
    var shown = played.length > 8 ? played.slice(0, 5).concat(played.slice(-3)) : played;

    if (sessionAttempt > 1) {
      lines.push("Variant " + sessionAttempt);
    }
    lines.push("", "Best levels:");
    shown.forEach(function (level, index) {
      if (played.length > 8 && index === 5) {
        lines.push("...");
      }
      lines.push(level.levelNumber + ". " + level.name);
    });
    return lines.join("\n");
  }

  function currentLevel() {
    return run.levels[state.levelIndex];
  }

  function survivalScore() {
    return Scoring.calculateSurvivalScore(state.levelsCompleted, getElapsedMs(), state.endedOnLevel || state.levelIndex + 1, state.endReason || "wrong-move");
  }

  function resetSelections() {
    state.selectedIndices = [];
    state.selectedSteps = {};
    state.wrongIndices = [];
  }

  function clearSelection() {
    if (state.phase !== "active") {
      return;
    }
    resetSelections();
    hideFeedback();
    renderLevel(currentLevel());
    updateButtons();
  }

  function getAnswerIndices(level) {
    if (Array.isArray(level.answerIndices) && level.answerIndices.length > 0) {
      return level.answerIndices.slice().sort(sortNumbers);
    }
    if (Array.isArray(level.answerSteps) && level.answerSteps.length > 0) {
      return level.answerSteps.map(function (step) { return step.index; }).sort(sortNumbers);
    }
    return typeof level.answerIndex === "number" ? [level.answerIndex] : [];
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

  function endReasonLabel(reason) {
    return reason === "time-expired" ? "Time expired" : "Wrong move";
  }

  function endReasonShareLabel(reason) {
    return reason === "time-expired" ? "time expired" : "wrong move";
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
      var level = currentLevel();
      return {
        dateKey: todayKey,
        puzzleNumber: puzzleNumber,
        sessionAttempt: sessionAttempt,
        phase: state.phase,
        levelIndex: state.levelIndex,
        levelNumber: state.levelIndex + 1,
        answerMode: level ? level.answerMode : null,
        answerIndex: level ? level.answerIndex : null,
        answerIndices: level ? getAnswerIndices(level) : [],
        answerSteps: level ? level.answerSteps || [] : [],
        selectedIndices: state.selectedIndices.slice(),
        selectedSteps: Object.assign({}, state.selectedSteps),
        breakSignature: level ? level.breakSignature : null,
        levelsCompleted: state.levelsCompleted,
        wrongMoves: state.wrongMoves,
        endReason: state.endReason,
        elapsedMs: getElapsedMs(),
        levelRemainingMs: getLevelRemainingMs(),
        score: survivalScore(),
        timerRunning: Boolean(timerId),
        boardVisible: !gameArea.hidden,
        validation: Puzzles.validatePuzzle(run),
        levelIds: run.levels.map(function (item) { return item.id; }),
        levelNames: run.levels.map(function (item) { return item.name; }),
        answerModes: run.levels.map(function (item) { return item.answerMode; }),
        sourceWorlds: run.levels.map(function (item) { return item.sourceWorld; }),
        breakSignatures: run.levels.map(function (item) { return item.breakSignature; })
      };
    }
  };
}());
