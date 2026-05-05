(function () {
  "use strict";

  var Puzzles = window.OneWrongMovePuzzles;
  var Symbols = window.OWM_SYMBOLS || { packs: {}, themePacks: [] };
  var Config = window.OWM_CONFIG || { levelTimeLimitSeconds: 60 };
  var FEEDBACK_STORAGE_KEY = "oneWrongMove.labFeedback.v1";
  var FEEDBACK_VERSION = 1;
  var FEEDBACK_DECISIONS = ["keep", "tweak", "cut", "needsMoreTesting"];
  var FEEDBACK_TAGS = [
    "too easy",
    "too hard",
    "confusing",
    "boring",
    "fun",
    "unfair",
    "ambiguous target",
    "unclear instructions",
    "symbol unclear",
    "too much trivia",
    "too much arithmetic",
    "visually noisy",
    "visually excellent",
    "satisfying",
    "needs better example",
    "answer felt arbitrary",
    "great for Ladder",
    "great for Free Play",
    "lab only"
  ];
  var RATING_FIELDS = ["fun", "difficultyFelt", "clarity", "fairness"];
  var FEEDBACK_SCHEMA = {
    id: "string",
    createdAt: "ISO datetime",
    updatedAt: "ISO datetime",
    puzzleId: "string",
    puzzleName: "string",
    sourceWorld: "string",
    answerMode: "identifyOne | chooseOne | multiSelect | twoStep",
    targetType: "cell | row | column | outputCell | twoStep | multiSelect",
    difficulty: "number",
    seed: "string",
    sessionAttempt: "number",
    levelNumber: "number",
    breakSignature: "string",
    modeContext: "explore | reviewQueue | ladderStream | freePlaySet | directLink",
    result: "not-played | solved | wrong | answer-shown",
    solvedBlind: "boolean",
    timeToSolveMs: "number",
    wrongAttempts: "number",
    rating: "fun/difficultyFelt/clarity/fairness, each 1-5",
    decision: "keep | tweak | cut | needsMoreTesting",
    tags: "array of controlled tag strings",
    notes: "string",
    confusionReason: "string",
    suggestedChange: "string"
  };
  var DEFAULT_QUEUE_MODE = "all-active";
  var playStates = {};
  var activeQueueMode = DEFAULT_QUEUE_MODE;

  var seedInput = document.getElementById("labSeed");
  var attemptInput = document.getElementById("labAttempt");
  var limitInput = document.getElementById("labLimit");
  var filterInput = document.getElementById("labFilter");
  var searchInput = document.getElementById("labSearch");
  var sourceFilterInput = document.getElementById("labSourceFilter");
  var modeFilterInput = document.getElementById("labModeFilter");
  var targetFilterInput = document.getElementById("labTargetFilter");
  var statusFilterInput = document.getElementById("labStatusFilter");
  var reviewFilterInput = document.getElementById("labReviewFilter");
  var decisionFilterInput = document.getElementById("labDecisionFilter");
  var tagFilterInput = document.getElementById("labTagFilter");
  var sortInput = document.getElementById("labSort");
  var regenerateButton = document.getElementById("labRegenerate");
  var labSurvival = document.getElementById("labSurvival");
  var labFreePlay = document.getElementById("labFreePlay");
  var labSymbols = document.getElementById("labSymbols");
  var labThemes = document.getElementById("labThemes");
  var labList = document.getElementById("labList");
  var labReviewQueue = document.getElementById("labReviewQueue");
  var labFeedbackSummary = document.getElementById("labFeedbackSummary");
  var labExport = document.getElementById("labExport");

  if (!Puzzles) {
    document.body.innerHTML = "<main class=\"lab-shell\"><p>One Wrong Move puzzle engine did not load.</p></main>";
    return;
  }

  applyDirectLinkParams();
  populateFilterOptions();
  bindEvents();
  renderLab();

  function bindEvents() {
    [
      seedInput,
      attemptInput,
      limitInput,
      filterInput,
      searchInput,
      sourceFilterInput,
      modeFilterInput,
      targetFilterInput,
      statusFilterInput,
      reviewFilterInput,
      decisionFilterInput,
      tagFilterInput,
      sortInput
    ].forEach(function (input) {
      if (input) {
        input.addEventListener("change", renderLab);
        input.addEventListener("input", debounce(renderLab, 150));
      }
    });

    regenerateButton.addEventListener("click", function () {
      var current = Math.max(1, Number(attemptInput.value) || 1);

      attemptInput.value = String(current + 1);
      renderLab();
    });

    document.querySelectorAll("[data-review-preset]").forEach(function (button) {
      button.addEventListener("click", function () {
        activeQueueMode = button.dataset.reviewPreset || DEFAULT_QUEUE_MODE;
        if (activeQueueMode === "unreviewed") {
          reviewFilterInput.value = "unreviewed";
        }
        if (activeQueueMode === "hard") {
          sortInput.value = "difficulty";
        }
        if (activeQueueMode === "confusing") {
          tagFilterInput.value = "confusing";
        }
        renderLab();
        labReviewQueue.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function populateFilterOptions() {
    var sources = uniqueSorted(Puzzles.puzzleTypes.map(function (type) {
      return type.sourceWorld || "Unknown";
    }));
    var targets = uniqueSorted(Puzzles.puzzleTypes.map(function (type) {
      return sampleTargetTypeForType(type);
    }));

    fillSelect(sourceFilterInput, sources, "Any source");
    fillSelect(targetFilterInput, targets, "Any target");
    fillSelect(tagFilterInput, FEEDBACK_TAGS, "Any tag");
  }

  function fillSelect(select, values, defaultLabel) {
    var current = select.value;

    select.innerHTML = "<option value=\"\">" + escapeHtml(defaultLabel) + "</option>" + values.map(function (value) {
      return "<option value=\"" + escapeHtml(value) + "\">" + escapeHtml(labelForValue(value)) + "</option>";
    }).join("");
    select.value = current;
  }

  function applyDirectLinkParams() {
    var params = new URLSearchParams(window.location.search);
    var seed = params.get("seed");
    var attempt = params.get("attempt");
    var focus = params.get("type") || params.get("focus");
    var filter = params.get("filter");

    if (seed) {
      seedInput.value = seed;
    }
    if (attempt) {
      attemptInput.value = String(Math.max(1, Number(attempt) || 1));
    }
    if (filter) {
      filterInput.value = filter;
    }
    if (focus) {
      searchInput.value = focus;
      activeQueueMode = "direct";
    }
  }

  function renderLab() {
    var seed = seedInput.value.trim() || Puzzles.getLocalDateKey(new Date());
    var attempt = Math.max(1, Number(attemptInput.value) || 1);
    var limit = Config.validateLevelTimeLimit ? Config.validateLevelTimeLimit(limitInput.value) : 60;
    var showAnswers = shouldAutoShowAnswers();
    var allTypes = Puzzles.puzzleTypes.slice();
    var filteredTypes = sortTypes(allTypes.filter(function (type) {
      return typeMatchesFilters(type);
    }));
    var activeTypes = filteredTypes.filter(function (type) {
      return !type.retired;
    });
    var retiredTypes = filteredTypes.filter(function (type) {
      return type.retired;
    });

    attemptInput.value = String(attempt);
    limitInput.value = String(limit);
    renderSurvivalPreview(seed, attempt, limit);
    renderFreePlayPreview(seed, attempt);
    renderSymbolPacks();
    renderThemePacks();
    renderReviewQueue(seed, attempt, limit);
    renderFeedbackSummary();
    renderExportSection();
    labList.innerHTML = "";

    renderSection("Production puzzle types", activeTypes, seed, attempt, showAnswers, "explore");
    renderSection("Retired / lab-only puzzle types", retiredTypes, seed, attempt, showAnswers, "explore");
  }

  function shouldAutoShowAnswers() {
    var params = new URLSearchParams(window.location.search);

    return params.get("showAnswers") === "1" || params.get("showAnswer") === "1";
  }

  function typeMatchesFilters(type) {
    var search = (searchInput.value || "").trim().toLowerCase();
    var classicFilter = filterInput.value || "";
    var source = sourceFilterInput.value || "";
    var answerMode = modeFilterInput.value || "";
    var targetType = targetFilterInput.value || "";
    var status = statusFilterInput.value || "";
    var review = reviewFilterInput.value || "";
    var decision = decisionFilterInput.value || "";
    var tag = tagFilterInput.value || "";
    var stats = feedbackStatsForType(type.id);
    var directFocus = new URLSearchParams(window.location.search).get("type") || new URLSearchParams(window.location.search).get("focus") || "";

    if (search && (type.id + " " + type.name + " " + type.sourceWorld).toLowerCase().indexOf(search) === -1) {
      return false;
    }
    if (directFocus && type.id !== directFocus && type.name.toLowerCase().indexOf(directFocus.toLowerCase()) === -1) {
      return false;
    }
    if (classicFilter && !typeMatchesClassicFilter(type, classicFilter)) {
      return false;
    }
    if (source && type.sourceWorld !== source) {
      return false;
    }
    if (answerMode && type.answerMode !== answerMode) {
      return false;
    }
    if (targetType && sampleTargetTypeForType(type) !== targetType) {
      return false;
    }
    if (status === "active" && type.retired) {
      return false;
    }
    if (status === "retired" && !type.retired) {
      return false;
    }
    if (status === "ladder" && !isLadderEligible(type)) {
      return false;
    }
    if (status === "freeplay" && !isFreePlayEligible(type)) {
      return false;
    }
    if (review === "reviewed" && stats.reviews === 0) {
      return false;
    }
    if (review === "unreviewed" && stats.reviews > 0) {
      return false;
    }
    if (decision && stats.decisions[decision] <= 0) {
      return false;
    }
    if (tag && stats.tags.indexOf(tag) === -1) {
      return false;
    }
    return true;
  }

  function typeMatchesClassicFilter(type, filter) {
    if (filter === "go") {
      return type.sourceWorld === "Go";
    }
    if (filter === "othello") {
      return type.sourceWorld === "Othello";
    }
    if (filter === "sudoku") {
      return type.sourceWorld === "Sudoku";
    }
    if (filter === "minesweeper") {
      return type.sourceWorld === "Minesweeper";
    }
    if (filter === "number") {
      return ["Sudoku", "Minesweeper", "Dice", "Logic", "Yahtzee"].indexOf(type.sourceWorld) !== -1 || type.sourceWorld === "Logic Grid";
    }
    if (filter === "multi") {
      return type.answerMode === "multiSelect";
    }
    return true;
  }

  function sortTypes(types) {
    var sort = sortInput.value || "name";

    return types.slice().sort(function (a, b) {
      var aStats = feedbackStatsForType(a.id);
      var bStats = feedbackStatsForType(b.id);

      if (sort === "difficulty") {
        return (a.difficulty || 0) - (b.difficulty || 0) || a.name.localeCompare(b.name);
      }
      if (sort === "fun") {
        return bStats.average.fun - aStats.average.fun || a.name.localeCompare(b.name);
      }
      if (sort === "clarity") {
        return bStats.average.clarity - aStats.average.clarity || a.name.localeCompare(b.name);
      }
      if (sort === "reviews") {
        return bStats.reviews - aStats.reviews || a.name.localeCompare(b.name);
      }
      if (sort === "newest") {
        return (bStats.latestTime || 0) - (aStats.latestTime || 0) || a.name.localeCompare(b.name);
      }
      if (sort === "source") {
        return String(a.sourceWorld).localeCompare(String(b.sourceWorld)) || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }

  function renderSurvivalPreview(seed, attempt, limit) {
    var stream = Puzzles.generateSurvivalLevels(seed, attempt, [], 20);

    labSurvival.innerHTML =
      "<h3 class=\"lab-section-title\">Ladder stream preview</h3>" +
      "<p class=\"lab-briefing\">First 20 generated levels for this seed. Limit: " + escapeHtml(limit) + "s/level.</p>" +
      "<div class=\"lab-stream-list\">" + stream.levels.map(function (level) {
        return "<span class=\"stream-chip\">" + level.levelNumber + ". " + escapeHtml(level.name) + " · " + escapeHtml(level.sourceWorld) + " · " + escapeHtml(level.answerMode) + "</span>";
      }).join("") + "</div>";
  }

  function renderFreePlayPreview(seed, attempt) {
    var set = Puzzles.generateFreePlaySet(seed, attempt, []);

    labFreePlay.innerHTML =
      "<h3 class=\"lab-section-title\">Three-Set Free Play preview</h3>" +
      "<p class=\"lab-briefing\">Three puzzles. Wrong attempts add mistakes. Score = ceil(active seconds) + mistakes × 10s.</p>" +
      "<div class=\"lab-stream-list\">" + set.levels.map(function (level) {
        return "<span class=\"stream-chip\">" + level.levelNumber + ". " + escapeHtml(level.name) + " · " + escapeHtml(level.sourceWorld) + " · " + escapeHtml(level.answerMode) + " · " + escapeHtml((level.targeting && level.targeting.targetType) || "cell") + "</span>";
      }).join("") + "</div>";
  }

  function renderSymbolPacks() {
    var packs = ["go", "othello", "sudoku", "minesweeper", "animals", "food", "kitchen", "music", "sky", "sports", "workshop", "household"];

    labSymbols.innerHTML =
      "<h3 class=\"lab-section-title\">Symbol packs</h3>" +
      "<p class=\"lab-briefing\">Curated local glyphs with readable labels. Internal IDs can be short; player-facing symbols stay visual and named.</p>" +
      "<div class=\"lab-pack-grid\">" + packs.map(function (packName) {
        var symbols = (Symbols.packs && Symbols.packs[packName]) || [];

        return "<article class=\"lab-pack-card\">" +
          "<h4>" + escapeHtml(packName.replace(/-/g, " ")) + "</h4>" +
          "<div class=\"symbol-chips\">" + symbols.slice(0, 12).map(renderSymbolChipHtml).join("") + "</div>" +
        "</article>";
      }).join("") + "</div>";
  }

  function renderThemePacks() {
    labThemes.innerHTML =
      "<h3 class=\"lab-section-title\">Theme packs</h3>" +
      "<p class=\"lab-briefing\">Theme rows power object imposter, swap, recipe, and rack-completion puzzles.</p>" +
      "<div class=\"lab-pack-grid\">" + (Symbols.themePacks || []).map(function (pack) {
        return "<article class=\"lab-pack-card\">" +
          "<p class=\"round-name\">" + escapeHtml(pack.sourceWorld) + " · " + escapeHtml(pack.availability || "Lab") + "</p>" +
          "<h4>" + escapeHtml(pack.name) + "</h4>" +
          "<div class=\"symbol-chips\">" + pack.items.slice(0, 5).map(renderSymbolChipHtml).join("") + "</div>" +
        "</article>";
      }).join("") + "</div>";
  }

  function renderReviewQueue(seed, attempt, limit) {
    var queue = buildReviewQueue(seed, attempt, limit);

    labReviewQueue.innerHTML =
      "<div class=\"lab-section-header\">" +
        "<div><p class=\"round-name\">Review Queue</p><h2 class=\"lab-section-title\">" + escapeHtml(labelForQueue(activeQueueMode)) + "</h2></div>" +
        "<p class=\"lab-briefing\">Play samples blind, reveal answers, regenerate variants, and rate what should be kept, tuned, or cut.</p>" +
      "</div>" +
      "<div class=\"lab-queue-toolbar\">" +
        "<label><span>Queue</span><select id=\"labQueueMode\">" +
          "<option value=\"all-active\">All active puzzle types</option>" +
          "<option value=\"ladder\">Ladder first 20 levels</option>" +
          "<option value=\"freeplay\">Free Play 3-set</option>" +
          "<option value=\"unreviewed\">Only unrated puzzle types</option>" +
          "<option value=\"needsMoreTesting\">Needs more testing</option>" +
        "</select></label>" +
        "<button id=\"labBuildQueue\" class=\"secondary-button\" type=\"button\">Build Queue</button>" +
      "</div>" +
      "<div class=\"lab-card-grid lab-review-cards\"></div>";

    labReviewQueue.querySelector("#labQueueMode").value = queue.mode;
    labReviewQueue.querySelector("#labQueueMode").addEventListener("change", function (event) {
      activeQueueMode = event.currentTarget.value;
    });
    labReviewQueue.querySelector("#labBuildQueue").addEventListener("click", function () {
      activeQueueMode = labReviewQueue.querySelector("#labQueueMode").value;
      renderLab();
    });

    var cards = labReviewQueue.querySelector(".lab-review-cards");

    if (queue.rounds.length === 0) {
      cards.innerHTML = "<p class=\"lab-briefing\">No queue items match the current review settings.</p>";
      return;
    }

    queue.rounds.forEach(function (item, index) {
      cards.appendChild(renderRoundCard(item.type, item.round, item.seed || seed, item.attempt || attempt, false, index, "reviewQueue"));
    });
  }

  function buildReviewQueue(seed, attempt, limit) {
    var mode = activeQueueMode || DEFAULT_QUEUE_MODE;
    var rounds = [];

    if (mode === "ladder") {
      rounds = Puzzles.generateSurvivalLevels(seed, attempt, [], 20).levels.map(function (round) {
        return { type: findType(round.id), round: round, seed: seed, attempt: attempt };
      }).filter(function (item) {
        return item.type;
      });
    } else if (mode === "freeplay") {
      rounds = Puzzles.generateFreePlaySet(seed, attempt, []).levels.map(function (round) {
        return { type: findType(round.id), round: round, seed: seed, attempt: attempt };
      }).filter(function (item) {
        return item.type;
      });
    } else {
      var types = Puzzles.puzzleTypes.filter(function (type) {
        if (mode === "unreviewed") {
          return !type.retired && feedbackStatsForType(type.id).reviews === 0;
        }
        if (mode === "needsMoreTesting") {
          return feedbackStatsForType(type.id).decisions.needsMoreTesting > 0 || feedbackStatsForType(type.id).tags.indexOf("needs better example") !== -1;
        }
        if (mode === "hard") {
          return !type.retired && (type.difficulty || 0) >= 3;
        }
        if (mode === "confusing") {
          return feedbackStatsForType(type.id).tags.indexOf("confusing") !== -1 || feedbackStatsForType(type.id).tags.indexOf("unclear instructions") !== -1;
        }
        if (mode === "object") {
          return /Objects|Food|Ecology|Relationships/.test(type.sourceWorld || "");
        }
        if (mode === "board") {
          return /Go|Othello|Chess|Checkers|Domino|Cards|Sudoku|Minesweeper/.test(type.sourceWorld || "");
        }
        if (mode === "word") {
          return /Word|Crossword/.test(type.sourceWorld || "");
        }
        if (mode === "number") {
          return /Sudoku|Minesweeper|Dice|Logic|Yahtzee/.test(type.sourceWorld || "");
        }
        if (mode === "direct") {
          return typeMatchesFilters(type);
        }
        return !type.retired;
      }).slice(0, mode === "all-active" ? 8 : 12);

      rounds = types.map(function (type, index) {
        return { type: type, round: generateSampleRound(type, seed, attempt, index), seed: seed, attempt: attempt };
      });
    }

    return { mode: mode, rounds: rounds };
  }

  function renderSection(title, types, seed, attempt, showAnswers, modeContext) {
    var section = document.createElement("section");
    var heading = document.createElement("h3");

    section.className = "lab-section";
    heading.className = "lab-section-title";
    heading.textContent = title + " (" + types.length + ")";
    section.appendChild(heading);

    if (types.length === 0) {
      var empty = document.createElement("p");

      empty.className = "lab-briefing";
      empty.textContent = "No puzzle types match this filter.";
      section.appendChild(empty);
      labList.appendChild(section);
      return;
    }

    var cards = document.createElement("div");

    cards.className = "lab-card-grid";
    types.forEach(function (type, typeIndex) {
      cards.appendChild(renderTypeCard(type, seed, attempt, showAnswers, typeIndex, modeContext));
    });
    section.appendChild(cards);
    labList.appendChild(section);
  }

  function renderTypeCard(type, seed, attempt, showAnswers, typeIndex, modeContext) {
    return renderRoundCard(type, generateSampleRound(type, seed, attempt, typeIndex), seed, attempt, showAnswers, typeIndex, modeContext || "explore");
  }

  function generateSampleRound(type, seed, attempt, typeIndex) {
    var rawRound = type.generate(seed + "|lab|" + type.id + "|" + attempt, typeIndex + 1, attempt, []);

    return Puzzles.normalizeTypeRound ? Puzzles.normalizeTypeRound(type, rawRound, typeIndex + 1) : rawRound;
  }

  function renderRoundCard(type, round, seed, attempt, showAnswers, typeIndex, modeContext) {
    var validation = validateRound(type, round);
    var card = document.createElement("article");
    var answerMode = round.answerMode || type.answerMode || "identifyOne";
    var sampleId = feedbackId(round, seed, attempt, typeIndex, modeContext);
    var latestFeedback = latestFeedbackForId(sampleId) || latestFeedbackForType(type.id);
    var stats = feedbackStatsForType(type.id);

    card.className = "lab-card" + (type.retired ? " is-retired" : "") + (latestFeedback ? " is-reviewed" : "");
    card.dataset.sampleId = sampleId;
    card.innerHTML =
      "<div class=\"lab-card-header\">" +
        "<div>" +
          "<p class=\"round-name\">" + escapeHtml(type.sourceWorld) + " · difficulty " + escapeHtml(type.difficulty) + " · " + escapeHtml(answerMode) + "</p>" +
          "<h3>" + escapeHtml(type.name) + "</h3>" +
          renderBadges(type, latestFeedback, stats) +
        "</div>" +
        "<div class=\"lab-card-actions\">" +
          "<button class=\"secondary-button lab-try-button\" type=\"button\">Try blind</button>" +
          "<button class=\"secondary-button lab-answer-button\" type=\"button\">Show answer</button>" +
        "</div>" +
      "</div>" +
      "<p class=\"lab-briefing\">" + escapeHtml(round.briefing || type.briefing || "") + "</p>" +
      (type.retired ? "<p class=\"lab-retired-note\">" + escapeHtml(type.retiredReason || "Retired from daily play.") + "</p>" : "") +
      "<div class=\"symbol-chips\">" + (round.symbols || type.symbolBank || type.symbols || []).map(renderSymbolChipHtml).join("") + "</div>" +
      "<div class=\"lab-grid grid\" aria-label=\"" + escapeHtml(type.name) + " sample board\"></div>" +
      "<div class=\"lab-play-status\" aria-live=\"polite\">Answer hidden. Use Try blind for a sandbox solve, or Show answer for review.</div>" +
      renderPlayControls(round) +
      "<dl class=\"lab-meta\">" +
        "<div><dt>Status</dt><dd>" + escapeHtml(type.retired ? "Retired / lab only" : "Active production") + " · " + (isLadderEligible(type) ? "Ladder" : "not Ladder") + " · " + (isFreePlayEligible(type) ? "Free Play" : "not Free Play") + "</dd></div>" +
        "<div><dt>Break signature</dt><dd>" + escapeHtml(round.breakSignature) + "</dd></div>" +
        "<div><dt>Target type</dt><dd>" + escapeHtml((round.targeting && round.targeting.targetType) || "cell") + "</dd></div>" +
        "<div><dt>Clickable targets</dt><dd>" + escapeHtml(((round.targeting && round.targeting.clickableIndices) || []).length) + " clickable · " + escapeHtml(((round.targeting && round.targeting.disabledIndices) || []).length) + " disabled</dd></div>" +
        "<div><dt>Broad target</dt><dd>" + escapeHtml(targetSummary(round)) + "</dd></div>" +
        "<div><dt>Evidence</dt><dd>" + escapeHtml(round.evidence) + "</dd></div>" +
        extraMeta(type, round) +
        "<div><dt>Answer</dt><dd class=\"lab-answer-text\">Hidden</dd></div>" +
        "<div><dt>Validator</dt><dd>" + (validation.valid ? "valid" : "invalid") + " · " + escapeHtml((validation.answers || []).join(", ")) + "</dd></div>" +
      "</dl>" +
      "<div class=\"lab-direct-link\"><button type=\"button\" class=\"secondary-button lab-direct-link-button\">Copy direct link</button><button type=\"button\" class=\"secondary-button lab-variant-button\">Regenerate variant</button></div>" +
      renderRatingPanel(round, type, sampleId, latestFeedback);

    renderBoard(card.querySelector(".lab-grid"), round.board, round.columns || Puzzles.GRID_SIZE, false);
    wireCard(card, type, round, seed, attempt, typeIndex, modeContext, sampleId);

    if (showAnswers) {
      window.setTimeout(function () {
        toggleAnswer(card, round, card.querySelector(".lab-answer-button"), true);
      }, 0);
    }

    return card;
  }

  function renderBadges(type, feedback, stats) {
    var badges = [
      type.retired ? "Retired" : "Active",
      isLadderEligible(type) ? "Ladder" : "Lab only",
      isFreePlayEligible(type) ? "Free Play" : "",
      feedback ? "Reviewed" : "Unreviewed"
    ];

    if (feedback && feedback.decision) {
      badges.push(labelForValue(feedback.decision));
    }

    return "<div class=\"lab-badges\">" + badges.filter(Boolean).map(function (badge) {
      var safe = badge.toLowerCase().replace(/\s+/g, "-");

      return "<span class=\"lab-badge lab-badge--" + escapeHtml(safe) + "\">" + escapeHtml(badge) + "</span>";
    }).join("") + (stats.reviews ? "<span class=\"lab-badge\">" + stats.reviews + " reviews</span>" : "") + "</div>";
  }

  function renderPlayControls(round) {
    if (round.answerMode === "multiSelect" || round.answerMode === "twoStep") {
      return "<div class=\"lab-play-controls\" hidden>" +
        "<button type=\"button\" class=\"primary-button lab-submit-test-button\">" + escapeHtml(round.submitLabel || "Submit Move") + "</button>" +
        "<button type=\"button\" class=\"secondary-button lab-clear-test-button\">Clear selection</button>" +
      "</div>";
    }
    return "<div class=\"lab-play-controls\" hidden></div>";
  }

  function wireCard(card, type, round, seed, attempt, typeIndex, modeContext, sampleId) {
    card.querySelector(".lab-answer-button").addEventListener("click", function (event) {
      toggleAnswer(card, round, event.currentTarget);
      if (event.currentTarget.textContent === "Hide answer") {
        updatePlayState(sampleId, { result: "answer-shown", solvedBlind: false });
      }
    });
    card.querySelector(".lab-try-button").addEventListener("click", function () {
      startBlindTry(card, round, sampleId);
    });
    card.querySelector(".lab-direct-link-button").addEventListener("click", function () {
      copyDirectLink(round, seed, attempt);
    });
    card.querySelector(".lab-variant-button").addEventListener("click", function () {
      attemptInput.value = String(Math.max(1, Number(attemptInput.value) || 1) + 1);
      renderLab();
    });

    card.querySelectorAll(".lab-feedback-save").forEach(function (button) {
      button.addEventListener("click", function () {
        saveFeedbackRecord(card, type, round, seed, attempt, typeIndex, modeContext, sampleId);
      });
    });
    card.querySelectorAll(".lab-feedback-clear").forEach(function (button) {
      button.addEventListener("click", function () {
        clearFeedbackForSample(sampleId);
        renderLab();
      });
    });
    card.querySelectorAll(".lab-feedback-copy").forEach(function (button) {
      button.addEventListener("click", function () {
        copySampleFeedback(card, type, round, seed, attempt, typeIndex, modeContext, sampleId);
      });
    });

    card.querySelectorAll(".lab-tag-button").forEach(function (button) {
      button.addEventListener("click", function () {
        button.classList.toggle("is-selected");
        button.setAttribute("aria-pressed", button.classList.contains("is-selected") ? "true" : "false");
      });
    });

    card.querySelector(".lab-grid").addEventListener("click", function (event) {
      var cell = event.target.closest(".cell");

      if (!cell || !card.contains(cell) || !playStates[sampleId] || !playStates[sampleId].active) {
        return;
      }
      handleBlindCell(card, round, sampleId, Number(cell.dataset.index));
    });
    card.querySelector(".lab-grid").addEventListener("keydown", function (event) {
      if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("cell")) {
        event.preventDefault();
        event.target.click();
      }
    });

    var submit = card.querySelector(".lab-submit-test-button");
    var clear = card.querySelector(".lab-clear-test-button");

    if (submit) {
      submit.addEventListener("click", function () {
        submitBlindSelection(card, round, sampleId);
      });
    }
    if (clear) {
      clear.addEventListener("click", function () {
        clearBlindSelection(card, sampleId);
      });
    }
  }

  function startBlindTry(card, round, sampleId) {
    var playControls = card.querySelector(".lab-play-controls");
    var status = card.querySelector(".lab-play-status");
    var cells = Array.prototype.slice.call(card.querySelectorAll(".cell"));
    var clickable = candidateIndices(round);

    playStates[sampleId] = {
      active: true,
      startTime: Date.now(),
      wrongAttempts: 0,
      selected: [],
      answerWasShown: card.querySelector(".lab-answer-button").textContent === "Hide answer",
      result: "not-played",
      solvedBlind: false,
      timeToSolveMs: 0
    };

    cells.forEach(function (cell) {
      var index = Number(cell.dataset.index);
      var enabled = clickable.indexOf(index) !== -1;

      cell.disabled = !enabled;
      cell.classList.toggle("is-lab-clickable", enabled);
      cell.classList.remove("is-selected", "is-wrong", "is-correct");
      if (enabled) {
        cell.removeAttribute("aria-disabled");
      } else {
        cell.setAttribute("aria-disabled", "true");
      }
    });
    if (playControls) {
      playControls.hidden = !(round.answerMode === "multiSelect" || round.answerMode === "twoStep");
    }
    status.textContent = instructionForLabTry(round);
  }

  function handleBlindCell(card, round, sampleId, index) {
    var state = playStates[sampleId];

    if (!state || !state.active) {
      return;
    }

    if (round.answerMode === "multiSelect" || round.answerMode === "twoStep") {
      toggleSelection(card, round, sampleId, index);
      return;
    }
    if (isCorrectIndex(round, index)) {
      completeBlindTry(card, round, sampleId, true);
    } else {
      state.wrongAttempts += 1;
      markWrong(card, index);
      card.querySelector(".lab-play-status").textContent = "Wrong attempt recorded. Hint: " + (round.wrongTapHint || "Try the cell that satisfies the rule evidence.");
    }
  }

  function toggleSelection(card, round, sampleId, index) {
    var state = playStates[sampleId];
    var max = round.maxSelections || getAnswerIndices(round).length || 1;
    var found = state.selected.indexOf(index);
    var cell = card.querySelector("[data-index=\"" + index + "\"]");

    if (found !== -1) {
      state.selected.splice(found, 1);
      if (cell) {
        cell.classList.remove("is-selected");
      }
    } else if (state.selected.length < max) {
      state.selected.push(index);
      if (cell) {
        cell.classList.add("is-selected");
      }
    } else {
      card.querySelector(".lab-play-status").textContent = "Selection limit reached. Clear a choice before adding another.";
      return;
    }
    card.querySelector(".lab-play-status").textContent = "Selected " + state.selected.length + " of " + max + ". Submit to test the move.";
  }

  function submitBlindSelection(card, round, sampleId) {
    var state = playStates[sampleId];

    if (!state || !state.active) {
      return;
    }
    if (sameSet(state.selected, getAnswerIndices(round))) {
      completeBlindTry(card, round, sampleId, true);
    } else {
      state.wrongAttempts += 1;
      state.selected.forEach(function (index) {
        markWrong(card, index);
      });
      card.querySelector(".lab-play-status").textContent = "Wrong submitted set recorded. Hint: " + (round.wrongTapHint || "Check the exact target set.");
    }
  }

  function clearBlindSelection(card, sampleId) {
    var state = playStates[sampleId];

    if (state) {
      state.selected = [];
    }
    card.querySelectorAll(".cell").forEach(function (cell) {
      cell.classList.remove("is-selected", "is-wrong");
    });
    card.querySelector(".lab-play-status").textContent = "Selection cleared.";
  }

  function completeBlindTry(card, round, sampleId) {
    var state = playStates[sampleId];

    state.active = false;
    state.result = "solved";
    state.solvedBlind = !state.answerWasShown;
    state.timeToSolveMs = Date.now() - state.startTime;
    getAnswerIndices(round).forEach(function (index) {
      var cell = card.querySelector("[data-index=\"" + index + "\"]");

      if (cell) {
        cell.classList.add("is-correct");
      }
    });
    card.querySelectorAll(".cell").forEach(function (cell) {
      cell.disabled = true;
      cell.classList.remove("is-lab-clickable");
    });
    card.querySelector(".lab-play-status").textContent = "Solved in " + formatMs(state.timeToSolveMs) + " with " + state.wrongAttempts + " wrong attempt" + (state.wrongAttempts === 1 ? "" : "s") + ". Rate this sample below.";
    var controls = card.querySelector(".lab-play-controls");

    if (controls) {
      controls.hidden = true;
    }
  }

  function renderRatingPanel(round, type, sampleId, feedback) {
    var selectedTags = feedback ? feedback.tags || [] : [];
    var rating = feedback && feedback.rating ? feedback.rating : {};

    return "<section class=\"lab-rating-panel\" aria-label=\"Rate " + escapeHtml(type.name) + "\">" +
      "<div class=\"lab-rating-header\">" +
        "<h4>Rate this sample</h4>" +
        "<span class=\"lab-saved-indicator\">" + (feedback ? "Saved " + escapeHtml(formatDate(feedback.updatedAt)) : "Not reviewed") + "</span>" +
      "</div>" +
      "<div class=\"lab-rating-grid\">" +
        renderDecisionSelect(feedback) +
        renderRatingSelect("fun", "Fun", rating.fun, "1 boring", "5 excellent") +
        renderRatingSelect("difficultyFelt", "Difficulty felt", rating.difficultyFelt, "1 trivial", "5 brutal") +
        renderRatingSelect("clarity", "Clarity", rating.clarity, "1 confusing", "5 crystal") +
        renderRatingSelect("fairness", "Fairness", rating.fairness, "1 arbitrary", "5 elegant") +
      "</div>" +
      "<div class=\"lab-tag-list\" aria-label=\"Quick tags\">" + FEEDBACK_TAGS.map(function (tag) {
        var selected = selectedTags.indexOf(tag) !== -1;

        return "<button type=\"button\" class=\"lab-tag-button" + (selected ? " is-selected" : "") + "\" aria-pressed=\"" + (selected ? "true" : "false") + "\" data-tag=\"" + escapeHtml(tag) + "\">" + escapeHtml(labelForValue(tag)) + "</button>";
      }).join("") + "</div>" +
      "<label class=\"lab-textarea-label\"><span>Notes</span><textarea class=\"lab-feedback-notes\" rows=\"2\">" + escapeHtml(feedback ? feedback.notes || "" : "") + "</textarea></label>" +
      "<label class=\"lab-textarea-label\"><span>Why confusing?</span><textarea class=\"lab-feedback-confusion\" rows=\"2\">" + escapeHtml(feedback ? feedback.confusionReason || "" : "") + "</textarea></label>" +
      "<label class=\"lab-textarea-label\"><span>Suggested change</span><textarea class=\"lab-feedback-suggestion\" rows=\"2\">" + escapeHtml(feedback ? feedback.suggestedChange || "" : "") + "</textarea></label>" +
      "<div class=\"lab-feedback-actions\">" +
        "<button type=\"button\" class=\"primary-button lab-feedback-save\">Save feedback</button>" +
        "<button type=\"button\" class=\"secondary-button lab-feedback-clear\">Clear feedback for this sample</button>" +
        "<button type=\"button\" class=\"secondary-button lab-feedback-copy\">Copy feedback</button>" +
      "</div>" +
      "<p class=\"lab-briefing lab-feedback-schema\">Local-only record: " + escapeHtml(type.id) + " · " + escapeHtml((round.targeting && round.targeting.targetType) || "cell") + " · " + escapeHtml(round.breakSignature) + "</p>" +
    "</section>";
  }

  function renderDecisionSelect(feedback) {
    var value = feedback ? feedback.decision || "needsMoreTesting" : "needsMoreTesting";

    return "<label><span>Decision</span><select class=\"lab-feedback-decision\">" + FEEDBACK_DECISIONS.map(function (decision) {
      return "<option value=\"" + escapeHtml(decision) + "\"" + (value === decision ? " selected" : "") + ">" + escapeHtml(labelForValue(decision)) + "</option>";
    }).join("") + "</select></label>";
  }

  function renderRatingSelect(name, label, current, lowLabel, highLabel) {
    var value = Number(current) || 3;

    return "<label><span>" + escapeHtml(label) + "</span><select class=\"lab-rating-input\" data-rating=\"" + escapeHtml(name) + "\">" +
      [1, 2, 3, 4, 5].map(function (number) {
        var text = String(number);

        if (number === 1) {
          text += " · " + lowLabel;
        }
        if (number === 3) {
          text += " · okay";
        }
        if (number === 5) {
          text += " · " + highLabel;
        }
        return "<option value=\"" + number + "\"" + (value === number ? " selected" : "") + ">" + escapeHtml(text) + "</option>";
      }).join("") + "</select></label>";
  }

  function saveFeedbackRecord(card, type, round, seed, attempt, typeIndex, modeContext, sampleId) {
    var existing = latestFeedbackForId(sampleId);
    var now = new Date().toISOString();
    var state = playStates[sampleId] || {};
    var record = {
      id: sampleId,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      puzzleId: round.id || type.id,
      puzzleName: round.name || type.name,
      sourceWorld: round.sourceWorld || type.sourceWorld,
      answerMode: round.answerMode || type.answerMode || "identifyOne",
      targetType: (round.targeting && round.targeting.targetType) || sampleTargetTypeForType(type),
      difficulty: round.difficulty || type.difficulty,
      seed: seed,
      sessionAttempt: Math.max(1, Number(attempt) || 1),
      levelNumber: round.levelNumber || typeIndex + 1,
      breakSignature: round.breakSignature || "",
      modeContext: modeContext || "explore",
      result: state.result || (state.answerWasShown ? "answer-shown" : "not-played"),
      solvedBlind: Boolean(state.solvedBlind),
      timeToSolveMs: Math.max(0, Number(state.timeToSolveMs) || 0),
      wrongAttempts: Math.max(0, Number(state.wrongAttempts) || 0),
      rating: readRatings(card),
      decision: readDecision(card),
      tags: readTags(card),
      notes: card.querySelector(".lab-feedback-notes").value.trim(),
      confusionReason: card.querySelector(".lab-feedback-confusion").value.trim(),
      suggestedChange: card.querySelector(".lab-feedback-suggestion").value.trim()
    };

    upsertFeedback(record);
    card.querySelector(".lab-saved-indicator").textContent = "Saved just now";
    card.classList.add("is-reviewed");
    renderFeedbackSummary();
    renderExportSection();
  }

  function copySampleFeedback(card, type, round, seed, attempt, typeIndex, modeContext, sampleId) {
    var existing = latestFeedbackForId(sampleId);
    var text;

    if (existing) {
      text = markdownForRecord(existing);
    } else {
      saveFeedbackRecord(card, type, round, seed, attempt, typeIndex, modeContext, sampleId);
      text = markdownForRecord(latestFeedbackForId(sampleId));
    }
    copyText(text, "Feedback copied.");
  }

  function readRatings(card) {
    var rating = {};

    card.querySelectorAll(".lab-rating-input").forEach(function (input) {
      var value = Math.max(1, Math.min(5, Number(input.value) || 3));

      rating[input.dataset.rating] = value;
    });
    RATING_FIELDS.forEach(function (field) {
      if (!rating[field]) {
        rating[field] = 3;
      }
    });
    return rating;
  }

  function readDecision(card) {
    var value = card.querySelector(".lab-feedback-decision").value;

    return FEEDBACK_DECISIONS.indexOf(value) === -1 ? "needsMoreTesting" : value;
  }

  function readTags(card) {
    return Array.prototype.slice.call(card.querySelectorAll(".lab-tag-button.is-selected")).map(function (button) {
      return button.dataset.tag;
    }).filter(function (tag) {
      return FEEDBACK_TAGS.indexOf(tag) !== -1;
    });
  }

  function renderFeedbackSummary() {
    var records = feedbackRecords();
    var byPuzzle = aggregateFeedback(records, "puzzleId");
    var bySource = aggregateFeedback(records, "sourceWorld");
    var byMode = aggregateFeedback(records, "answerMode");
    var recommendations = recommendationBuckets(byPuzzle);

    labFeedbackSummary.innerHTML =
      "<div class=\"lab-section-header\">" +
        "<div><p class=\"round-name\">Feedback Summary</p><h2 class=\"lab-section-title\">Local playtest dashboard</h2></div>" +
        "<p class=\"lab-briefing\">" + records.length + " local review" + (records.length === 1 ? "" : "s") + " saved in this browser.</p>" +
      "</div>" +
      renderRecommendationCards(recommendations) +
      "<h3 class=\"lab-section-title\">By puzzle type</h3>" +
      renderSummaryTable(byPuzzle, true) +
      "<div class=\"lab-summary-columns\">" +
        "<section><h3 class=\"lab-section-title\">By source world</h3>" + renderSummaryTable(bySource, false) + "</section>" +
        "<section><h3 class=\"lab-section-title\">By answer mode</h3>" + renderSummaryTable(byMode, false) + "</section>" +
      "</div>";
  }

  function renderRecommendationCards(recommendations) {
    return "<div class=\"lab-recommendations\">" + [
      ["Cut candidates", recommendations.cut],
      ["Too easy", recommendations.tooEasy],
      ["Too hard", recommendations.tooHard],
      ["Keep candidates", recommendations.keep],
      ["Free Play candidates", recommendations.freePlay],
      ["Ladder candidates", recommendations.ladder]
    ].map(function (entry) {
      return "<article class=\"lab-pack-card\"><h4>" + escapeHtml(entry[0]) + "</h4><p>" + escapeHtml(entry[1].join(", ") || "No candidates yet.") + "</p></article>";
    }).join("") + "</div>";
  }

  function renderSummaryTable(rows, includePuzzleMeta) {
    if (rows.length === 0) {
      return "<p class=\"lab-briefing\">No saved feedback yet.</p>";
    }

    return "<div class=\"lab-table-wrap\"><table class=\"lab-summary-table\">" +
      "<thead><tr><th>Puzzle</th>" + (includePuzzleMeta ? "<th>Source</th><th>Mode</th><th>System difficulty</th>" : "") + "<th>Felt</th><th>Fun</th><th>Clarity</th><th>Fairness</th><th>Decision</th><th>Common tags</th><th>Reviews</th></tr></thead>" +
      "<tbody>" + rows.map(function (row) {
        return "<tr>" +
          "<th scope=\"row\">" + escapeHtml(row.label) + "</th>" +
          (includePuzzleMeta ? "<td>" + escapeHtml(row.sourceWorld) + "</td><td>" + escapeHtml(row.answerMode) + "</td><td>" + escapeHtml(row.difficulty) + "</td>" : "") +
          "<td>" + formatAverage(row.average.difficultyFelt) + "</td>" +
          "<td>" + formatAverage(row.average.fun) + "</td>" +
          "<td>" + formatAverage(row.average.clarity) + "</td>" +
          "<td>" + formatAverage(row.average.fairness) + "</td>" +
          "<td>" + escapeHtml(decisionSummary(row.decisions)) + "</td>" +
          "<td>" + escapeHtml(row.tags.slice(0, 4).join(", ")) + "</td>" +
          "<td>" + escapeHtml(row.reviews) + "</td>" +
        "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  function renderExportSection() {
    var records = feedbackRecords();
    var markdown = buildMarkdownSummary(records);
    var prompt = buildChatGptPrompt(records);

    labExport.innerHTML =
      "<div class=\"lab-section-header\">" +
        "<div><p class=\"round-name\">Export</p><h2 class=\"lab-section-title\">Share feedback with Codex</h2></div>" +
        "<p class=\"lab-briefing\">Everything is local-only. Export when you want to bring playtest notes into the next tuning prompt.</p>" +
      "</div>" +
      "<div class=\"lab-export-actions\">" +
        "<button id=\"copyMarkdownButton\" class=\"secondary-button\" type=\"button\">Copy Markdown Summary</button>" +
        "<button id=\"copyPromptButton\" class=\"secondary-button\" type=\"button\">Copy ChatGPT Feedback Prompt</button>" +
        "<button id=\"downloadJsonButton\" class=\"secondary-button\" type=\"button\">Download JSON</button>" +
        "<button id=\"downloadCsvButton\" class=\"secondary-button\" type=\"button\">Download CSV</button>" +
        "<button id=\"clearFeedbackButton\" class=\"secondary-button danger-button\" type=\"button\">Clear all lab feedback</button>" +
      "</div>" +
      "<label class=\"lab-textarea-label\"><span>ChatGPT-ready prompt preview</span><textarea id=\"exportPreview\" rows=\"12\">" + escapeHtml(prompt) + "</textarea></label>";

    labExport.querySelector("#copyMarkdownButton").addEventListener("click", function () {
      copyText(markdown, "Markdown summary copied.");
    });
    labExport.querySelector("#copyPromptButton").addEventListener("click", function () {
      copyText(prompt, "ChatGPT-ready prompt copied.");
    });
    labExport.querySelector("#downloadJsonButton").addEventListener("click", function () {
      downloadFile("one-wrong-move-lab-feedback.json", exportFeedbackJson(records), "application/json");
    });
    labExport.querySelector("#downloadCsvButton").addEventListener("click", function () {
      downloadFile("one-wrong-move-lab-feedback.csv", exportFeedbackCsv(records), "text/csv");
    });
    labExport.querySelector("#clearFeedbackButton").addEventListener("click", clearAllFeedback);
  }

  function exportFeedbackJson(records) {
    return JSON.stringify({
      version: FEEDBACK_VERSION,
      exportedAt: new Date().toISOString(),
      appPuzzleDate: seedInput.value.trim(),
      records: records,
      summaryByPuzzleType: aggregateFeedback(records, "puzzleId"),
      schema: FEEDBACK_SCHEMA
    }, null, 2);
  }

  function exportFeedbackCsv(records) {
    var headers = [
      "id",
      "createdAt",
      "updatedAt",
      "puzzleId",
      "puzzleName",
      "sourceWorld",
      "answerMode",
      "targetType",
      "difficulty",
      "seed",
      "sessionAttempt",
      "levelNumber",
      "breakSignature",
      "modeContext",
      "result",
      "solvedBlind",
      "timeToSolveMs",
      "wrongAttempts",
      "fun",
      "difficultyFelt",
      "clarity",
      "fairness",
      "decision",
      "tags",
      "notes",
      "confusionReason",
      "suggestedChange"
    ];

    return [headers.join(",")].concat(records.map(function (record) {
      return headers.map(function (header) {
        var value = record[header];

        if (header === "tags") {
          value = (record.tags || []).join("|");
        }
        if (record.rating && Object.prototype.hasOwnProperty.call(record.rating, header)) {
          value = record.rating[header];
        }
        return csvCell(value);
      }).join(",");
    })).join("\n");
  }

  function buildMarkdownSummary(records) {
    var byPuzzle = aggregateFeedback(records, "puzzleId");
    var groups = {
      Keep: byPuzzle.filter(function (row) { return row.decisions.keep > 0; }),
      Tweak: byPuzzle.filter(function (row) { return row.decisions.tweak > 0 || row.decisions.needsMoreTesting > 0; }),
      Cut: byPuzzle.filter(function (row) { return row.decisions.cut > 0; }),
      "Too easy": byPuzzle.filter(function (row) { return row.tags.indexOf("too easy") !== -1; }),
      "Too hard": byPuzzle.filter(function (row) { return row.tags.indexOf("too hard") !== -1; }),
      Confusing: byPuzzle.filter(function (row) { return row.tags.indexOf("confusing") !== -1 || row.tags.indexOf("unclear instructions") !== -1; }),
      "Best puzzles": byPuzzle.filter(function (row) { return row.average.fun >= 4 && row.average.fairness >= 4; }),
      "Worst puzzles": byPuzzle.filter(function (row) { return row.average.fun <= 2 || row.average.clarity <= 2; })
    };

    return "# One Wrong Move Lab Feedback\n\n" + Object.keys(groups).map(function (heading) {
      return "## " + heading + "\n" + (groups[heading].length ? groups[heading].map(markdownForSummaryRow).join("\n") : "- None yet.");
    }).join("\n\n") + "\n";
  }

  function buildChatGptPrompt(records) {
    return "Here is my One Wrong Move lab feedback.\n\n" + buildMarkdownSummary(records) + "\nPlease propose the next Codex prompt to tune the puzzle pool.";
  }

  function markdownForSummaryRow(row) {
    return "- " + row.label + ": fun " + formatAverage(row.average.fun) + ", clarity " + formatAverage(row.average.clarity) + ", fairness " + formatAverage(row.average.fairness) + ". Tags: " + (row.tags.join(", ") || "none") + ". Latest note: " + (row.latestNote || "none");
  }

  function markdownForRecord(record) {
    return "- " + record.puzzleName + " (" + record.sourceWorld + "): " +
      "decision " + labelForValue(record.decision) +
      ", fun " + record.rating.fun +
      ", difficulty " + record.rating.difficultyFelt +
      ", clarity " + record.rating.clarity +
      ", fairness " + record.rating.fairness +
      ". Tags: " + ((record.tags || []).join(", ") || "none") +
      ". Notes: " + (record.notes || "none");
  }

  function aggregateFeedback(records, key) {
    var map = {};

    records.forEach(function (record) {
      var id = record[key] || "Unknown";
      var row = map[id];

      if (!row) {
        row = {
          id: id,
          label: key === "puzzleId" ? record.puzzleName : id,
          sourceWorld: record.sourceWorld || "",
          answerMode: record.answerMode || "",
          difficulty: record.difficulty || "",
          reviews: 0,
          sum: { fun: 0, difficultyFelt: 0, clarity: 0, fairness: 0 },
          average: { fun: 0, difficultyFelt: 0, clarity: 0, fairness: 0 },
          decisions: { keep: 0, tweak: 0, cut: 0, needsMoreTesting: 0 },
          tagCounts: {},
          tags: [],
          latestNote: "",
          latestTime: 0
        };
        map[id] = row;
      }
      row.reviews += 1;
      RATING_FIELDS.forEach(function (field) {
        row.sum[field] += Number(record.rating && record.rating[field]) || 0;
      });
      if (row.decisions[record.decision] !== undefined) {
        row.decisions[record.decision] += 1;
      }
      (record.tags || []).forEach(function (tag) {
        row.tagCounts[tag] = (row.tagCounts[tag] || 0) + 1;
      });
      if (Date.parse(record.updatedAt) >= row.latestTime) {
        row.latestTime = Date.parse(record.updatedAt);
        row.latestNote = record.notes || record.confusionReason || record.suggestedChange || "";
      }
    });

    return Object.keys(map).map(function (id) {
      var row = map[id];

      RATING_FIELDS.forEach(function (field) {
        row.average[field] = row.reviews ? row.sum[field] / row.reviews : 0;
      });
      row.tags = Object.keys(row.tagCounts).sort(function (a, b) {
        return row.tagCounts[b] - row.tagCounts[a] || a.localeCompare(b);
      });
      return row;
    }).sort(function (a, b) {
      return b.reviews - a.reviews || a.label.localeCompare(b.label);
    });
  }

  function recommendationBuckets(rows) {
    return {
      cut: rows.filter(function (row) {
        return row.decisions.cut > 0 || (row.average.fun <= 2 && row.average.clarity <= 2);
      }).map(function (row) { return row.label; }),
      tooEasy: rows.filter(function (row) {
        return row.average.difficultyFelt <= 2 && (row.average.fun <= 3 || row.tags.indexOf("too easy") !== -1);
      }).map(function (row) { return row.label; }),
      tooHard: rows.filter(function (row) {
        return row.average.difficultyFelt >= 4.5 && row.average.clarity <= 3;
      }).map(function (row) { return row.label; }),
      keep: rows.filter(function (row) {
        return row.average.fun >= 4 && row.average.fairness >= 4 && row.decisions.cut === 0;
      }).map(function (row) { return row.label; }),
      freePlay: rows.filter(function (row) {
        return row.average.difficultyFelt <= 3.5 && row.average.clarity >= 4;
      }).map(function (row) { return row.label; }),
      ladder: rows.filter(function (row) {
        return row.average.difficultyFelt >= 2.5 && row.average.fairness >= 4 && row.tags.indexOf("ambiguous target") === -1;
      }).map(function (row) { return row.label; })
    };
  }

  function extraMeta(type, round) {
    if (type.sourceWorld === "Sudoku") {
      return "<div><dt>Sudoku checks</dt><dd>4x4 rows, columns, and 2x2 boxes. Repair count: " + escapeHtml(round.sudokuRepairCount || 1) + ".</dd></div>";
    }

    if (type.sourceWorld === "Minesweeper") {
      return "<div><dt>Minesweeper layouts</dt><dd>" + escapeHtml(round.mineLayoutCount || 0) + " valid layouts · " + escapeHtml(round.candidateMineCount || 0) + " hidden candidates · " + escapeHtml(round.clueCount || 0) + " clues.</dd></div>";
    }

    if (type.id === "logic-gate-row") {
      return "<div><dt>Logic target</dt><dd>Output-only sample; inputs, gate, and equals are disabled.</dd></div>";
    }

    if (type.id === "chess-attack") {
      var pieces = round.board.filter(function (cell) {
        return cell.value && cell.value.piece;
      });
      var counts = {};

      pieces.forEach(function (cell) {
        counts[cell.value.piece] = (counts[cell.value.piece] || 0) + 1;
      });
      return "<div><dt>Pieces</dt><dd>" + pieces.length + " numbered · " + escapeHtml(Object.keys(counts).map(function (piece) {
        return piece + ": " + counts[piece];
      }).join(", ")) + "</dd></div>";
    }

    if (type.id === "go-capture-max" && round.choiceScores) {
      return "<div><dt>Capture scores</dt><dd>" + escapeHtml(round.choiceScores.filter(function (score) {
        return score.score > 0;
      }).map(function (score) {
        return "cell " + (score.index + 1) + ": " + score.score;
      }).join(", ")) + "</dd></div>";
    }

    if (type.id === "go-liberties") {
      return "<div><dt>Liberties</dt><dd>" + escapeHtml(getAnswerIndices(round).map(function (index) {
        return "cell " + (index + 1);
      }).join(", ")) + "</dd></div>";
    }

    if (type.sourceWorld === "Othello") {
      var othelloMeta = "";

      if (round.choiceScores) {
        othelloMeta = round.choiceScores.filter(function (score) {
          return score.score > 0;
        }).map(function (score) {
          return "cell " + (score.index + 1) + ": " + score.score;
        }).join(", ");
      } else {
        othelloMeta = getAnswerIndices(round).map(function (index) {
          return "cell " + (index + 1);
        }).join(", ");
      }
      return "<div><dt>Othello</dt><dd>" + escapeHtml(othelloMeta) + "</dd></div>";
    }

    if (round.answerMode === "twoStep") {
      return "<div><dt>Steps</dt><dd>" + escapeHtml((round.answerSteps || []).map(function (step) {
        return step.role + ": cell " + (step.index + 1);
      }).join(", ")) + "</dd></div>";
    }

    return "";
  }

  function targetSummary(round) {
    var targeting = round.targeting || {};

    if (targeting.acceptsAnyCellInAnswerRow) {
      return "Any cell in row " + (targeting.answerRow + 1) + " is accepted.";
    }
    if (targeting.acceptsAnyCellInAnswerColumn) {
      return "Any cell in column " + (targeting.answerColumn + 1) + " is accepted.";
    }
    return "Answer cells: " + getAnswerIndices(round).map(function (index) {
      return index + 1;
    }).join(", ");
  }

  function renderBoard(container, board, columns, interactive) {
    container.innerHTML = "";
    container.style.gridTemplateColumns = "repeat(" + (columns || Puzzles.GRID_SIZE) + ", minmax(0, 1fr))";
    container.dataset.columns = String(columns || Puzzles.GRID_SIZE);
    board.forEach(function (cellData, index) {
      var cell = document.createElement("button");

      cell.type = "button";
      cell.disabled = !interactive;
      if (!interactive) {
        cell.setAttribute("aria-disabled", "true");
      }
      cell.className = getCellClassName(cellData);
      cell.dataset.index = String(index);
      cell.setAttribute("aria-label", cellData.ariaLabel || cellData.label || "empty square");
      renderCellContents(cell, cellData);
      container.appendChild(cell);
    });
  }

  function toggleAnswer(card, round, button, forceShow) {
    var answerIndices = getAnswerIndices(round);
    var answerText = card.querySelector(".lab-answer-text");
    var firstAnswerCell = card.querySelector("[data-index=\"" + answerIndices[0] + "\"]");
    var showing = typeof forceShow === "boolean" ? forceShow : (firstAnswerCell ? !firstAnswerCell.classList.contains("is-correct") : false);

    answerIndices.forEach(function (answerIndex) {
      var answerCell = card.querySelector("[data-index=\"" + answerIndex + "\"]");

      if (answerCell) {
        answerCell.classList.toggle("is-correct", showing);
        toggleRevealGlyph(answerCell, round.board[answerIndex], showing);
      }
    });

    (round.relatedIndexes || []).forEach(function (relatedIndex) {
      var relatedCell = card.querySelector("[data-index=\"" + relatedIndex + "\"]");

      if (relatedCell) {
        relatedCell.classList.toggle("is-related", showing);
      }
    });

    button.textContent = showing ? "Hide answer" : "Show answer";
    answerText.textContent = showing ? answerSummary(round, answerIndices) : "Hidden";
    card.querySelector(".lab-play-status").textContent = showing ? round.explanation : "Answer hidden. Use Try blind for a sandbox solve, or Show answer for review.";
  }

  function toggleRevealGlyph(answerCell, cellData, showing) {
    var main = answerCell.querySelector(".cell-main");

    if (!main || !cellData || !cellData.answerRevealGlyph) {
      return;
    }
    main.textContent = showing ? cellData.answerRevealGlyph : (cellData.glyph || cellData.label || "");
  }

  function answerSummary(round, answerIndices) {
    var label = round.answerMode === "multiSelect" || round.answerMode === "twoStep" ? "Cells " : "Cell ";
    var numbers = answerIndices.map(function (index) {
      return index + 1;
    }).join(", ");

    return label + numbers + ": " + round.explanation;
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

  function getCellClassName(cellData) {
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

    return classNames.join(" ");
  }

  function getAnswerIndices(round) {
    if (Array.isArray(round.answerIndices) && round.answerIndices.length > 0) {
      return round.answerIndices.slice().sort(function (a, b) {
        return a - b;
      });
    }

    if (round.targeting && Array.isArray(round.targeting.answerIndices) && round.targeting.answerIndices.length > 0) {
      return round.targeting.answerIndices.slice().sort(function (a, b) {
        return a - b;
      });
    }

    if (Array.isArray(round.answerSteps) && round.answerSteps.length > 0) {
      return round.answerSteps.map(function (step) {
        return step.index;
      }).sort(function (a, b) {
        return a - b;
      });
    }

    return typeof round.answerIndex === "number" ? [round.answerIndex] : [];
  }

  function candidateIndices(round) {
    if (round.targeting && Array.isArray(round.targeting.clickableIndices) && round.targeting.clickableIndices.length > 0) {
      return round.targeting.clickableIndices.slice();
    }
    return round.board.map(function (cell, index) {
      return cell.interactive || cell.selectable ? index : -1;
    }).filter(function (index) {
      return index >= 0;
    });
  }

  function isCorrectIndex(round, index) {
    var targeting = round.targeting || {};

    if (targeting.acceptsAnyCellInAnswerRow && targeting.answerRow !== null && targeting.answerRow !== undefined) {
      return Math.floor(index / (round.columns || Puzzles.GRID_SIZE)) === targeting.answerRow;
    }
    if (targeting.acceptsAnyCellInAnswerColumn && targeting.answerColumn !== null && targeting.answerColumn !== undefined) {
      return index % (round.columns || Puzzles.GRID_SIZE) === targeting.answerColumn;
    }
    return getAnswerIndices(round).indexOf(index) !== -1;
  }

  function sameSet(a, b) {
    var left = uniqueSorted(a);
    var right = uniqueSorted(b);

    return left.length === right.length && left.every(function (value, index) {
      return value === right[index];
    });
  }

  function markWrong(card, index) {
    var cell = card.querySelector("[data-index=\"" + index + "\"]");

    if (cell) {
      cell.classList.add("is-wrong");
      window.setTimeout(function () {
        cell.classList.remove("is-wrong");
      }, 700);
    }
  }

  function instructionForLabTry(round) {
    if (round.answerMode === "multiSelect") {
      return "Blind test started. Select the exact cells, then submit.";
    }
    if (round.answerMode === "twoStep") {
      return "Blind test started. Make the planned two-step move, then submit.";
    }
    return "Blind test started. Tap one candidate cell.";
  }

  function renderSymbolChipHtml(symbol) {
    var data = normalizeSymbolDisplay(symbol);

    return "<span class=\"symbol-chip\" aria-label=\"" + escapeHtml(data.ariaLabel) + "\">" +
      "<span class=\"symbol-chip__glyph\">" + escapeHtml(data.glyph) + "</span>" +
      "<span class=\"symbol-chip__label\">" + escapeHtml(data.label) + "</span>" +
    "</span>";
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
      glyph: symbol.glyph || symbol.emoji || symbol.label || "",
      label: symbol.shortLabel || symbol.label || symbol.ariaLabel || symbol.glyph || "",
      ariaLabel: symbol.ariaLabel || symbol.label || symbol.glyph || ""
    };
  }

  function validateRound(type, round) {
    if (type && typeof type.validate === "function") {
      return type.validate(round);
    }
    if (Puzzles.validateRound) {
      return Puzzles.validateRound(round);
    }
    return { valid: true, answers: getAnswerIndices(round) };
  }

  function sampleTargetTypeForType(type) {
    try {
      var round = generateSampleRound(type, seedInput.value || Puzzles.getLocalDateKey(new Date()), Math.max(1, Number(attemptInput.value) || 1), 0);

      return (round.targeting && round.targeting.targetType) || "cell";
    } catch (error) {
      return type.answerMode === "multiSelect" ? "multiSelect" : type.answerMode === "twoStep" ? "twoStep" : "cell";
    }
  }

  function isLadderEligible(type) {
    return !type.retired && type.id !== "maze-exit";
  }

  function isFreePlayEligible(type) {
    return !type.retired && type.id !== "maze-exit" && (type.difficulty || 1) <= 4;
  }

  function findType(id) {
    return Puzzles.puzzleTypes.find(function (type) {
      return type.id === id;
    });
  }

  function feedbackId(round, seed, attempt, levelNumber, modeContext) {
    return [
      round.id,
      seed,
      attempt,
      round.levelNumber || levelNumber + 1,
      modeContext || "explore",
      hashForId(round.breakSignature || "")
    ].join("|");
  }

  function latestFeedbackForId(id) {
    return feedbackRecords().filter(function (record) {
      return record.id === id;
    }).sort(function (a, b) {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    })[0] || null;
  }

  function latestFeedbackForType(puzzleId) {
    return feedbackRecords().filter(function (record) {
      return record.puzzleId === puzzleId;
    }).sort(function (a, b) {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    })[0] || null;
  }

  function feedbackStatsForType(puzzleId) {
    var rows = aggregateFeedback(feedbackRecords().filter(function (record) {
      return record.puzzleId === puzzleId;
    }), "puzzleId");

    return rows[0] || {
      reviews: 0,
      average: { fun: 0, difficultyFelt: 0, clarity: 0, fairness: 0 },
      decisions: { keep: 0, tweak: 0, cut: 0, needsMoreTesting: 0 },
      tags: [],
      latestTime: 0
    };
  }

  function feedbackRecords() {
    return loadFeedbackStore().records;
  }

  function loadFeedbackStore() {
    try {
      var raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : null;

      if (parsed && parsed.version === FEEDBACK_VERSION && Array.isArray(parsed.records)) {
        return parsed;
      }
    } catch (error) {
      window.console.warn("Could not read lab feedback.", error);
    }
    return { version: FEEDBACK_VERSION, records: [] };
  }

  function saveFeedbackStore(store) {
    window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify({
      version: FEEDBACK_VERSION,
      records: store.records
    }));
  }

  function upsertFeedback(record) {
    var store = loadFeedbackStore();
    var index = store.records.findIndex(function (existing) {
      return existing.id === record.id;
    });

    if (index === -1) {
      store.records.push(record);
    } else {
      store.records[index] = record;
    }
    saveFeedbackStore(store);
  }

  function clearFeedbackForSample(sampleId) {
    var store = loadFeedbackStore();

    store.records = store.records.filter(function (record) {
      return record.id !== sampleId;
    });
    saveFeedbackStore(store);
  }

  function clearAllFeedback() {
    if (!window.confirm("Clear all local lab feedback? This only affects this browser.")) {
      return;
    }
    saveFeedbackStore({ version: FEEDBACK_VERSION, records: [] });
    renderLab();
  }

  function copyDirectLink(round, seed, attempt) {
    var url = window.location.origin + window.location.pathname + "?type=" + encodeURIComponent(round.id) + "&seed=" + encodeURIComponent(seed) + "&attempt=" + encodeURIComponent(attempt) + "&showAnswer=0";

    copyText(url, "Direct link copied.");
  }

  function copyText(text, message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(message);
      }).catch(function () {
        showCopyFallback(text);
      });
    } else {
      showCopyFallback(text);
    }
  }

  function showCopyFallback(text) {
    var preview = document.getElementById("exportPreview");

    if (preview) {
      preview.value = text;
      preview.focus();
      preview.select();
    } else {
      window.alert(text);
    }
  }

  function showToast(message) {
    var toast = document.createElement("div");

    toast.className = "lab-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(function () {
      toast.remove();
    }, 1800);
  }

  function downloadFile(filename, contents, mimeType) {
    var blob = new Blob([contents], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    var text = value === null || value === undefined ? "" : String(value);

    return "\"" + text.replace(/"/g, "\"\"") + "\"";
  }

  function labelForQueue(mode) {
    return {
      "all-active": "All active puzzle types",
      ladder: "Ladder first 20 levels",
      freeplay: "Free Play 3-set",
      unreviewed: "Only unrated puzzle types",
      needsMoreTesting: "Needs more testing",
      hard: "Hard puzzle review",
      confusing: "Confusing puzzle review",
      object: "Object/theme puzzle review",
      board: "Board-game puzzle review",
      word: "Word puzzle review",
      number: "Number puzzle review",
      direct: "Direct-link sample"
    }[mode] || "All active puzzle types";
  }

  function decisionSummary(decisions) {
    return Object.keys(decisions).filter(function (key) {
      return decisions[key] > 0;
    }).map(function (key) {
      return labelForValue(key) + " " + decisions[key];
    }).join(", ") || "None";
  }

  function formatAverage(value) {
    return value ? value.toFixed(1) : "—";
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatMs(ms) {
    return (ms / 1000).toFixed(1) + "s";
  }

  function labelForValue(value) {
    return String(value).replace(/([A-Z])/g, " $1").replace(/-/g, " ").replace(/\b\w/g, function (letter) {
      return letter.toUpperCase();
    });
  }

  function uniqueSorted(values) {
    return values.filter(function (value, index, array) {
      return value !== undefined && value !== null && array.indexOf(value) === index;
    }).sort(function (a, b) {
      return String(a).localeCompare(String(b));
    });
  }

  function hashForId(value) {
    return String(Puzzles.hashString ? Puzzles.hashString(String(value)) : String(value).length);
  }

  function debounce(fn, wait) {
    var timeout;

    return function () {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(fn, wait);
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[character];
    });
  }
}());
