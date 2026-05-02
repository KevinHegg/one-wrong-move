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

for (let day = 0; day < 100; day += 1) {
  const dateKey = dateKeyFromOffset(day);
  const used = [];

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const daily = puzzles.generateDailyPuzzle(dateKey, attempt, used);

    assert(daily.rounds.length === 3, `Expected 3 rounds for ${dateKey} attempt ${attempt}`);
    assert(puzzles.validatePuzzle(daily), `Daily puzzle failed validation for ${dateKey} attempt ${attempt}`);

    daily.rounds.forEach((round, index) => {
      const result = puzzles.validateRound(round);

      assert(result.valid, `Round validation failed for ${round.id} on ${dateKey}`);
      assert(result.mismatches.length === 1, `Expected one mismatch for ${round.id}`);
      assert(typeof round.answerIndex === "number", `Missing answer index for ${round.id}`);
      assert(round.explanation, `Missing explanation for ${round.id}`);
      assert(round.breakSignature, `Missing break signature for ${round.id}`);
      assert(round.briefingText, `Missing briefing text for ${round.id}`);
      assert(round.symbolBank && round.symbolBank.length > 0, `Missing symbol bank for ${round.id}`);
      assert(round.exampleData && round.exampleData.cells.length > 0, `Missing example data for ${round.id}`);
      assert(round.roundNumber === index + 1, `Round number mismatch for ${round.id}`);

      used.push(round.breakSignature);
      generatedRounds += 1;
    });
  }
}

puzzles.puzzleTypes.forEach((type) => {
  const avoid = [];

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const round = type.generate(`direct-${type.id}`, 1, attempt, avoid);
    const result = type.validate(round);

    assert(result.valid, `Direct type validation failed for ${type.id}`);
    assert(!avoid.includes(round.breakSignature), `Avoid list repeated break signature for ${type.id}: ${round.breakSignature}`);
    avoid.push(round.breakSignature);
  }
});

console.log(`Validated ${generatedRounds} daily rounds across 100 dates and ${puzzles.puzzleTypes.length} puzzle types.`);
