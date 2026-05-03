(function () {
  "use strict";

  var Puzzles = window.OneWrongMovePuzzles;
  var Config = window.OWM_CONFIG || { levelTimeLimitSeconds: 60 };
  var seedInput = document.getElementById("labSeed");
  var attemptInput = document.getElementById("labAttempt");
  var limitInput = document.getElementById("labLimit");
  var regenerateButton = document.getElementById("labRegenerate");
  var labSurvival = document.getElementById("labSurvival");
  var labList = document.getElementById("labList");

  regenerateButton.addEventListener("click", renderLab);
  seedInput.addEventListener("change", renderLab);
  attemptInput.addEventListener("change", renderLab);
  limitInput.addEventListener("change", renderLab);

  renderLab();

  function renderLab() {
    var seed = seedInput.value.trim() || Puzzles.getLocalDateKey(new Date());
    var attempt = Math.max(1, Number(attemptInput.value) || 1);
    var limit = Config.validateLevelTimeLimit ? Config.validateLevelTimeLimit(limitInput.value) : 60;
    var params = new URLSearchParams(window.location.search);
    var showAnswers = params.get("showAnswers") === "1";
    var focusType = params.get("focus") || "";
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

    attemptInput.value = String(attempt);
    limitInput.value = String(limit);
    renderSurvivalPreview(seed, attempt, limit);
    labList.innerHTML = "";

    renderSection("Production puzzle types", activeTypes, seed, attempt, showAnswers);
    renderSection("Retired / lab-only puzzle types", retiredTypes, seed, attempt, showAnswers);
  }

  function renderSurvivalPreview(seed, attempt, limit) {
    var stream = Puzzles.generateSurvivalLevels(seed, attempt, [], 20);

    labSurvival.innerHTML =
      "<h2 class=\"lab-section-title\">Survival stream preview</h2>" +
      "<p class=\"lab-briefing\">First 20 generated levels for this seed. Limit: " + escapeHtml(limit) + "s/level.</p>" +
      "<div class=\"lab-stream-list\">" + stream.levels.map(function (level) {
        return "<span class=\"stream-chip\">" + level.levelNumber + ". " + escapeHtml(level.name) + " · " + escapeHtml(level.sourceWorld) + " · " + escapeHtml(level.answerMode) + "</span>";
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
    var round = type.generate(seed + "|lab|" + type.id + "|" + attempt, typeIndex + 1, attempt, []);
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
      "<div class=\"symbol-chips\">" + type.symbols.map(function (symbol) {
        return "<span class=\"symbol-chip\">" + escapeHtml(symbol) + "</span>";
      }).join("") + "</div>" +
      "<div class=\"lab-grid grid\" aria-label=\"" + escapeHtml(type.name) + " sample board\"></div>" +
      "<dl class=\"lab-meta\">" +
        "<div><dt>Break signature</dt><dd>" + escapeHtml(round.breakSignature) + "</dd></div>" +
        "<div><dt>Evidence</dt><dd>" + escapeHtml(round.evidence) + "</dd></div>" +
        extraMeta(type, round) +
        "<div><dt>Answer</dt><dd class=\"lab-answer-text\">Hidden</dd></div>" +
        "<div><dt>Validator</dt><dd>" + (validation.valid ? "valid" : "invalid") + " · " + escapeHtml((validation.answers || []).join(", ")) + "</dd></div>" +
      "</dl>";

    renderBoard(card.querySelector(".lab-grid"), round.board);
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

    if (round.answerMode === "twoStep") {
      return "<div><dt>Steps</dt><dd>" + escapeHtml((round.answerSteps || []).map(function (step) {
        return step.role + ": cell " + (step.index + 1);
      }).join(", ")) + "</dd></div>";
    }

    return "";
  }

  function renderBoard(container, board) {
    container.innerHTML = "";
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

  function answerSummary(round, answerIndices) {
    var label = round.answerMode === "multiSelect" || round.answerMode === "twoStep" ? "Cells " : "Cell ";
    var numbers = answerIndices.map(function (index) {
      return index + 1;
    }).join(", ");

    return label + numbers + ": " + round.explanation;
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
