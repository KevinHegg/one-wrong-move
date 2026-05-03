#!/usr/bin/env node
"use strict";

const symbols = require("../public/symbols.js");
const puzzles = require("../public/puzzles.js");

const BANNED_PRIMARY = new Set(["PL", "IN", "FR", "SN", "HW", "FI", "BR", "RB", "FX", "BE", "FL"]);
const ALLOWED_TEXT = new Set(["AND", "OR", "XOR", "NAND", "NOT", "A", "K", "Q", "J", "10", "S", "F", "Exit", "Key"]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function dateKeyFromOffset(offset) {
  const start = Date.UTC(2026, 4, 2);
  return new Date(start + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function isBanned(value) {
  return BANNED_PRIMARY.has(String(value || "").trim());
}

function validateSymbolRecord(symbol) {
  assert(symbol.label || symbol.ariaLabel, `Symbol ${symbol.id || symbol.glyph} is missing a readable label`);
  assert(!isBanned(symbol.glyph), `Symbol ${symbol.id} uses banned abbreviation glyph ${symbol.glyph}`);
  if (symbol.category === "ecology") {
    assert(symbol.glyph && !/^[A-Z]{2}$/.test(symbol.glyph), `Ecology symbol ${symbol.id} must use a real glyph or full label`);
    assert(symbol.label && symbol.ariaLabel, `Ecology symbol ${symbol.id} needs label and ariaLabel`);
  }
}

function validateSymbolChip(symbol, owner) {
  if (typeof symbol === "string") {
    assert(!isBanned(symbol), `${owner} exposes banned abbreviation chip ${symbol}`);
    return;
  }
  assert(symbol.label || symbol.ariaLabel, `${owner} symbol chip lacks readable text`);
  assert(!isBanned(symbol.glyph), `${owner} exposes banned abbreviation chip ${symbol.glyph}`);
}

function validateCell(cell, owner) {
  assert(cell.ariaLabel || cell.label || cell.glyph, `${owner} cell ${cell.index} lacks accessible text`);
  assert(!isBanned(cell.glyph), `${owner} cell ${cell.index} uses banned primary glyph ${cell.glyph}`);
  if (cell.value && cell.value.label) {
    assert(!isBanned(cell.value.label), `${owner} cell ${cell.index} has banned visible label ${cell.value.label}`);
  }
  if (cell.subLabel) {
    assert(!isBanned(cell.subLabel), `${owner} cell ${cell.index} has banned subLabel ${cell.subLabel}`);
  }
}

symbols.allSymbols.forEach(validateSymbolRecord);

for (let day = 0; day < 120; day += 1) {
  const dateKey = dateKeyFromOffset(day);
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const ladder = puzzles.generateSurvivalLevels(dateKey, attempt, [], 30);
    const freeplay = puzzles.generateFreePlaySet(dateKey, attempt, []);

    ladder.levels.concat(freeplay.levels).forEach((round) => validateRound(round));
  }
}

puzzles.puzzleTypes.filter((type) => !type.retired).forEach((type) => {
  const avoid = [];
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const round = puzzles.normalizeTypeRound(type, type.generate(`symbol-display-${type.id}`, attempt, attempt, avoid), attempt);
    validateRound(round);
    avoid.push(round.breakSignature);
  }
});

function validateRound(round) {
  const owner = `${round.id} ${round.breakSignature || ""}`;
  const allText = [
    round.briefing,
    round.instruction,
    round.wrongTapHint,
    round.explanation,
    round.evidence,
    round.example && round.example.caption
  ].join(" ");

  BANNED_PRIMARY.forEach((token) => {
    assert(!new RegExp(`\\b${token}\\b`).test(allText), `${owner} copy exposes banned abbreviation ${token}`);
  });
  (round.symbolBank || round.symbols || []).forEach((symbol) => validateSymbolChip(symbol, owner));
  (round.example && round.example.cells || []).forEach((cell) => {
    if (!ALLOWED_TEXT.has(String(cell))) {
      assert(!isBanned(cell), `${owner} example exposes banned abbreviation ${cell}`);
    }
  });
  round.board.forEach((cell) => validateCell(cell, owner));

  if (round.id === "animal-food-web") {
    assert(round.board.some((cell) => cell.glyph === "🌱"), "Animal Food Web should render plant glyphs");
    assert(round.board.some((cell) => cell.glyph === "🐛"), "Animal Food Web should render insect glyphs");
    assert(!round.board.some((cell) => BANNED_PRIMARY.has(cell.glyph)), "Animal Food Web board still has abbreviation glyphs");
  }
  if (round.id === "pair-pact") {
    assert(!round.board.some((cell) => cell.glyph === "BE" || cell.glyph === "FL"), "Pair Pact still has BE/FL glyphs");
  }
}

console.log("Validated symbol display: no banned animal/relationship abbreviations, readable chips, and ecology glyph labels.");
