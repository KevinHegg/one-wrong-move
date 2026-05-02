#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const puzzles = require("../public/puzzles.js");
const scoring = require("../public/scoring.js");

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

function validateDailyMix(dateKey, attempt, used) {
  const daily = puzzles.generateDailyPuzzle(dateKey, attempt, used);
  const difficulties = daily.rounds.map((round) => round.difficulty);
  const sourceWorlds = daily.rounds.map((round) => round.sourceWorld);

  assert(daily.rounds.length === 3, `Daily mix did not produce 3 rounds for ${dateKey} attempt ${attempt}`);
  assert(difficulties[0] >= 1 && difficulties[0] <= 2, `Round 1 difficulty out of range for ${dateKey}`);
  assert(difficulties[1] >= 2 && difficulties[1] <= 3, `Round 2 difficulty out of range for ${dateKey}`);
  assert(difficulties[2] >= 3 && difficulties[2] <= 5, `Round 3 difficulty out of range for ${dateKey}`);
  assert(new Set(daily.rounds.map((round) => round.id)).size === 3, `Duplicate puzzle type in daily mix for ${dateKey}`);
  assert(new Set(sourceWorlds).size === 3, `Duplicate source world in daily mix for ${dateKey}`);
  assert(sourceWorlds.some((sourceWorld) => sourceWorld !== "Symbol Grammar"), `No real-world puzzle in daily mix for ${dateKey}`);
  assert(sourceWorlds.filter((sourceWorld) => sourceWorld === "Cards").length <= 1, `Cards repeated in daily mix for ${dateKey}`);
  assert(daily.rounds.filter((round) => round.sourceWorld === "Symbol Grammar").length <= 1, `Too many abstract glyph puzzles in ${dateKey}`);
  assert(daily.rounds.filter((round) => ["path-rhythm", "knight-path", "checkers-jump"].includes(round.id)).length <= 1, `Too many movement-path puzzles in ${dateKey}`);

  daily.rounds.forEach((round) => {
    validateRoundShape(round);
    used.push(round.breakSignature);
  });
}

function validateRoundShape(round) {
  const result = puzzles.validateRound(round);

  assert(result.valid, `Round failed validator: ${round.id}`);
  assert(result.answers.length === 1, `Round does not have exactly one valid answer: ${round.id}`);
  assert(result.answers[0] === round.answerIndex, `Validator answer does not match answerIndex: ${round.id}`);
  assert(round.id && round.name && round.sourceWorld && round.cognitiveSkill, `Missing round identity fields for ${round.id}`);
  assert(round.briefing && round.briefing.length > 0, `Missing briefing for ${round.id}`);
  assert(round.example && round.example.cells && round.example.cells.length > 0, `Missing non-spoiler example for ${round.id}`);
  assert(round.symbols && round.symbols.length > 0, `Missing symbols for ${round.id}`);
  assert(round.explanation && round.wrongTapHint && round.evidence, `Missing feedback copy for ${round.id}`);
  assert(round.breakSignature && round.breakSignature.indexOf(round.id + "|") === 0, `Bad break signature for ${round.id}`);
  assert(round.board.length > 0 && round.board.length <= puzzles.CELL_COUNT, `Board size invalid for ${round.id}`);
  assert(round.board.some((cell) => cell.glyph), `Board is empty for ${round.id}`);
  assert(!String(round.example.caption).includes(round.breakSignature), `Example reveals break signature for ${round.id}`);
  assert(!String(round.briefing).includes(String(round.answerIndex)), `Briefing reveals answer index for ${round.id}`);

  round.board.forEach((cell, index) => {
    assert(cell.index === index, `Cell index mismatch in ${round.id}`);
    assert(typeof cell.row === "number" && typeof cell.col === "number", `Cell missing row/col in ${round.id}`);
    assert(cell.row >= 0 && cell.row < puzzles.GRID_SIZE && cell.col >= 0 && cell.col < puzzles.GRID_SIZE, `Cell outside 5x5 in ${round.id}`);
    assert("kind" in cell && "glyph" in cell && "ariaLabel" in cell, `Cell missing render fields in ${round.id}`);
  });
}

function validateAllTypes() {
  assert(puzzles.puzzleTypes.length >= 15, "Production puzzle pool must contain at least 15 puzzle types");

  puzzles.puzzleTypes.forEach((type) => {
    const avoid = [];

    assert(type.id && type.name && type.sourceWorld, `Puzzle type missing identity: ${type.id}`);
    assert(type.briefing && type.example && type.symbols && type.symbols.length > 0, `Puzzle type missing briefing assets: ${type.id}`);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const round = type.generate(`direct-${type.id}`, attempt, attempt, avoid);

      validateRoundShape(Object.assign({}, round, {
        id: type.id,
        name: type.name,
        sourceWorld: type.sourceWorld,
        difficulty: type.difficulty,
        cognitiveSkill: type.cognitiveSkill,
        symbols: type.symbols,
        briefing: type.briefing,
        example: type.example,
        validator: type.validator
      }));
      assert(!avoid.includes(round.breakSignature), `Break signature did not vary for ${type.id}`);
      avoid.push(round.breakSignature);
    }
  });
}

function validateScoringReferences() {
  const score = scoring.calculateScore(18200, 2);
  const game = fs.readFileSync(path.join(__dirname, "../public/game.js"), "utf8");
  const scoringSource = fs.readFileSync(path.join(__dirname, "../public/scoring.js"), "utf8");

  assert(score.baseSeconds === 19 && score.mistakePenaltySeconds === 20 && score.scoreSeconds === 39, "Lower-is-better scoring calculation regressed");
  assert(!/1000\s*-/.test(game + scoringSource), "Old 1000-point scoring formula still appears");
  assert(!/mistakes\s*\*\s*50/.test(game + scoringSource), "Old 50-point mistake penalty still appears");
  assert(!/\bpoints\b/i.test(game + scoringSource), "Score should not be presented as points");
}

for (let day = 0; day < 300; day += 1) {
  const dateKey = dateKeyFromOffset(day);
  const used = [];

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    validateDailyMix(dateKey, attempt, used);
  }
}

validateAllTypes();
validateScoringReferences();

console.log(`Validated pattern systems: ${puzzles.puzzleTypes.length} types, 300 dates, 5 session attempts.`);
