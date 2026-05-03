#!/usr/bin/env node
"use strict";

const puzzles = require("../public/puzzles.js");

const RETIRED_DAILY_IDS = new Set(["rule-rows", "conveyor-shift", "knight-path"]);

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

function getAnswerIndices(round) {
  if (Array.isArray(round.answerIndices) && round.answerIndices.length > 0) {
    return round.answerIndices.slice().sort((a, b) => a - b);
  }

  return typeof round.answerIndex === "number" ? [round.answerIndex] : [];
}

function sameSet(left, right) {
  left = left.slice().sort((a, b) => a - b);
  right = right.slice().sort((a, b) => a - b);

  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function validateAnswerMode(round, result) {
  const answers = result.answers || [];
  const expected = getAnswerIndices(round);

  assert(["identifyOne", "chooseOne", "multiSelect", "twoStep"].includes(round.answerMode), `Unknown answer mode for ${round.id}`);
  assert(answers.length > 0, `No valid answer returned for ${round.id}`);
  assert(sameSet(answers, expected), `Answer mismatch for ${round.id}: expected ${expected}, got ${answers}`);

  if (round.answerMode === "identifyOne" || round.answerMode === "chooseOne") {
    assert(answers.length === 1, `Expected exactly one answer for ${round.answerMode} puzzle ${round.id}`);
    assert(round.answerIndex === answers[0], `answerIndex mismatch for ${round.id}`);
  }

  if (round.answerMode === "multiSelect") {
    assert(round.answerIndices.length >= 1, `Multi-select answer set missing for ${round.id}`);
    assert(round.minSelections >= 1, `Multi-select minSelections missing for ${round.id}`);
    assert(round.maxSelections >= round.minSelections, `Multi-select maxSelections invalid for ${round.id}`);
    assert(round.submitLabel, `Multi-select submit label missing for ${round.id}`);
  }

  if (round.answerMode === "twoStep") {
    assert(round.answerSteps && round.answerSteps.length >= 2, `Two-step answer steps missing for ${round.id}`);
    assert(round.submitLabel, `Two-step submit label missing for ${round.id}`);
  }
}

function validateRoundShape(round) {
  const result = puzzles.validateRound(round);

  assert(result.valid, `Round validation failed for ${round.id}`);
  validateAnswerMode(round, result);
  assert(round.board.length > 0 && round.board.length <= puzzles.CELL_COUNT, `Board size invalid for ${round.id}`);
  assert(round.board.some((cell) => cell.glyph), `Empty active board for ${round.id}`);
  assert(round.id && round.name && round.sourceWorld, `Missing identity fields for ${round.id}`);
  assert(round.difficulty >= 1 && round.difficulty <= 5, `Difficulty out of range for ${round.id}`);
  assert(round.cognitiveSkill, `Missing cognitive skill for ${round.id}`);
  assert(round.briefing && round.briefing.length > 0, `Missing briefing for ${round.id}`);
  assert(round.example && round.example.cells && round.example.cells.length > 0, `Missing example for ${round.id}`);
  assert(round.symbols && round.symbols.length > 0, `Missing symbol list for ${round.id}`);
  assert(round.explanation, `Missing explanation for ${round.id}`);
  assert(round.wrongTapHint, `Missing wrong-tap hint for ${round.id}`);
  assert(round.breakSignature, `Missing break signature for ${round.id}`);
  assert(round.evidence, `Missing evidence for ${round.id}`);

  round.board.forEach((cell, index) => {
    assert(cell.index === index, `Cell index mismatch in ${round.id}`);
    assert(typeof cell.row === "number" && typeof cell.col === "number", `Cell missing row/col in ${round.id}`);
    assert(cell.row >= 0 && cell.row < puzzles.GRID_SIZE && cell.col >= 0 && cell.col < puzzles.GRID_SIZE, `Cell outside 5x5 in ${round.id}`);
    assert("kind" in cell && "glyph" in cell && "ariaLabel" in cell, `Cell missing render fields in ${round.id}`);
  });

  return result;
}

function validateDailyMix(daily, dateKey, attempt) {
  const sourceWorlds = daily.rounds.map((round) => round.sourceWorld);
  const movementIds = new Set(["path-rhythm", "knight-path", "checkers-jump", "train-route", "chess-attack"]);

  assert(daily.rounds.length === 3, `Expected 3 rounds for ${dateKey} attempt ${attempt}`);
  assert(puzzles.validatePuzzle(daily), `Daily puzzle failed validation for ${dateKey} attempt ${attempt}`);
  assert(new Set(daily.rounds.map((round) => round.id)).size === 3, `Duplicate puzzle type in ${dateKey} attempt ${attempt}`);
  assert(new Set(sourceWorlds).size === 3, `Duplicate source world in ${dateKey} attempt ${attempt}`);
  assert(sourceWorlds.some((sourceWorld) => sourceWorld !== "Symbol Grammar"), `No real-world puzzle in ${dateKey} attempt ${attempt}`);
  assert(sourceWorlds.filter((sourceWorld) => sourceWorld === "Cards").length <= 1, `Cards repeated in ${dateKey} attempt ${attempt}`);
  assert(sourceWorlds.filter((sourceWorld) => sourceWorld === "Go").length <= 1, `Go repeated in ${dateKey} attempt ${attempt}`);
  assert(daily.rounds.filter((round) => movementIds.has(round.id)).length <= 1, `Movement puzzles repeated in ${dateKey} attempt ${attempt}`);

  daily.rounds.forEach((round, index) => {
    assert(!RETIRED_DAILY_IDS.has(round.id), `Retired puzzle selected in daily mix: ${round.id}`);
    assert(round.roundNumber === index + 1, `Round number mismatch for ${round.id}`);
    assert(index === 0 ? round.difficulty >= 1 && round.difficulty <= 2 : true, `Round 1 difficulty out of range for ${round.id}`);
    assert(index === 1 ? round.difficulty >= 2 && round.difficulty <= 3 : true, `Round 2 difficulty out of range for ${round.id}`);
    assert(index === 2 ? round.difficulty >= 3 && round.difficulty <= 5 : true, `Round 3 difficulty out of range for ${round.id}`);
    validateRoundShape(round);
  });
}

function validateDirectTypes() {
  const activeTypes = puzzles.puzzleTypes.filter((type) => !type.retired);
  const answerModes = new Set();

  assert(activeTypes.length >= 15, "Production puzzle pool must contain at least 15 active puzzle types");

  puzzles.puzzleTypes.forEach((type) => {
    const avoid = [];

    assert(type.id && type.name && type.sourceWorld, `Puzzle type missing identity: ${type.id}`);
    assert(type.briefing && type.example && type.symbols && type.symbols.length > 0, `Puzzle type missing briefing assets: ${type.id}`);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const round = type.generate(`direct-${type.id}`, 1, attempt, avoid);
      const result = type.validate(round);

      assert(result.valid, `Direct type validation failed for ${type.id}`);
      validateAnswerMode(Object.assign({}, round, {
        id: type.id,
        answerMode: round.answerMode || type.answerMode
      }), result);
      assert(!avoid.includes(round.breakSignature), `Avoid list repeated break signature for ${type.id}: ${round.breakSignature}`);
      avoid.push(round.breakSignature);
    }

    if (!type.retired) {
      answerModes.add(type.answerMode);
    }
  });

  ["identifyOne", "chooseOne", "multiSelect", "twoStep"].forEach((mode) => {
    assert(answerModes.has(mode), `Production pool missing answer mode ${mode}`);
  });
}

let generatedRounds = 0;

for (let day = 0; day < 300; day += 1) {
  const dateKey = dateKeyFromOffset(day);
  const used = [];

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const daily = puzzles.generateDailyPuzzle(dateKey, attempt, used);

    validateDailyMix(daily, dateKey, attempt);
    daily.rounds.forEach((round) => {
      used.push(round.breakSignature);
      generatedRounds += 1;
    });
  }
}

validateDirectTypes();

console.log(`Validated ${generatedRounds} daily rounds across 300 dates and ${puzzles.puzzleTypes.length} puzzle types.`);
