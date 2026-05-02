(function () {
  "use strict";

  var Puzzles = window.OneWrongMovePuzzles;
  var seedInput = document.getElementById("labSeed");
  var attemptInput = document.getElementById("labAttempt");
  var regenerateButton = document.getElementById("labRegenerate");
  var labList = document.getElementById("labList");

  regenerateButton.addEventListener("click", renderLab);
  seedInput.addEventListener("change", renderLab);
  attemptInput.addEventListener("change", renderLab);

  renderLab();

  function renderLab() {
    var seed = seedInput.value.trim() || Puzzles.getLocalDateKey(new Date());
    var attempt = Math.max(1, Number(attemptInput.value) || 1);
    var params = new URLSearchParams(window.location.search);
    var showAnswers = params.get("showAnswers") === "1";
    var focusType = params.get("focus") || "";
    var labTypes = focusType ? Puzzles.puzzleTypes.filter(function (type) {
      return type.id === focusType;
    }) : Puzzles.puzzleTypes;

    attemptInput.value = String(attempt);
    labList.innerHTML = "";

    labTypes.forEach(function (type, typeIndex) {
      var round = type.generate(seed + "|lab|" + type.id + "|" + attempt, typeIndex + 1, attempt, []);
      var validation = type.validate(round);
      var card = document.createElement("article");

      card.className = "lab-card";
      card.innerHTML =
        "<div class=\"lab-card-header\">" +
          "<div>" +
            "<p class=\"round-name\">" + escapeHtml(type.sourceWorld) + " · difficulty " + type.difficulty + "</p>" +
            "<h2>" + escapeHtml(type.name) + "</h2>" +
          "</div>" +
          "<button class=\"secondary-button lab-answer-button\" type=\"button\">Show answer</button>" +
        "</div>" +
        "<p class=\"lab-briefing\">" + escapeHtml(type.briefing) + "</p>" +
        "<div class=\"symbol-chips\">" + type.symbols.map(function (symbol) {
          return "<span class=\"symbol-chip\">" + escapeHtml(symbol) + "</span>";
        }).join("") + "</div>" +
        "<div class=\"lab-grid grid\" aria-label=\"" + escapeHtml(type.name) + " sample board\"></div>" +
        "<dl class=\"lab-meta\">" +
          "<div><dt>Break signature</dt><dd>" + escapeHtml(round.breakSignature) + "</dd></div>" +
          "<div><dt>Evidence</dt><dd>" + escapeHtml(round.evidence) + "</dd></div>" +
          "<div><dt>Answer</dt><dd class=\"lab-answer-text\">Hidden</dd></div>" +
          "<div><dt>Validator</dt><dd>" + (validation.valid ? "valid" : "invalid") + "</dd></div>" +
        "</dl>";

      renderBoard(card.querySelector(".lab-grid"), round.board);
      card.querySelector(".lab-answer-button").addEventListener("click", function (event) {
        toggleAnswer(card, round, event.currentTarget);
      });
      labList.appendChild(card);
      if (showAnswers) {
        toggleAnswer(card, round, card.querySelector(".lab-answer-button"));
      }
    });
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
    var answerCell = card.querySelector("[data-index=\"" + round.answerIndex + "\"]");
    var answerText = card.querySelector(".lab-answer-text");
    var showing = answerCell.classList.toggle("is-correct");

    button.textContent = showing ? "Hide answer" : "Show answer";
    answerText.textContent = showing ? "Cell " + (round.answerIndex + 1) + ": " + round.explanation : "Hidden";
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
    (cellData.classNames || []).forEach(function (className) {
      if (className) {
        classNames.push(className);
      }
    });

    return classNames.join(" ");
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
