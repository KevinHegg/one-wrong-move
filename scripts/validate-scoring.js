#!/usr/bin/env node
"use strict";

const scoring = require("../public/scoring.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkCase(totalActiveMs, mistakes, expected) {
  const actual = scoring.calculateScore(totalActiveMs, mistakes);

  assert(actual.baseSeconds === expected.baseSeconds, `Expected base ${expected.baseSeconds}, got ${actual.baseSeconds}`);
  assert(actual.mistakePenaltySeconds === expected.mistakePenaltySeconds, `Expected penalty ${expected.mistakePenaltySeconds}, got ${actual.mistakePenaltySeconds}`);
  assert(actual.scoreSeconds === expected.scoreSeconds, `Expected score ${expected.scoreSeconds}, got ${actual.scoreSeconds}`);
  assert(actual.penaltySecondsPerMistake === 10, `Expected default penalty of 10, got ${actual.penaltySecondsPerMistake}`);
}

checkCase(0, 0, {
  baseSeconds: 0,
  mistakePenaltySeconds: 0,
  scoreSeconds: 0
});

checkCase(1000, 0, {
  baseSeconds: 1,
  mistakePenaltySeconds: 0,
  scoreSeconds: 1
});

checkCase(1001, 0, {
  baseSeconds: 2,
  mistakePenaltySeconds: 0,
  scoreSeconds: 2
});

checkCase(18200, 2, {
  baseSeconds: 19,
  mistakePenaltySeconds: 20,
  scoreSeconds: 39
});

checkCase(59999, 3, {
  baseSeconds: 60,
  mistakePenaltySeconds: 30,
  scoreSeconds: 90
});

const survival = scoring.calculateSurvivalScore(12, 258000, 13, "wrong-move");

assert(survival.levelsCompleted === 12, "Survival levels completed mismatch");
assert(survival.totalActiveSeconds === 258, "Survival seconds mismatch");
assert(survival.endedOnLevel === 13, "Survival ended level mismatch");
assert(survival.endReason === "wrong-move", "Survival end reason mismatch");
assert(survival.rankingKey.primary === 12, "Survival ranking primary mismatch");
assert(survival.rankingKey.secondary === 258000, "Survival ranking secondary mismatch");

console.log("Validated lower-is-better legacy scoring and Survival Run scoring cases.");
