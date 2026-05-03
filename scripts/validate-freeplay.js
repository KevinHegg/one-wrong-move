#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
require("../public/config.js");
const puzzles = require("../public/puzzles.js");
const scoring = require("../public/scoring.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function dateKeyFromOffset(offset) {
  return new Date(Date.UTC(2026, 4, 2) + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const seenModes = new Set();
const seenTypes = new Set();

for (let day = 0; day < 300; day += 1) {
  const dateKey = dateKeyFromOffset(day);
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const set = puzzles.generateFreePlaySet(dateKey, attempt, []);

    assert(set.levels.length === 3, `Free Play must generate exactly 3 puzzles for ${dateKey} attempt ${attempt}`);
    assert(puzzles.validatePuzzle(set), `Free Play set failed puzzle validation for ${dateKey} attempt ${attempt}`);
    assert(set.levels.every((level) => level.difficulty <= 3), `Free Play selected a brutal high-difficulty puzzle for ${dateKey}`);
    assert(set.levels.some((level) => level.difficulty <= 2), `Free Play needs at least one easier puzzle for ${dateKey}`);
    assert(set.levels.every((level) => !level.retired), `Free Play selected a retired puzzle for ${dateKey}`);

    set.levels.forEach((level) => {
      seenModes.add(level.answerMode);
      seenTypes.add(level.id);
      assert(level.targeting, `Free Play level missing targeting: ${level.id}`);
    });
  }
}

["identifyOne", "chooseOne", "multiSelect", "twoStep"].forEach((mode) => assert(seenModes.has(mode), `Free Play stream missing ${mode}`));
["mini-crossword-fill", "crossword-pair", "circuit-switch-pair", "maze-bridge-repair"].forEach((type) => assert(seenTypes.has(type), `Free Play never selected ${type}`));

const example = scoring.calculateScore(28100, 2, 10);
assert(example.baseSeconds === 29 && example.mistakePenaltySeconds === 20 && example.scoreSeconds === 49, "Free Play scoring formula regressed");

const config = globalThis.OWM_CONFIG;
assert(config.freePlayLevelTimeLimitSeconds === 0, "Free Play should have no fatal timeout by default");

const gameSource = fs.readFileSync(path.join(__dirname, "../public/game.js"), "utf8");
assert(gameSource.includes("Three-Set Free Play"), "Free Play UI copy missing");
assert(gameSource.includes("recordFreePlayMistake"), "Free Play wrong attempts should add mistakes instead of ending the run");
assert(gameSource.includes("buildFreePlayShareText"), "Free Play share text builder missing");
assert(gameSource.includes("Scoring.calculateScore"), "Free Play must use lower-is-better scoring utility");

console.log("Validated Three-Set Free Play generation, scoring, wrong-attempt behavior, share text, and default timer policy.");
