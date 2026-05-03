#!/usr/bin/env node
"use strict";

const puzzles = require("../public/puzzles.js");

const COMMON_WORDS = new Set([
  "CAT", "DOG", "SUN", "MOON", "STAR", "TREE", "FROG", "BIRD", "FISH", "BONE", "LOCK", "KEY",
  "KING", "QUEEN", "ROAD", "TRAIN", "GOAT", "BEAR", "HIVE", "BEE", "FOX", "OWL", "HAWK",
  "GAME", "PLAY", "WORD", "TREE", "ROAD", "HIVE"
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalize(type, attempt) {
  return puzzles.normalizeTypeRound(type, type.generate(`word-${type.id}-${attempt}`, attempt, attempt, []), attempt);
}

function validateWords(round) {
  const solutions = round.wordSolutions || [];
  assert(solutions.length === 1, `${round.id} must have exactly one word solution`);
  const words = solutions[0].validWords || [];
  assert(words.length >= 2, `${round.id} must name crossing words`);
  words.forEach((word) => assert(COMMON_WORDS.has(word), `${round.id} used a non-curated word: ${word}`));
}

function validateRack(round) {
  const rack = round.board.filter((cell) => cell.value && cell.value.crossword === "rack");
  const blanks = round.board.filter((cell) => cell.value && cell.value.crossword === "blank");

  assert(rack.length >= 4, `${round.id} needs a rack of at least 4 tiles`);
  assert(blanks.length >= 1, `${round.id} needs at least one blank square`);
  rack.forEach((cell) => {
    assert(cell.classNames.includes("rack-tile"), `${round.id} rack tile lacks rack styling`);
    assert(/rack tile/i.test(cell.ariaLabel), `${round.id} rack tile needs accessible letter label`);
  });
}

["mini-crossword-fill", "crossword-pair", "scrabble-cross"].forEach((typeId) => {
  const type = puzzles.puzzleTypes.find((item) => item.id === typeId);

  assert(type, `Missing word puzzle ${typeId}`);
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const round = normalize(type, attempt);
    const result = puzzles.validateRound(round);

    assert(result.valid, `${typeId} failed validation`);
    validateRack(round);
    if (typeId !== "scrabble-cross") {
      validateWords(round);
    }
    if (round.answerMode === "twoStep") {
      assert(round.answerSteps.length === 2, `${typeId} should use a square/tile two-step solution`);
      assert(round.answerSteps.some((step) => step.role === "board-square"), `${typeId} missing board-square step`);
      assert(round.answerSteps.some((step) => step.role === "rack-tile"), `${typeId} missing rack-tile step`);
    }
    if (round.answerMode === "multiSelect") {
      assert(round.answerIndices.length === 4, `${typeId} should select two blanks and two rack letters`);
    }
  }
});

console.log("Validated crossword and word puzzle uniqueness metadata, curated words, rack separation, and accessibility labels.");
