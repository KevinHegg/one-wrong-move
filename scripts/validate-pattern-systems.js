#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const puzzles = require("../public/puzzles.js");
const scoring = require("../public/scoring.js");

const RETIRED_DAILY_IDS = new Set(["rule-rows", "conveyor-shift", "knight-path"]);
const REQUIRED_ACTIVE_IDS = new Set([
  "card-straight",
  "suit-cycle",
  "poker-hand-trap",
  "logic-gate-row",
  "domino-chain",
  "dice-sum",
  "train-route",
  "mirror-trap",
  "pair-pact",
  "chess-attack",
  "go-capture-max",
  "go-liberties",
  "yahtzee-fix",
  "maze-exit",
  "maze-key-exit",
  "scrabble-cross",
  "tetris-fit"
]);

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

  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function validateAnswer(round, result) {
  const answers = (result.answers || []).slice().sort((a, b) => a - b);
  const expected = getAnswerIndices(round);

  assert(["identifyOne", "chooseOne", "multiSelect", "twoStep"].includes(round.answerMode), `Unknown answer mode for ${round.id}`);
  assert(answers.length > 0, `No validator answers for ${round.id}`);
  assert(sameSet(answers, expected), `Validator answer does not match expected answer for ${round.id}`);

  if ((round.answerMode === "identifyOne" || round.answerMode === "chooseOne") && !(round.targeting && (round.targeting.acceptsAnyCellInAnswerRow || round.targeting.acceptsAnyCellInAnswerColumn))) {
    assert(answers.length === 1, `Single-answer puzzle has multiple answers: ${round.id}`);
    assert(round.answerIndex === answers[0], `Single-answer answerIndex mismatch: ${round.id}`);
  } else if (round.answerMode === "multiSelect") {
    assert(round.answerIndices.length >= 1, `Multi-select answer set missing: ${round.id}`);
    assert(round.minSelections >= 1, `Multi-select minSelections missing: ${round.id}`);
    assert(round.maxSelections >= round.minSelections, `Multi-select maxSelections invalid: ${round.id}`);
  } else if (round.answerMode === "twoStep") {
    assert(round.answerSteps && round.answerSteps.length >= 2, `Two-step answer steps missing: ${round.id}`);
    assert(round.submitLabel, `Two-step submit label missing: ${round.id}`);
  }
}

function validateRoundShape(round) {
  const result = puzzles.validateRound(round);

  assert(result.valid, `Round failed validator: ${round.id}`);
  validateAnswer(round, result);
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

function validateDailyMix(dateKey, attempt, used) {
  const daily = puzzles.generateDailyPuzzle(dateKey, attempt, used);
  const difficulties = daily.rounds.map((round) => round.difficulty);
  const sourceWorlds = daily.rounds.map((round) => round.sourceWorld);
  const movementIds = new Set(["path-rhythm", "knight-path", "checkers-jump", "train-route", "chess-attack"]);

  assert(daily.rounds.length === 3, `Daily mix did not produce 3 rounds for ${dateKey} attempt ${attempt}`);
  assert(difficulties[0] >= 1 && difficulties[0] <= 2, `Round 1 difficulty out of range for ${dateKey}`);
  assert(difficulties[1] >= 2 && difficulties[1] <= 3, `Round 2 difficulty out of range for ${dateKey}`);
  assert(difficulties[2] >= 3 && difficulties[2] <= 5, `Round 3 difficulty out of range for ${dateKey}`);
  assert(new Set(daily.rounds.map((round) => round.id)).size === 3, `Duplicate puzzle type in daily mix for ${dateKey}`);
  assert(new Set(sourceWorlds).size === 3, `Duplicate source world in daily mix for ${dateKey}`);
  assert(sourceWorlds.some((sourceWorld) => sourceWorld !== "Symbol Grammar"), `No real-world puzzle in daily mix for ${dateKey}`);
  assert(sourceWorlds.filter((sourceWorld) => sourceWorld === "Cards").length <= 1, `Cards repeated in daily mix for ${dateKey}`);
  assert(sourceWorlds.filter((sourceWorld) => sourceWorld === "Go").length <= 1, `Go repeated in daily mix for ${dateKey}`);
  assert(daily.rounds.filter((round) => round.sourceWorld === "Symbol Grammar").length <= 1, `Too many abstract glyph puzzles in ${dateKey}`);
  assert(daily.rounds.filter((round) => movementIds.has(round.id)).length <= 1, `Too many movement-path puzzles in ${dateKey}`);
  assert(daily.rounds.every((round) => !RETIRED_DAILY_IDS.has(round.id)), `Retired puzzle selected in daily mix for ${dateKey}`);

  daily.rounds.forEach((round) => {
    validateRoundShape(round);
    used.push(round.breakSignature);
  });
}

function validateAllTypes() {
  const activeTypes = puzzles.puzzleTypes.filter((type) => !type.retired);
  const retiredTypes = puzzles.puzzleTypes.filter((type) => type.retired);
  const activeIds = new Set(activeTypes.map((type) => type.id));
  const seenAnswerModes = new Set();
  const chessPieces = new Set();

  assert(activeTypes.length >= 15, "Production puzzle pool must contain at least 15 active puzzle types");
  REQUIRED_ACTIVE_IDS.forEach((id) => {
    assert(activeIds.has(id), `Required production puzzle type missing: ${id}`);
  });
  ["rule-rows", "conveyor-shift", "knight-path"].forEach((id) => {
    assert(retiredTypes.some((type) => type.id === id), `Expected retired lab-only puzzle type missing: ${id}`);
  });

  puzzles.puzzleTypes.forEach((type) => {
    const avoid = [];

    assert(type.id && type.name && type.sourceWorld, `Puzzle type missing identity: ${type.id}`);
    assert(type.briefing && type.example && type.symbols && type.symbols.length > 0, `Puzzle type missing briefing assets: ${type.id}`);
    assert(type.answerMode, `Puzzle type missing answer mode: ${type.id}`);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const rawRound = type.generate(`direct-${type.id}`, attempt, attempt, avoid);
      const round = Object.assign({}, rawRound, {
        id: type.id,
        name: type.name,
        sourceWorld: type.sourceWorld,
        difficulty: type.difficulty,
        answerMode: rawRound.answerMode || type.answerMode,
        cognitiveSkill: type.cognitiveSkill,
        symbols: type.symbols,
        briefing: type.briefing,
        example: type.example,
        validator: type.validator,
        cells: rawRound.board
      });

      validateRoundShape(round);
      assert(!avoid.includes(round.breakSignature), `Break signature did not vary for ${type.id}`);
      avoid.push(round.breakSignature);

      if (type.id === "chess-attack") {
        round.board.forEach((cell) => {
          if (cell.value && cell.value.piece) {
            chessPieces.add(cell.value.piece);
            assert(cell.value.piece !== "pawn", "Chess Attack must not use pawns");
            assert(cell.cornerLabel, "Chess Attack number badge must be on the piece square");
          }
        });
      }
    }

    if (!type.retired) {
      seenAnswerModes.add(type.answerMode);
    }
  });

  ["identifyOne", "chooseOne", "multiSelect", "twoStep"].forEach((mode) => {
    assert(seenAnswerModes.has(mode), `Production pool missing answer mode ${mode}`);
  });
  ["king", "queen", "rook", "bishop", "knight"].forEach((piece) => {
    assert(chessPieces.has(piece), `Chess Attack did not generate ${piece}`);
  });
}

function validateGoPuzzles() {
  const captureType = puzzles.puzzleTypes.find((type) => type.id === "go-capture-max");
  const libertiesType = puzzles.puzzleTypes.find((type) => type.id === "go-liberties");

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const capture = captureType.generate(`go-capture-${attempt}`, 3, attempt, []);
    const captureResult = puzzles.validateGoCaptureMax(capture);

    assert(captureResult.valid, "Go Capture Max generated an invalid board");
    assert(captureResult.answers.length === 1, "Go Capture Max must have exactly one best move");
    assert(capture.choiceScores.find((score) => score.index === captureResult.answers[0]).score >= 2, "Go Capture Max best move must capture at least two stones");

    const liberties = libertiesType.generate(`go-liberties-${attempt}`, 3, attempt, []);
    const libertiesResult = puzzles.validateGoLiberties(liberties);

    assert(libertiesResult.valid, "Go Liberties generated an invalid board");
    assert(libertiesResult.answers.length >= 1, "Go Liberties must require at least one liberty");
    assert(sameSet(libertiesResult.answers, liberties.answerIndices), "Go Liberties answer set must match marked group liberties");
  }
}

function validateScoringReferences() {
  const score = scoring.calculateScore(18200, 2);
  const game = fs.readFileSync(path.join(__dirname, "../public/game.js"), "utf8");
  const scoringSource = fs.readFileSync(path.join(__dirname, "../public/scoring.js"), "utf8");

  assert(score.baseSeconds === 19 && score.mistakePenaltySeconds === 20 && score.scoreSeconds === 39, "Lower-is-better scoring calculation regressed");
  assert(!/score\s*=\s*Math\.max\(0,\s*1000/i.test(game + scoringSource), "Old opaque scoring formula still appears");
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
validateGoPuzzles();
validateScoringReferences();

console.log(`Validated advanced pattern systems: ${puzzles.puzzleTypes.length} total types, ${puzzles.puzzleTypes.filter((type) => !type.retired).length} active, 300 dates, 5 attempts.`);
