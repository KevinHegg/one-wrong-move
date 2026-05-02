#!/usr/bin/env node
"use strict";

const puzzles = require("../public/puzzles.js");

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

let generatedRounds = 0;

for (let day = 0; day < 300; day += 1) {
  const dateKey = dateKeyFromOffset(day);
  const used = [];

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const daily = puzzles.generateDailyPuzzle(dateKey, attempt, used);

    assert(daily.rounds.length === 3, `Expected 3 rounds for ${dateKey} attempt ${attempt}`);
    assert(puzzles.validatePuzzle(daily), `Daily puzzle failed validation for ${dateKey} attempt ${attempt}`);
    assert(new Set(daily.rounds.map((round) => round.id)).size === 3, `Duplicate puzzle type in ${dateKey} attempt ${attempt}`);
    assert(new Set(daily.rounds.map((round) => round.sourceWorld)).size === 3, `Duplicate source world in ${dateKey} attempt ${attempt}`);

    daily.rounds.forEach((round, index) => {
      const result = puzzles.validateRound(round);

      assert(result.valid, `Round validation failed for ${round.id} on ${dateKey}`);
      assert(result.answers.length === 1, `Expected one valid answer for ${round.id}`);
      assert(result.answers[0] === round.answerIndex, `Answer index mismatch for ${round.id}`);
      assert(round.board.length <= 25, `Board exceeds 5x5 for ${round.id}`);
      assert(round.board.some((cell) => cell.glyph), `Empty active board for ${round.id}`);
      assert(round.explanation, `Missing explanation for ${round.id}`);
      assert(round.wrongTapHint, `Missing wrong-tap hint for ${round.id}`);
      assert(round.breakSignature, `Missing break signature for ${round.id}`);
      assert(round.briefing, `Missing briefing for ${round.id}`);
      assert(round.example && round.example.cells.length > 0, `Missing example for ${round.id}`);
      assert(round.symbols && round.symbols.length > 0, `Missing symbol list for ${round.id}`);
      assert(round.evidence, `Missing evidence for ${round.id}`);
      assert(round.roundNumber === index + 1, `Round number mismatch for ${round.id}`);

      used.push(round.breakSignature);
      generatedRounds += 1;
    });
  }
}

puzzles.puzzleTypes.forEach((type) => {
  const avoid = [];

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const round = type.generate(`direct-${type.id}`, 1, attempt, avoid);
    const result = type.validate(round);

    assert(result.valid, `Direct type validation failed for ${type.id}`);
    assert(result.answers[0] === round.answerIndex, `Direct answer mismatch for ${type.id}`);
    assert(!avoid.includes(round.breakSignature), `Avoid list repeated break signature for ${type.id}: ${round.breakSignature}`);
    avoid.push(round.breakSignature);
  }
});

console.log(`Validated ${generatedRounds} daily rounds across 300 dates and ${puzzles.puzzleTypes.length} puzzle types.`);
