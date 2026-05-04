(function () {
  "use strict";

  var Puzzles = window.OneWrongMovePuzzles;
  var Symbols = window.OWM_SYMBOLS || { packs: {}, themePacks: [] };
  var Config = window.OWM_CONFIG || { levelTimeLimitSeconds: 60 };
  var seedInput = document.getElementById("labSeed");
  var attemptInput = document.getElementById("labAttempt");
  var limitInput = document.getElementById("labLimit");
  var filterInput = document.getElementById("labFilter");
  var regenerateButton = document.getElementById("labRegenerate");
  var labSurvival = document.getElementById("labSurvival");
  var labFreePlay = document.getElementById("labFreePlay");
  var labSymbols = document.getElementById("labSymbols");
  var labThemes = document.getElementById("labThemes");
  var labList = document.getElementById("labList");

  regenerateButton.addEventListener("click", renderLab);
  seedInput.addEventListener("change", renderLab);
  attemptInput.addEventListener("change", renderLab);
  limitInput.addEventListener("change", renderLab);
  filterInput.addEventListener("change", renderLab);

  renderLab();

  function renderLab() {
    var seed = seedInput.value.trim() || Puzzles.getLocalDateKey(new Date());
    var attempt = Math.max(1, Number(attemptInput.value) || 1);
    var limit = Config.validateLevelTimeLimit ? Config.validateLevelTimeLimit(limitInput.value) : 60;
    var params = new URLSearchParams(window.location.search);
    var showAnswers = params.get("showAnswers") === "1";
    var focusType = params.get("focus") || "";
    var filter = params.get("filter") || filterInput.value || "";
    var activeTypes = Puzzles.puzzleTypes.filter(function (type) {
      return !type.retired;
    });
    var retiredTypes = Puzzles.puzzleTypes.filter(function (type) {
      return type.retired;
    });

    if (focusType) {
      activeTypes = activeTypes.filter(function (type) {
        return type.id === focusType;
      });
      retiredTypes = retiredTypes.filter(function (type) {
        return type.id === focusType;
      });
    }
    if (filter) {
      activeTypes = activeTypes.filter(function (type) {
        return typeMatchesFilter(type, filter);
      });
      retiredTypes = retiredTypes.filter(function (type) {
        return typeMatchesFilter(type, filter);
      });
    }

    attemptInput.value = String(attempt);
    limitInput.value = String(limit);
    filterInput.value = filter;
    renderSurvivalPreview(seed, attempt, limit);
    renderFreePlayPreview(seed, attempt);
    renderSymbolPacks();
    renderThemePacks();
    labList.innerHTML = "";

    renderSection("Production puzzle types", activeTypes, seed, attempt, showAnswers);
    renderSection("Retired / lab-only puzzle types", retiredTypes, seed, attempt, showAnswers);
  }

  function typeMatchesFilter(type, filter) {
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

  function renderSurvivalPreview(seed, attempt, limit) {
    var stream = Puzzles.generateSurvivalLevels(seed, attempt, [], 20);

    labSurvival.innerHTML =
      "<h2 class=\"lab-section-title\">Ladder stream preview</h2>" +
      "<p class=\"lab-briefing\">First 20 generated levels for this seed. Limit: " + escapeHtml(limit) + "s/level.</p>" +
      "<div class=\"lab-stream-list\">" + stream.levels.map(function (level) {
        return "<span class=\"stream-chip\">" + level.levelNumber + ". " + escapeHtml(level.name) + " · " + escapeHtml(level.sourceWorld) + " · " + escapeHtml(level.answerMode) + "</span>";
      }).join("") + "</div>";
  }

  function renderFreePlayPreview(seed, attempt) {
    var set = Puzzles.generateFreePlaySet(seed, attempt, []);

    labFreePlay.innerHTML =
      "<h2 class=\"lab-section-title\">Three-Set Free Play preview</h2>" +
      "<p class=\"lab-briefing\">Three puzzles. Wrong attempts add mistakes. Score = ceil(active seconds) + mistakes × 10s.</p>" +
      "<div class=\"lab-stream-list\">" + set.levels.map(function (level) {
        return "<span class=\"stream-chip\">" + level.levelNumber + ". " + escapeHtml(level.name) + " · " + escapeHtml(level.sourceWorld) + " · " + escapeHtml(level.answerMode) + " · " + escapeHtml((level.targeting && level.targeting.targetType) || "cell") + "</span>";
      }).join("") + "</div>";
  }

  function renderSymbolPacks() {
    var packs = ["go", "othello", "sudoku", "minesweeper", "animals", "food", "kitchen", "music", "sky", "sports", "workshop", "household"];

    labSymbols.innerHTML =
      "<h2 class=\"lab-section-title\">Symbol packs</h2>" +
      "<p class=\"lab-briefing\">Curated local glyphs with readable labels. Internal IDs can be short; player-facing symbols stay visual and named.</p>" +
      "<div class=\"lab-pack-grid\">" + packs.map(function (packName) {
        var symbols = (Symbols.packs && Symbols.packs[packName]) || [];
        return "<article class=\"lab-pack-card\">" +
          "<h3>" + escapeHtml(packName.replace(/-/g, " ")) + "</h3>" +
          "<div class=\"symbol-chips\">" + symbols.slice(0, 12).map(renderSymbolChipHtml).join("") + "</div>" +
        "</article>";
      }).join("") + "</div>";
  }

  function renderThemePacks() {
    labThemes.innerHTML =
      "<h2 class=\"lab-section-title\">Theme packs</h2>" +
      "<p class=\"lab-briefing\">Theme rows power object imposter, swap, recipe, and rack-completion puzzles.</p>" +
      "<div class=\"lab-pack-grid\">" + (Symbols.themePacks || []).map(function (pack) {
        return "<article class=\"lab-pack-card\">" +
          "<p class=\"round-name\">" + escapeHtml(pack.sourceWorld) + " · " + escapeHtml(pack.availability || "Lab") + "</p>" +
          "<h3>" + escapeHtml(pack.name) + "</h3>" +
          "<div class=\"symbol-chips\">" + pack.items.slice(0, 5).map(renderSymbolChipHtml).join("") + "</div>" +
        "</article>";
      }).join("") + "</div>";
  }

  function renderSection(title, types, seed, attempt, showAnswers) {
    var section = document.createElement("section");
    var heading = document.createElement("h2");

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
      cards.appendChild(renderTypeCard(type, seed, attempt, showAnswers, typeIndex));
    });
    section.appendChild(cards);
    labList.appendChild(section);
  }

  function renderTypeCard(type, seed, attempt, showAnswers, typeIndex) {
    var rawRound = type.generate(seed + "|lab|" + type.id + "|" + attempt, typeIndex + 1, attempt, []);
    var round = Puzzles.normalizeTypeRound ? Puzzles.normalizeTypeRound(type, rawRound, typeIndex + 1) : rawRound;
    var validation = type.validate(round);
    var card = document.createElement("article");
    var answerMode = round.answerMode || type.answerMode || "identifyOne";

    card.className = "lab-card" + (type.retired ? " is-retired" : "");
    card.innerHTML =
      "<div class=\"lab-card-header\">" +
        "<div>" +
          "<p class=\"round-name\">" + escapeHtml(type.sourceWorld) + " · difficulty " + type.difficulty + " · " + escapeHtml(answerMode) + "</p>" +
          "<h3>" + escapeHtml(type.name) + "</h3>" +
        "</div>" +
        "<button class=\"secondary-button lab-answer-button\" type=\"button\">Show answer</button>" +
      "</div>" +
      "<p class=\"lab-briefing\">" + escapeHtml(type.briefing) + "</p>" +
      (type.retired ? "<p class=\"lab-retired-note\">" + escapeHtml(type.retiredReason || "Retired from daily play.") + "</p>" : "") +
      "<div class=\"symbol-chips\">" + (type.symbolBank || type.symbols).map(renderSymbolChipHtml).join("") + "</div>" +
      "<div class=\"lab-grid grid\" aria-label=\"" + escapeHtml(type.name) + " sample board\"></div>" +
      "<dl class=\"lab-meta\">" +
        "<div><dt>Break signature</dt><dd>" + escapeHtml(round.breakSignature) + "</dd></div>" +
        "<div><dt>Target type</dt><dd>" + escapeHtml((round.targeting && round.targeting.targetType) || "cell") + "</dd></div>" +
        "<div><dt>Clickable targets</dt><dd>" + escapeHtml(((round.targeting && round.targeting.clickableIndices) || []).length) + " clickable · " + escapeHtml(((round.targeting && round.targeting.disabledIndices) || []).length) + " disabled</dd></div>" +
        "<div><dt>Broad target</dt><dd>" + escapeHtml(targetSummary(round)) + "</dd></div>" +
        "<div><dt>Evidence</dt><dd>" + escapeHtml(round.evidence) + "</dd></div>" +
        extraMeta(type, round) +
        "<div><dt>Answer</dt><dd class=\"lab-answer-text\">Hidden</dd></div>" +
        "<div><dt>Validator</dt><dd>" + (validation.valid ? "valid" : "invalid") + " · " + escapeHtml((validation.answers || []).join(", ")) + "</dd></div>" +
      "</dl>";

    renderBoard(card.querySelector(".lab-grid"), round.board, round.columns || Puzzles.GRID_SIZE);
    card.querySelector(".lab-answer-button").addEventListener("click", function (event) {
      toggleAnswer(card, round, event.currentTarget);
    });

    if (showAnswers) {
      window.setTimeout(function () {
        toggleAnswer(card, round, card.querySelector(".lab-answer-button"));
      }, 0);
    }

    return card;
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

  function renderBoard(container, board, columns) {
    container.innerHTML = "";
    container.style.gridTemplateColumns = "repeat(" + (columns || Puzzles.GRID_SIZE) + ", minmax(0, 1fr))";
    container.dataset.columns = String(columns || Puzzles.GRID_SIZE);
    board.forEach(function (cellData, index) {
      var cell = document.createElement("button");

      cell.type = "button";
      cell.disabled = true;
      cell.className = getCellClassName(cellData);
      cell.dataset.index = String(index);
      cell.setAttribute("aria-label", cellData.ariaLabel || cellData.label || "empty square");
      renderCellContents(cell, cellData);
      container.appendChild(cell);
    });
  }

  function toggleAnswer(card, round, button) {
    var answerIndices = getAnswerIndices(round);
    var answerText = card.querySelector(".lab-answer-text");
    var firstAnswerCell = card.querySelector("[data-index=\"" + answerIndices[0] + "\"]");
    var showing = firstAnswerCell ? !firstAnswerCell.classList.contains("is-correct") : false;

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

    if (Array.isArray(round.answerSteps) && round.answerSteps.length > 0) {
      return round.answerSteps.map(function (step) {
        return step.index;
      }).sort(function (a, b) {
        return a - b;
      });
    }

    return typeof round.answerIndex === "number" ? [round.answerIndex] : [];
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
      glyph: symbol.glyph || symbol.label || "",
      label: symbol.shortLabel || symbol.label || symbol.ariaLabel || symbol.glyph || "",
      ariaLabel: symbol.ariaLabel || symbol.label || symbol.glyph || ""
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
