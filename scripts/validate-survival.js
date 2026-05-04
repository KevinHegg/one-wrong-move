#!/usr/bin/env node
"use strict";

require("../public/config.js");
const fs = require("fs");
const path = require("path");
const puzzles = require("../public/puzzles.js");
const scoring = require("../public/scoring.js");

const RETIRED = new Set(["rule-rows", "conveyor-shift", "knight-path", "maze-exit"]);
const REQUIRED_TYPES = new Set(["yahtzee-fix", "maze-key-exit", "scrabble-cross", "tetris-fit", "chess-attack", "go-capture-max", "go-liberties", "othello-best-flip", "othello-mark-all-flips"]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function dateKeyFromOffset(offset) {
  const start = Date.UTC(2026, 4, 2);
  const date = new Date(start + offset * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function answerIndices(round) {
  if (round.targeting && Array.isArray(round.targeting.answerIndices) && round.targeting.answerIndices.length > 0) {
    return round.targeting.answerIndices.slice().sort((a, b) => a - b);
  }
  if (Array.isArray(round.answerIndices) && round.answerIndices.length > 0) {
    return round.answerIndices.slice().sort((a, b) => a - b);
  }
  if (Array.isArray(round.answerSteps) && round.answerSteps.length > 0) {
    return round.answerSteps.map((step) => step.index).sort((a, b) => a - b);
  }
  return typeof round.answerIndex === "number" ? [round.answerIndex] : [];
}

function sameSet(left, right) {
  left = left.slice().sort((a, b) => a - b);
  right = right.slice().sort((a, b) => a - b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateLevel(level) {
  const result = puzzles.validateRound(level);
  const expected = answerIndices(level);

  assert(result.valid, `Level failed validator: ${level.id}`);
  assert(sameSet(result.answers || [], expected), `Answer mismatch for ${level.id}`);
  assert(level.board.length > 0 && level.board.length <= puzzles.CELL_COUNT, `Board size invalid for ${level.id}`);
  assert(!RETIRED.has(level.id), `Retired puzzle in survival stream: ${level.id}`);

  if ((level.answerMode === "identifyOne" || level.answerMode === "chooseOne") && !(level.targeting && (level.targeting.acceptsAnyCellInAnswerRow || level.targeting.acceptsAnyCellInAnswerColumn))) {
    assert(expected.length === 1, `Single-answer level must have one answer: ${level.id}`);
  } else if (level.answerMode === "multiSelect") {
    assert(expected.length >= 1, `Multi-select answer missing: ${level.id}`);
    assert(level.submitLabel, `Multi-select submit label missing: ${level.id}`);
  } else if (level.answerMode === "twoStep") {
    assert(level.answerSteps && level.answerSteps.length >= 2, `Two-step answer missing: ${level.id}`);
    assert(level.submitLabel, `Two-step submit label missing: ${level.id}`);
  } else if (level.answerMode === "identifyOne" || level.answerMode === "chooseOne") {
    assert(level.targeting && (level.targeting.acceptsAnyCellInAnswerRow || level.targeting.acceptsAnyCellInAnswerColumn), `Unsupported broad target for ${level.id}`);
  } else {
    throw new Error(`Unknown answer mode: ${level.answerMode}`);
  }
}

function validateChess(round) {
  const numbered = round.board.filter((cell) => cell.value && cell.value.piece);
  const pieces = new Set(numbered.map((cell) => cell.value.piece));
  assert(numbered.length >= 8, "Chess Attack must have at least 8 numbered pieces");
  assert(numbered.length >= 9 && numbered.length <= 10, "Chess Attack should target 9-10 pieces");
  ["king", "queen", "rook", "bishop", "knight"].forEach((piece) => assert(pieces.has(piece), `Chess Attack missing ${piece}`));
  numbered.forEach((cell) => {
    assert(cell.value.piece !== "pawn", "Chess Attack must not use pawns");
    assert(cell.cornerLabel === String(cell.value.number), "Chess piece number must be on the same square");
  });
  assert(puzzles.validateChessAttack(round).valid, "Chess Attack validator failed");
}

function validateGoCapture(round) {
  const stones = round.board.filter((cell) => cell.value && (cell.value.go === "black" || cell.value.go === "white")).length;
  const bestScore = round.choiceScores.find((score) => score.index === round.answerIndex).score;
  assert(stones >= 12 && stones <= 18, `Go Capture Max should have 12-18 stones, got ${stones}`);
  assert(bestScore >= 2, "Go Capture Max best move should capture at least 2 stones");
  assert(puzzles.validateGoCaptureMax(round).valid, "Go Capture Max validator failed");
}

function validateGoLiberties(round) {
  const marked = round.board.filter((cell) => cell.value && cell.value.marked).length;
  assert(marked >= 2 && marked <= 4, `Go Liberties marked group should be 2-4 stones, got ${marked}`);
  assert(round.answerIndices.length >= 2 && round.answerIndices.length <= 4, "Go Liberties should require 2-4 liberties");
  assert(puzzles.validateGoLiberties(round).valid, "Go Liberties validator failed");
}

function validateSpecific(typeId, check) {
  const type = puzzles.puzzleTypes.find((item) => item.id === typeId);
  assert(type, `Missing puzzle type ${typeId}`);
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const raw = type.generate(`specific-${typeId}-${attempt}`, 10, attempt, []);
    const round = Object.assign({}, raw, {
      id: type.id,
      name: type.name,
      sourceWorld: type.sourceWorld,
      difficulty: type.difficulty,
      answerMode: raw.answerMode || type.answerMode,
      cognitiveSkill: type.cognitiveSkill,
      symbols: type.symbols,
      briefing: type.briefing,
      example: type.example,
      validator: type.validator,
      cells: raw.board
    });
    validateLevel(round);
    check(round);
  }
}

const seenModes = new Set();
const seenTypes = new Set();

for (let day = 0; day < 300; day += 1) {
  const dateKey = dateKeyFromOffset(day);
  const used = [];
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const stream = puzzles.generateSurvivalLevels(dateKey, attempt, used, 50);
    assert(stream.levels.length === 50, `Expected 50 survival levels for ${dateKey} attempt ${attempt}`);
    assert(stream.levels.slice(0, 3).some((level) => level.sourceWorld !== "Symbol Grammar"), `First 3 levels need a real-world source for ${dateKey}`);

    stream.levels.forEach((level, index) => {
      validateLevel(level);
      seenModes.add(level.answerMode);
      seenTypes.add(level.id);
      used.push(level.breakSignature);
      if (index > 0) {
        const previous = stream.levels[index - 1];
        assert(level.id !== previous.id, `Immediate duplicate type ${level.id}`);
        assert(level.sourceWorld !== previous.sourceWorld, `Immediate duplicate source ${level.sourceWorld}`);
      }
      if (index < 3) assert(level.difficulty >= 1 && level.difficulty <= 2, `Early level difficulty too high: ${level.id}`);
      if (index >= 3 && index < 8) assert(level.difficulty >= 2 && level.difficulty <= 3, `Medium level difficulty out of range: ${level.id}`);
      if (index >= 8) assert(level.difficulty >= 3 && level.difficulty <= 5, `Hard level difficulty out of range: ${level.id}`);
    });
  }
}

["identifyOne", "chooseOne", "multiSelect", "twoStep"].forEach((mode) => assert(seenModes.has(mode), `Survival stream missing ${mode}`));
REQUIRED_TYPES.forEach((type) => assert(seenTypes.has(type), `Survival stream missing ${type}`));

validateSpecific("chess-attack", validateChess);
validateSpecific("go-capture-max", validateGoCapture);
validateSpecific("go-liberties", validateGoLiberties);
validateSpecific("othello-best-flip", (round) => assert(puzzles.validateOthelloBestFlip(round).valid, "Othello Best Flip needs one best move"));
validateSpecific("othello-mark-all-flips", (round) => assert(puzzles.validateOthelloMarkAllFlips(round).valid && round.answerIndices.length >= 2, "Othello Mark All Flips needs a flip set"));
validateSpecific("yahtzee-fix", (round) => assert(round.answerIndices.length === 2, "Yahtzee Fix needs exactly two dice"));
validateSpecific("maze-key-exit", (round) => assert(round.answerSteps.length === 2, "Maze Key Exit needs one key/exit pair"));
validateSpecific("scrabble-cross", (round) => assert(round.answerSteps.length === 2, "Scrabble Cross needs one square/tile pair"));
validateSpecific("tetris-fit", (round) => assert(round.answerIndices.length === 4, "Tetris Fit needs four placement cells"));

const config = globalThis.OWM_CONFIG;
assert(config.validateLevelTimeLimit(10) === 60, "Low invalid limit should fall back");
assert(config.validateLevelTimeLimit(181) === 60, "High invalid limit should fall back");
assert(config.validateLevelTimeLimit(45) === 45, "Valid limit should be accepted");

const survivalScore = scoring.calculateSurvivalScore(7, 123400, 8, "time-expired");
assert(survivalScore.levelsCompleted === 7 && survivalScore.totalActiveSeconds === 124, "Survival scoring object regressed");

const gameSource = fs.readFileSync(path.join(__dirname, "../public/game.js"), "utf8");
assert(gameSource.includes('endRun("wrong-move"'), "Wrong move end behavior missing");
assert(gameSource.includes('endRun("time-expired"'), "Timeout end behavior missing");
assert(gameSource.includes("completeLevel"), "Correct move advance behavior missing");
assert(!/TOTAL_ROUNDS/.test(gameSource), "Old fixed three-round assumptions remain in main game");
assert(!/score\s*=\s*Math\.max\(0,\s*1000/i.test(gameSource), "Old opaque score display remains");

console.log("Validated Survival Run: 300 dates, 5 attempts, first 50 levels, answer modes, config, scoring, and puzzle-specific constraints.");
