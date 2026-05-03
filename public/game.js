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
  var MODES = {
    LADDER: "ladder",
    FREEPLAY: "freeplay"
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
  var freePlayButton = document.getElementById("freePlayButton");
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
  var freePlayLevelLimitSeconds = Config.freePlayLevelTimeLimitSeconds || 0;
  var lowTimeWarningSeconds = Config.lowTimeWarningSeconds || 10;
  var maxGeneratedLevels = Config.maxGeneratedLevels || 100;
  var currentMode = initialMode();
  var run = createRun(sessionAttempt, currentMode);
  var signaturesRemembered = false;
  var timerId = null;
  var state = createFreshState("intro");

  puzzleText.textContent = "Puzzle #" + padNumber(puzzleNumber, 3);
  startButton.addEventListener("click", handlePrimaryAction);
  freePlayButton.addEventListener("click", startFreePlayFromIntro);
  submitButton.addEventListener("click", handleCommitMove);
  clearSelectionButton.addEventListener("click", clearSelection);
  restartButton.addEventListener("click", startVariantRun);
  playMixButton.addEventListener("click", startVariantRun);
  shareButton.addEventListener("click", shareResult);

  renderIntro();

  function createRun(attempt, mode) {
    if (mode === MODES.FREEPLAY) {
      return Puzzles.generateFreePlaySet(todayKey, attempt, attempt > 1 ? usedBreakSignatures : []);
    }
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
      mistakes: 0,
      selectedIndices: [],
      selectedSteps: {},
      wrongIndices: []
    };
  }

  function handlePrimaryAction() {
    if (state.phase === "intro") {
      currentMode = MODES.LADDER;
      run = createRun(sessionAttempt, currentMode);
      rememberCurrentBreakSignatures();
      enterBriefing(0);
      return;
    }

    if (state.phase === "briefing") {
      startActiveLevel();
      return;
    }

    if (state.phase === "feedback") {
      if (currentMode === MODES.FREEPLAY && state.levelIndex >= run.levels.length - 1) {
        showFreePlayComplete();
        return;
      }
      enterBriefing(state.levelIndex + 1);
    }
  }

  function startFreePlayFromIntro() {
    if (state.phase !== "intro") {
      return;
    }
    currentMode = MODES.FREEPLAY;
    run = createRun(sessionAttempt, currentMode);
    rememberCurrentBreakSignatures();
    enterBriefing(0);
  }

  function startVariantRun() {
    pauseTimers();
    sessionAttempt += 1;
    window.sessionStorage.setItem(attemptKey, String(sessionAttempt));
    usedBreakSignatures = getStoredSignatures();
    run = createRun(sessionAttempt, currentMode);
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
    mistakeText.textContent = currentMode === MODES.FREEPLAY ? "Mistakes 0" : "Lives 1";
    timerText.textContent = formatClock(0);
    levelTimerText.textContent = currentMode === MODES.FREEPLAY && !freePlayLevelLimitSeconds ? "—" : activeLevelLimitSeconds() + "s";
    levelTimerBox.classList.remove("is-low-time");
    roundName.textContent = "Mode choice";
    ruleText.textContent = "One board. One rule. One wrong move.";
    instructionText.textContent = "Ladder Run ends on your first wrong committed move. Three-Set Free Play lets you solve three puzzles with mistake penalties.";
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
    var answers = getAcceptedAnswerIndices(level);

    if (answers.indexOf(index) !== -1) {
      completeLevel(level, getAnswerIndices(level));
      return;
    }

    if (currentMode === MODES.FREEPLAY) {
      recordFreePlayMistake([index], level.wrongTapHint || "That move does not satisfy the rule.");
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
        if (currentMode === MODES.FREEPLAY) {
          recordFreePlayMistake(state.selectedIndices.slice(), level.wrongTapHint || "That submitted set is not exact.");
          return;
        }
        endRun("wrong-move", state.selectedIndices.slice(), "Wrong move", level.wrongTapHint || "That submitted set is not exact.");
      }
      return;
    }

    if (level.answerMode === ANSWER_MODES.TWO_STEP) {
      if (twoStepIsCorrect(level)) {
        completeLevel(level, answers);
      } else {
        if (currentMode === MODES.FREEPLAY) {
          recordFreePlayMistake(state.selectedIndices.slice(), level.wrongTapHint || "That two-step move is not the unique solution.");
          return;
        }
        endRun("wrong-move", state.selectedIndices.slice(), "Wrong move", level.wrongTapHint || "That two-step move is not the unique solution.");
      }
    }
  }

  function recordFreePlayMistake(wrongIndices, message) {
    state.mistakes += 1;
    state.wrongIndices = wrongIndices || [];
    showFeedback("Try again", message, "warning");
    renderLevel(currentLevel(), { wrongIndices: state.wrongIndices });
    updateHeader(currentLevel());
    updateButtons();
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

  function showFreePlayComplete() {
    pauseTimers();
    state.phase = "complete";
    state.endReason = "freeplay-complete";
    state.endedOnLevel = run.levels.length;
    hideFeedback();
    showFreePlayResults();
    updateButtons();
  }

  function showFreePlayResults() {
    var score = Scoring.calculateScore(getElapsedMs(), state.mistakes, 10);

    roundText.textContent = "Complete";
    mistakeText.textContent = "Mistakes " + state.mistakes;
    roundName.textContent = "Three-Set Free Play complete";
    ruleText.textContent = "Solved 3 of 3";
    instructionText.textContent = "Lower is better: rounded-up solving time plus 10 seconds per mistake.";
    solvedText.textContent = "3 of 3";
    finalTimeText.textContent = formatClock(getElapsedMs());
    baseScoreText.textContent = score.baseSeconds + "s";
    scoreText.textContent = score.scoreSeconds + "s";
    finalMistakeText.textContent = String(state.mistakes);
    penaltyText.textContent = state.mistakes + " × 10s = +" + score.mistakePenaltySeconds + "s";
    scoreFormulaText.textContent = "Lower is better";
    sharePreview.value = buildFreePlayShareText(score);
    resultPanel.hidden = false;
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
      var data = normalizeSymbolDisplay(symbol);
      var chip = document.createElement("span");
      var glyph = document.createElement("span");
      var label = document.createElement("span");

      chip.className = "symbol-chip";
      chip.setAttribute("aria-label", data.ariaLabel);
      glyph.className = "symbol-chip__glyph";
      glyph.textContent = data.glyph;
      label.className = "symbol-chip__label";
      label.textContent = data.label;
      chip.appendChild(glyph);
      chip.appendChild(label);
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
      targeting: level.targeting,
      correctIndices: markers.correctIndices || [],
      wrongIndices: markers.wrongIndices || state.wrongIndices || [],
      selectedIndices: state.phase === "feedback" ? [] : state.selectedIndices || [],
      relatedIndexes: markers.relatedIndexes || [],
      columns: level.columns || Puzzles.GRID_SIZE
    });
  }

  function renderCells(cells, options) {
    options.relatedIndexes = options.relatedIndexes || [];
    options.correctIndices = options.correctIndices || [];
    options.wrongIndices = options.wrongIndices || [];
    options.selectedIndices = options.selectedIndices || [];
    options.targeting = options.targeting || {};
    options.columns = options.columns || (state.currentLevel && state.currentLevel.columns) || Puzzles.GRID_SIZE;
    grid.innerHTML = "";
    grid.setAttribute("aria-disabled", options.disabled ? "true" : "false");
    grid.style.gridTemplateColumns = "repeat(" + options.columns + ", minmax(0, 1fr))";
    grid.dataset.columns = String(options.columns);

    cells.forEach(function (cellData, index) {
      var cell = document.createElement("button");
      var row = Math.floor(index / options.columns) + 1;
      var column = (index % options.columns) + 1;
      var isSelectable = cellData.selectable !== false && cellData.interactive !== false;

      cell.type = "button";
      cell.className = getCellClassName(cellData, index, options);
      cell.dataset.index = String(index);
      cell.disabled = Boolean(options.disabled || !isSelectable);
      if (!isSelectable) {
        cell.setAttribute("aria-disabled", "true");
        cell.tabIndex = -1;
      }
      renderCellContents(cell, cellData);
      cell.setAttribute("aria-label", getCellAriaLabel(cellData, row, column, index, options));

      if (options.answerMode === ANSWER_MODES.MULTI_SELECT || options.answerMode === ANSWER_MODES.TWO_STEP) {
        cell.setAttribute("aria-pressed", options.selectedIndices.indexOf(index) !== -1 ? "true" : "false");
      }

      cell.addEventListener("click", handleCellClick);
      grid.appendChild(cell);
    });
  }

  function renderCellContents(cell, cellData) {
    var isSymbolToken = (cellData.classNames || []).indexOf("symbol-token") !== -1 || (cellData.kind || "").indexOf("object") !== -1;
    var main = document.createElement("span");

    main.className = isSymbolToken ? "cell-main symbol-token symbol-token--emoji" : "cell-main";
    if (isSymbolToken) {
      var glyph = document.createElement("span");

      glyph.className = "symbol-token__glyph";
      glyph.textContent = cellData.glyph || cellData.label || "";
      main.appendChild(glyph);
    } else {
      main.textContent = cellData.glyph || cellData.label || "";
    }
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
    if (cellData.selectable === false || cellData.interactive === false) {
      classNames.push("is-disabled-target");
    }
    return classNames.join(" ");
  }

  function getCellAriaLabel(cellData, row, column, index, options) {
    var visible = cellData.ariaLabel || cellData.label || cellData.glyph || "empty square";
    var selected = options && options.selectedIndices && options.selectedIndices.indexOf(index) !== -1;

    return "Row " + row + ", column " + column + ", " + visible + (selected ? ", selected" : "");
  }

  function normalizeSymbolDisplay(symbol) {
    if (typeof symbol === "string") {
      return {
        glyph: symbol,
        label: symbol,
        ariaLabel: symbol
      };
    }
    return {
      glyph: symbol.glyph || symbol.label || "",
      label: symbol.shortLabel || symbol.label || symbol.ariaLabel || symbol.glyph || "",
      ariaLabel: symbol.ariaLabel || symbol.label || symbol.glyph || ""
    };
  }

  function updateHeader(level) {
    roundText.textContent = currentMode === MODES.FREEPLAY ? "Puzzle " + (state.levelIndex + 1) + " of 3" : "Level " + (state.levelIndex + 1);
    roundName.textContent = level.title + " · " + level.sourceWorld;
    ruleText.textContent = state.phase === "briefing" ? level.briefingText : level.rule;
    instructionText.textContent = state.phase === "briefing" ? getBriefingInstruction(level) : getActiveInstruction(level);
    mistakeText.textContent = currentMode === MODES.FREEPLAY ? "Mistakes " + state.mistakes : state.phase === "complete" ? "Wrong Moves " + state.wrongMoves + "/1" : "Lives 1";
    updateVariantLabel();
    updateTimerDisplay();
  }

  function getBriefingInstruction(level) {
    return (level.answerStyleLabel || answerModeLabel(level)) + ". Timer and countdown are paused until " + (currentMode === MODES.FREEPLAY ? "Start Puzzle." : "Start Level.");
  }

  function getActiveInstruction(level) {
    var suffix = currentMode === MODES.FREEPLAY ? " A wrong attempt adds a mistake; keep solving." : " One wrong move ends the run.";

    if (level.targeting && level.targeting.targetHint) {
      return level.targeting.targetHint + suffix;
    }
    if (level.answerMode === ANSWER_MODES.CHOOSE_ONE) {
      return "Choose the best move." + suffix;
    }
    if (level.answerMode === ANSWER_MODES.MULTI_SELECT) {
      return "Plan by selecting squares, then commit." + suffix;
    }
    if (level.answerMode === ANSWER_MODES.TWO_STEP) {
      return "Choose both parts of the move, then commit." + suffix;
    }
    return "Tap the one move that breaks the rule." + suffix;
  }

  function answerModeLabel(level) {
    var answerMode = typeof level === "string" ? level : level.answerMode;
    var targeting = typeof level === "string" ? null : level.targeting;

    if (targeting && targeting.targetType === "row") {
      return "Tap any cell in the broken row";
    }
    if (targeting && targeting.targetType === "column") {
      return "Tap any cell in the broken column";
    }
    if (targeting && targeting.targetType === "outputCell") {
      return "Tap the wrong output";
    }
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
    var label = currentMode === MODES.FREEPLAY ? "Free Play" : "Ladder Run";
    variantText.textContent = sessionAttempt > 1 ? label + " · Variant " + sessionAttempt : label;
  }

  function updateButtons() {
    var level = currentLevel();
    var isCommitMode = level && (level.answerMode === ANSWER_MODES.MULTI_SELECT || level.answerMode === ANSWER_MODES.TWO_STEP);
    var selectedCount = state.selectedIndices.length;

    startButton.hidden = true;
    submitButton.hidden = true;
    clearSelectionButton.hidden = true;
    freePlayButton.hidden = true;
    shareButton.hidden = true;
    playMixButton.hidden = true;
    restartButton.hidden = true;
    submitButton.disabled = false;
    clearSelectionButton.disabled = false;

    if (state.phase === "intro") {
      startButton.hidden = false;
      startButton.textContent = "Start Ladder Run";
      freePlayButton.hidden = false;
      freePlayButton.textContent = "Three-Set Free Play";
      return;
    }

    if (state.phase === "briefing") {
      startButton.hidden = false;
      startButton.textContent = currentMode === MODES.FREEPLAY ? "Start Puzzle" : "Start Level";
      restartButton.hidden = false;
      return;
    }

    if (state.phase === "active") {
      if (isCommitMode) {
        submitButton.hidden = false;
        submitButton.textContent = level.submitLabel || "Submit Move";
        submitButton.disabled = !commitSelectionReady(level);
        clearSelectionButton.hidden = false;
        clearSelectionButton.textContent = level.clearLabel || "Clear selection";
        clearSelectionButton.disabled = selectedCount === 0;
      }
      restartButton.hidden = false;
      return;
    }

    if (state.phase === "feedback") {
      startButton.hidden = false;
      startButton.textContent = currentMode === MODES.FREEPLAY && state.levelIndex >= run.levels.length - 1 ? "See Results" : currentMode === MODES.FREEPLAY ? "Next Puzzle" : "Next Level";
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
    levelTimerText.textContent = activeLevelLimitSeconds() ? Math.max(0, Math.ceil(levelRemaining / 1000)) + "s" : "—";
    levelTimerBox.classList.toggle("is-low-time", state.phase === "active" && activeLevelLimitSeconds() > 0 && levelRemaining <= lowTimeWarningSeconds * 1000);

    if (state.phase === "active" && activeLevelLimitSeconds() > 0 && levelRemaining <= 0) {
      if (currentMode === MODES.FREEPLAY) {
        recordFreePlayMistake([], "Time expired. That counts as a mistake here, but Free Play continues.");
        state.levelStartedAt = performance.now();
      } else {
        endRun("time-expired", [], "Run ended", "Time expired on this level.");
      }
    }
  }

  function getElapsedMs() {
    if (state.activeStartedAt) {
      return state.activeElapsedMs + (performance.now() - state.activeStartedAt);
    }
    return state.activeElapsedMs;
  }

  function getLevelRemainingMs() {
    var limit = activeLevelLimitSeconds();

    if (!limit) {
      return 0;
    }
    if (!state.levelStartedAt) {
      return limit * 1000;
    }
    return limit * 1000 - (performance.now() - state.levelStartedAt);
  }

  function activeLevelLimitSeconds() {
    return currentMode === MODES.FREEPLAY ? freePlayLevelLimitSeconds : levelLimitSeconds;
  }

  function formatClock(milliseconds) {
    var totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;

    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  function shareResult() {
    var text = sharePreview.value || (currentMode === MODES.FREEPLAY ? buildFreePlayShareText(Scoring.calculateScore(getElapsedMs(), state.mistakes, 10)) : buildShareText(survivalScore()));

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
      "Ladder Run",
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

  function buildFreePlayShareText(score) {
    var lines = [
      "One Wrong Move #" + padNumber(puzzleNumber, 3),
      "Three-Set Free Play",
      "Score: " + score.scoreSeconds + "s",
      "Base: " + score.baseSeconds + "s",
      "Mistakes: " + state.mistakes + " × 10s = +" + score.mistakePenaltySeconds + "s",
      "✅✅✅",
      ""
    ];

    run.levels.forEach(function (level, index) {
      lines.push("Puzzle " + (index + 1) + ": " + level.name);
    });
    if (sessionAttempt > 1) {
      lines.push("", "Variant " + sessionAttempt);
    }
    return lines.join("\n");
  }

  function currentLevel() {
    return run.levels[state.levelIndex];
  }

  function getAcceptedAnswerIndices(level) {
    if (level.targeting && Array.isArray(level.targeting.answerIndices) && level.targeting.answerIndices.length > 0) {
      return level.targeting.answerIndices.slice().sort(sortNumbers);
    }
    return getAnswerIndices(level);
  }

  function survivalScore() {
    return Scoring.calculateSurvivalScore(state.levelsCompleted, getElapsedMs(), state.endedOnLevel || state.levelIndex + 1, state.endReason || "wrong-move");
  }

  function initialMode() {
    try {
      var mode = new URLSearchParams(window.location.search).get("mode");
      return mode === MODES.FREEPLAY ? MODES.FREEPLAY : MODES.LADDER;
    } catch (error) {
      return MODES.LADDER;
    }
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
        mode: currentMode,
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
        mistakes: state.mistakes,
        endReason: state.endReason,
        elapsedMs: getElapsedMs(),
        levelRemainingMs: getLevelRemainingMs(),
        score: currentMode === MODES.FREEPLAY
          ? Scoring.calculateScore(getElapsedMs(), state.mistakes, 10)
          : survivalScore(),
        timerRunning: Boolean(timerId),
        boardVisible: !gameArea.hidden,
        validation: Puzzles.validatePuzzle(run),
        levelIds: run.levels.map(function (item) { return item.id; }),
        levelNames: run.levels.map(function (item) { return item.name; }),
        answerModes: run.levels.map(function (item) { return item.answerMode; }),
        sourceWorlds: run.levels.map(function (item) { return item.sourceWorld; }),
        breakSignatures: run.levels.map(function (item) { return item.breakSignature; }),
        targeting: level ? level.targeting : null
      };
    }
  };
}());
