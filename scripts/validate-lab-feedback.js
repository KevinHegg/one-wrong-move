#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const puzzles = require("../public/puzzles.js");

const root = path.join(__dirname, "..");
const labHtml = fs.readFileSync(path.join(root, "public/lab.html"), "utf8");
const labSource = fs.readFileSync(path.join(root, "public/lab.js"), "utf8");
const gameSource = fs.readFileSync(path.join(root, "public/game.js"), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function has(pattern, label) {
  assert(pattern.test(labSource), `Lab feedback missing ${label}`);
}

assert(labHtml.includes("labReviewQueue"), "lab.html must include Review Queue section");
assert(labHtml.includes("labFeedbackSummary"), "lab.html must include Feedback Summary section");
assert(labHtml.includes("labExport"), "lab.html must include Export section");
assert(labHtml.includes("labReviewFilter"), "lab.html must include reviewed/unreviewed filter");
assert(labHtml.includes("labDecisionFilter"), "lab.html must include decision filter");
assert(labHtml.includes("labTagFilter"), "lab.html must include tag filter");
assert(labHtml.includes("config.js") && labHtml.includes("puzzles.js") && labHtml.includes("lab.js"), "lab.html must load required scripts");

has(/oneWrongMove\.labFeedback\.v1/, "versioned localStorage key");
has(/FEEDBACK_SCHEMA/, "feedback record schema");
has(/FEEDBACK_DECISIONS\s*=\s*\[[^\]]*"keep"[^\]]*"tweak"[^\]]*"cut"[^\]]*"needsMoreTesting"/s, "constrained decisions");
has(/FEEDBACK_TAGS\s*=\s*\[[^\]]*"too easy"[^\]]*"too hard"[^\]]*"confusing"[^\]]*"lab only"/s, "controlled tag vocabulary");
has(/RATING_FIELDS\s*=\s*\[[^\]]*"fun"[^\]]*"difficultyFelt"[^\]]*"clarity"[^\]]*"fairness"/s, "rating field constraints");
has(/Math\.max\(1,\s*Math\.min\(5/, "1-5 rating clamp");
has(/function exportFeedbackJson/, "JSON export function");
has(/function exportFeedbackCsv/, "CSV export function");
has(/function buildMarkdownSummary/, "Markdown summary function");
has(/function buildChatGptPrompt/, "ChatGPT prompt export");
has(/function applyDirectLinkParams/, "direct-link parsing");
has(/params\.get\("type"\)/, "type query parameter");
has(/params\.get\("seed"\)/, "seed query parameter");
has(/params\.get\("attempt"\)/, "attempt query parameter");
has(/function renderReviewQueue/, "Review Queue renderer");
has(/function renderFeedbackSummary/, "Feedback Summary renderer");
has(/function renderRatingPanel/, "rating panel renderer");
has(/function saveFeedbackRecord/, "feedback save handler");
has(/function clearAllFeedback/, "clear-all handler");
has(/function startBlindTry/, "embedded Try blind mode");
has(/function toggleAnswer/, "answer hidden/shown behavior");
has(/function renderRoundCard/, "production puzzle card renderer");
has(/function renderSection/, "retired puzzle section renderer");

assert(!gameSource.includes("oneWrongMove.labFeedback.v1"), "Lab feedback storage must not affect main game state");
assert(gameSource.includes("Ladder Run") && gameSource.includes("Three-Set Free Play"), "Main game should still expose both modes");

const activeTypes = puzzles.puzzleTypes.filter((type) => !type.retired);
const retiredTypes = puzzles.puzzleTypes.filter((type) => type.retired);
assert(activeTypes.length > 10, "Expected active production puzzle inventory");
assert(retiredTypes.length > 0, "Expected retired/lab-only puzzle inventory");

activeTypes.concat(retiredTypes).forEach((type, index) => {
  const raw = type.generate(`lab-feedback-${type.id}`, index + 1, 1, []);
  const round = puzzles.normalizeTypeRound(type, raw, index + 1);
  const validation = type.validate(round);

  assert(round.id && round.name, `Generated lab round missing id/name for ${type.id}`);
  assert(round.targeting, `Generated lab round missing targeting for ${type.id}`);
  assert(round.board && round.board.length > 0, `Generated lab board is empty for ${type.id}`);
  assert(validation.valid, `Generated lab sample failed validation for ${type.id}`);
});

console.log("Validated lab feedback model, review queue, rating/export tools, direct links, card rendering hooks, and main-game isolation.");
