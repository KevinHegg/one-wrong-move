#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const puzzles = require("../public/puzzles.js");

const VALID_TARGETS = new Set(["cell", "row", "column", "region", "outputCell", "twoStep", "multiSelect"]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizedRound(type, attempt = 1) {
  const raw = type.generate(`targeting-${type.id}-${attempt}`, attempt, attempt, []);
  return puzzles.normalizeTypeRound(type, raw, attempt);
}

function text(round) {
  return `${round.briefing} ${round.instruction || ""} ${round.targeting.targetHint || ""}`.toLowerCase();
}

function validateRound(type, round) {
  const targeting = round.targeting;
  const copy = text(round);

  assert(targeting, `Missing targeting metadata for ${round.id}`);
  assert(VALID_TARGETS.has(targeting.targetType), `Unknown targetType for ${round.id}: ${targeting.targetType}`);
  assert(Array.isArray(targeting.clickableIndices), `Missing clickable indices for ${round.id}`);
  assert(Array.isArray(targeting.answerIndices), `Missing targeting answer indices for ${round.id}`);
  assert(Array.isArray(targeting.disabledIndices), `Missing disabled indices for ${round.id}`);
  assert(targeting.clickableIndices.every((index) => index >= 0 && index < puzzles.CELL_COUNT), `Clickable index out of range for ${round.id}`);
  assert(targeting.disabledIndices.every((index) => index >= 0 && index < puzzles.CELL_COUNT), `Disabled index out of range for ${round.id}`);

  if (copy.includes("row")) {
    assert(targeting.targetType === "row" || !copy.includes("tap the row"), `Row instruction without row target for ${round.id}`);
  }
  if (copy.includes("column")) {
    assert(targeting.targetType === "column" || !copy.includes("tap the column"), `Column instruction without column target for ${round.id}`);
  }
  if (copy.includes("output")) {
    assert(targeting.targetType === "outputCell" || round.id !== "logic-gate-row", `Output instruction without output target for ${round.id}`);
  }
  if (targeting.targetType === "row") {
    assert(targeting.acceptsAnyCellInAnswerRow, `Row target does not accept whole row for ${round.id}`);
    assert(targeting.answerIndices.length === puzzles.GRID_SIZE, `Row target answer should contain a full row for ${round.id}`);
  }
  if (targeting.targetType === "column") {
    assert(targeting.acceptsAnyCellInAnswerColumn, `Column target does not accept whole column for ${round.id}`);
    assert(targeting.answerIndices.length === puzzles.GRID_SIZE, `Column target answer should contain a full column for ${round.id}`);
  }
  if (targeting.targetType === "outputCell") {
    assert(targeting.clickableIndices.every((index) => index % puzzles.GRID_SIZE === 4), `Output target has non-output clickable cells for ${round.id}`);
  }

  round.board.forEach((cell, index) => {
    const clickable = targeting.clickableIndices.includes(index);
    if (!clickable && (round.answerMode === "identifyOne" || round.answerMode === "chooseOne")) {
      assert(cell.interactive === false && cell.selectable === false, `Disabled target can still be clicked for ${round.id} cell ${index}`);
    }
  });

  assert(round.title.includes(round.name), `Header/briefing title mismatch for ${round.id}`);
}

puzzles.puzzleTypes.filter((type) => !type.retired).forEach((type) => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    validateRound(type, normalizedRound(type, attempt));
  }
});

const logic = puzzles.puzzleTypes.find((type) => type.id === "logic-gate-row");
const dice = puzzles.puzzleTypes.find((type) => type.id === "dice-sum");
const rowTarget = puzzles.puzzleTypes.find((type) => type.id === "row-rhythm");

for (let attempt = 1; attempt <= 10; attempt += 1) {
  const logicRound = normalizedRound(logic, attempt);
  assert(logicRound.targeting.targetType === "outputCell", "Logic Gate Row must use output-only targeting");
  assert(logicRound.targeting.clickableIndices.join(",") === "4,9,14,19,24", "Logic output cells must be the only clickable cells");

  const diceRound = normalizedRound(dice, attempt);
  assert(["cell", "outputCell"].includes(diceRound.targeting.targetType), "Dice Sum target type must be exact die or output total");
  if (diceRound.targeting.targetType === "outputCell") {
    assert(diceRound.instruction.toLowerCase().includes("total"), "Dice total target instruction must say total");
  } else {
    assert(diceRound.instruction.toLowerCase().includes("die"), "Dice die target instruction must say die");
  }

  const rowRound = normalizedRound(rowTarget, attempt);
  assert(rowRound.targeting.acceptsAnyCellInAnswerRow, "Row-level target must accept any cell in answer row");
}

const gameSource = fs.readFileSync(path.join(__dirname, "../public/game.js"), "utf8");
assert(gameSource.includes("getAcceptedAnswerIndices"), "Game must use targeting-aware accepted answers");
assert(gameSource.includes("aria-disabled"), "Game must render disabled target ARIA state");

console.log("Validated target clarity metadata, output-only targets, row targets, disabled cells, and title alignment.");
