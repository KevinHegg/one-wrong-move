#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const puzzles = require("../public/puzzles.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function dateKey(offset) {
  return new Date(Date.UTC(2026, 4, 2) + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function typeById(id) {
  const type = puzzles.puzzleTypes.find((candidate) => candidate.id === id);
  assert(type, `Missing puzzle type: ${id}`);
  return type;
}

function normalize(type, seed, sample, attempt) {
  const raw = type.generate(`${seed}|othello|${type.id}|${attempt}|${sample}`, sample + 1, attempt, []);
  return puzzles.normalizeTypeRound(type, raw, sample + 1);
}

function sameSet(a, b) {
  const left = [...new Set(a)].sort((x, y) => x - y);
  const right = [...new Set(b)].sort((x, y) => x - y);
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function requiredShape(round) {
  assert(round.id, "Missing id");
  assert(round.name, `Missing name for ${round.id}`);
  assert(round.sourceWorld === "Othello", `${round.id} must use Othello source world`);
  assert(round.difficulty >= 3, `${round.id} should not be a trivial early puzzle`);
  assert(round.answerMode, `Missing answer mode for ${round.id}`);
  assert(round.targeting && round.targeting.targetType, `Missing targeting for ${round.id}`);
  assert(round.briefing, `Missing briefing for ${round.id}`);
  assert(round.example && round.example.cells && round.example.cells.length, `Missing example for ${round.id}`);
  assert(round.symbols && round.symbols.length, `Missing symbols for ${round.id}`);
  assert(round.board && round.board.length === 25, `${round.id} must use a 5x5 board`);
  assert(round.answerIndex !== undefined || (round.answerIndices && round.answerIndices.length), `Missing answer for ${round.id}`);
  assert(round.explanation, `Missing explanation for ${round.id}`);
  assert(round.wrongTapHint, `Missing wrong tap hint for ${round.id}`);
  assert(round.breakSignature, `Missing break signature for ${round.id}`);
  assert(round.evidence, `Missing evidence for ${round.id}`);
  assert(round.validator, `Missing validator for ${round.id}`);
}

function validateBestFlip(round) {
  requiredShape(round);
  assert(round.answerMode === "chooseOne", "Othello Best Flip must be chooseOne");
  assert(round.targeting.targetType === "cell", "Othello Best Flip must target cells");

  const scores = puzzles.othelloMoveScores(round.board).filter((move) => move.score > 0);
  const bestScore = Math.max(...scores.map((move) => move.score));
  const bestMoves = scores.filter((move) => move.score === bestScore);
  const legalIndexes = scores.map((move) => move.index);

  assert(scores.length >= 2, "Othello Best Flip should include legal decoy moves");
  assert(bestMoves.length === 1, "Othello Best Flip must have exactly one best move");
  assert(bestMoves[0].index === round.answerIndex, "Othello Best Flip answer must be the unique best move");
  assert(bestMoves[0].score >= 2, "Othello Best Flip should flip at least two discs");
  assert(sameSet(round.targeting.clickableIndices, legalIndexes), "Only legal Othello moves should be clickable");
  assert(puzzles.validateOthelloBestFlip(round).valid, "Othello Best Flip validator failed");
}

function validateMarkAllFlips(round) {
  requiredShape(round);
  assert(round.answerMode === "multiSelect", "Othello Mark All Flips must be multiSelect");
  assert(round.targeting.targetType === "multiSelect", "Othello Mark All Flips must use multiSelect targeting");

  const marked = round.board.filter((cell) => cell.value && cell.value.markedMove);
  assert(marked.length === 1, "Othello Mark All Flips must show exactly one marked move square");
  const flips = puzzles.othelloFlipsForMove(round.board, marked[0].index, "black");
  const whiteIndexes = round.board.filter((cell) => cell.value && cell.value.othello === "white").map((cell) => cell.index);

  assert(flips.length >= 2, "Othello Mark All Flips should require at least two flipped discs");
  assert(sameSet(flips, round.answerIndices), "Othello Mark All Flips answer set must equal computed flips");
  assert(sameSet(round.targeting.clickableIndices, whiteIndexes), "Othello Mark All Flips should let players choose from white discs");
  assert(round.minSelections === flips.length && round.maxSelections === flips.length, "Othello Mark All Flips selection count must match flips");
  assert(puzzles.validateOthelloMarkAllFlips(round).valid, "Othello Mark All Flips validator failed");
}

["othello-best-flip", "othello-mark-all-flips"].forEach((id) => {
  const type = typeById(id);
  assert(!type.retired, `${id} should be active production inventory`);
  for (let sample = 0; sample < 300; sample += 1) {
    const round = normalize(type, dateKey(sample), sample, (sample % 5) + 1);
    if (id === "othello-best-flip") {
      validateBestFlip(round);
    } else {
      validateMarkAllFlips(round);
    }
  }
});

const mazeExit = typeById("maze-exit");
assert(mazeExit.retired, "Maze Exit should be retired from normal play");
assert(/too obvious|low-depth|trivial/i.test(mazeExit.retiredReason), "Maze Exit retirement reason should describe why it was demoted");

for (let sample = 0; sample < 300; sample += 1) {
  const seed = dateKey(sample);
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const ladder = puzzles.generateSurvivalLevels(seed, attempt, [], 50).levels;
    const freePlay = puzzles.generateFreePlaySet(seed, attempt, []).levels;

    assert(ladder.every((level) => level.id !== "maze-exit"), `Maze Exit appeared in Ladder for ${seed} attempt ${attempt}`);
    assert(freePlay.every((level) => level.id !== "maze-exit"), `Maze Exit appeared in Free Play for ${seed} attempt ${attempt}`);
    ladder.forEach((level, index) => {
      const previous = ladder[index - 1];
      if (previous && level.isBoardGameCapturePuzzle && previous.isBoardGameCapturePuzzle) {
        throw new Error(`Back-to-back board-game capture puzzles at ${seed} attempt ${attempt} level ${index + 1}`);
      }
    });
    assert(freePlay.filter((level) => level.sourceWorld === "Go").length <= 1, `Free Play selected too many Go puzzles for ${seed}`);
    assert(freePlay.filter((level) => level.sourceWorld === "Othello").length <= 1, `Free Play selected too many Othello puzzles for ${seed}`);
  }
}

const gameSource = fs.readFileSync(path.join(__dirname, "../public/game.js"), "utf8");
const freePlayBlock = gameSource.slice(gameSource.indexOf("function showFreePlayResults"), gameSource.indexOf("function endRun"));
assert(freePlayBlock.includes("Lower score is better"), "Free Play result copy must use lower-score language");
assert(freePlayBlock.includes("Score = rounded-up solving time + 10s per mistake"), "Free Play result copy must explain the scoring formula");
assert(!freePlayBlock.includes("More levels is better"), "Free Play result copy must not use Ladder ranking language");
assert(!freePlayBlock.includes("Ended on"), "Free Play result copy must not use run-ending language");

const labHtml = fs.readFileSync(path.join(__dirname, "../public/lab.html"), "utf8");
const labSource = fs.readFileSync(path.join(__dirname, "../public/lab.js"), "utf8");
assert(labHtml.includes('value="othello"'), "Puzzle lab needs an Othello filter");
assert(labSource.includes('type.sourceWorld === "Othello"'), "Puzzle lab must show Othello metadata");

console.log("Validated Othello puzzles, Maze Exit demotion, Free Play result copy, Go/Othello placement, and lab coverage.");
