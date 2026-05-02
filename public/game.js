(function () {
  "use strict";

  var Puzzles = window.OneWrongMovePuzzles;
  var TOTAL_ROUNDS = 3;

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
  var finalMistakeText = document.getElementById("finalMistakeText");
  var scoreText = document.getElementById("scoreText");
  var sharePreview = document.getElementById("sharePreview");
  var startButton = document.getElementById("startButton");
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
          mistakes: 0
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
    ruleText.textContent = "One board. One rule. One wrong move.";
    instructionText.textContent = "Start with a paused briefing. The timer only runs while you are actively solving.";
    updateButtons();
  }

  function enterBriefing(roundIndex) {
    var round = puzzle.rounds[roundIndex];

    pauseTimer();
    state.phase = "briefing";
    state.roundIndex = roundIndex;
    hideFeedback();
    hideBoard("Round " + (roundIndex + 1) + " is hidden until you press Start Round.");
    resultPanel.hidden = true;
    updateHeader(round);
    renderBriefing(round);
    updateButtons();
  }

  function startActiveRound() {
    var round = puzzle.rounds[state.roundIndex];

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
    var roundState = state.rounds[state.roundIndex];

    if (index === round.answerIndex) {
      pauseTimer();
      state.phase = "feedback";
      roundState.solved = true;
      showFeedback("Correct", round.explanation, "success");
      renderRound(round, {
        correctIndex: round.answerIndex,
        relatedIndexes: round.relatedIndexes || []
      });
      updateButtons();
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

    pauseTimer();
    stopTimer();
    state.phase = "complete";
    hideBoard("");
    hideBriefingDetails();
    hideFeedback();
    roundText.textContent = "Complete";
    roundName.textContent = "Daily puzzle solved";
    ruleText.textContent = "Solved 3 of 3";
    instructionText.textContent = "Share your result, play another mix, or restart into a new variant.";
    solvedText.textContent = "3 of 3";
    finalTimeText.textContent = formatSeconds(elapsedMs);
    finalMistakeText.textContent = String(state.totalMistakes);
    scoreText.textContent = String(score);
    sharePreview.value = buildShareText(elapsedMs, score);
    resultPanel.hidden = false;
    updateButtons();
  }

  function renderBriefing(round) {
    briefingDetails.hidden = false;
    symbolText.textContent = round.symbolBank.join(" ");
    exampleCaption.textContent = round.exampleData.caption;
    exampleBoard.innerHTML = "";
    exampleBoard.style.gridTemplateColumns = "repeat(" + round.exampleData.columns + ", minmax(0, 1fr))";

    round.exampleData.cells.forEach(function (label) {
      var cell = document.createElement("span");

      cell.className = "example-cell";
      cell.textContent = label;
      exampleBoard.appendChild(cell);
    });
  }

  function renderRound(round, markers) {
    markers = markers || {};
    renderCells(round.cells, {
      disabled: state.phase !== "active",
      correctIndex: markers.correctIndex,
      wrongIndex: markers.wrongIndex,
      relatedIndexes: markers.relatedIndexes || []
    });
  }

  function renderCells(cells, options) {
    options.relatedIndexes = options.relatedIndexes || [];
    grid.innerHTML = "";
    grid.setAttribute("aria-disabled", options.disabled ? "true" : "false");

    cells.forEach(function (cellData, index) {
      var cell = document.createElement("button");
      var row = Math.floor(index / Puzzles.GRID_SIZE) + 1;
      var column = (index % Puzzles.GRID_SIZE) + 1;

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
    var visible = cellData.label ? cellData.name + " " + cellData.label : "empty square";

    return "Row " + row + ", column " + column + ", " + visible;
  }

  function updateHeader(round) {
    roundText.textContent = "Round " + (state.roundIndex + 1) + " of " + TOTAL_ROUNDS;
    roundName.textContent = round.title;
    ruleText.textContent = state.phase === "briefing" ? round.briefingText : round.rule;
    instructionText.textContent = state.phase === "briefing" ? "Study the mechanic. The board stays hidden and the timer is paused." : round.instruction;
    updateMistakes();
    updateVariantLabel();
  }

  function updateMistakes() {
    mistakeText.textContent = "Mistakes " + state.totalMistakes;
  }

  function updateVariantLabel() {
    variantText.textContent = sessionAttempt > 1 ? "Variant " + sessionAttempt : "Daily Puzzle";
  }

  function updateButtons() {
    startButton.hidden = true;
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
    symbolText.textContent = "";
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

  function calculateScore(milliseconds, mistakes) {
    return Math.max(0, 1000 - Math.floor((milliseconds / 1000) * 10) - mistakes * 50);
  }

  function shareResult() {
    var text = sharePreview.value || buildShareText(getElapsedMs(), calculateScore(getElapsedMs(), state.totalMistakes));

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

  function buildShareText(elapsedMs, score) {
    var lines = [
      "One Wrong Move #" + padNumber(puzzleNumber, 3),
      "✅✅✅",
      formatSeconds(elapsedMs),
      "Mistakes: " + state.totalMistakes,
      "Score: " + score
    ];

    if (sessionAttempt > 1) {
      lines.push("Variant " + sessionAttempt);
    }

    lines.push("");
    puzzle.rounds.forEach(function (round, index) {
      lines.push("Round " + (index + 1) + ": " + round.name);
    });

    return lines.join("\n");
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
      return {
        dateKey: todayKey,
        puzzleNumber: puzzleNumber,
        sessionAttempt: sessionAttempt,
        phase: state.phase,
        roundIndex: state.roundIndex,
        answerIndex: puzzle.rounds[state.roundIndex] ? puzzle.rounds[state.roundIndex].answerIndex : null,
        breakSignature: puzzle.rounds[state.roundIndex] ? puzzle.rounds[state.roundIndex].breakSignature : null,
        totalMistakes: state.totalMistakes,
        elapsedMs: getElapsedMs(),
        timerRunning: Boolean(timerId),
        boardVisible: !gameArea.hidden,
        validation: Puzzles.validatePuzzle(puzzle),
        roundIds: puzzle.rounds.map(function (round) {
          return round.id;
        }),
        roundNames: puzzle.rounds.map(function (round) {
          return round.name;
        }),
        breakSignatures: puzzle.rounds.map(function (round) {
          return round.breakSignature;
        }),
        rounds: state.rounds.map(function (roundState) {
          return {
            solved: roundState.solved,
            mistakes: roundState.mistakes
          };
        })
      };
    }
  };
}());
