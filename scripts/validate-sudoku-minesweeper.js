const puzzles = require("../public/puzzles.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const REQUIRED_IDS = [
  "mini-sudoku-swap",
  "sudoku-conflict",
  "minesweeper-forced-mine",
  "minesweeper-mark-all"
];

function dateKey(offset) {
  const start = Date.UTC(2026, 4, 2);
  const date = new Date(start + offset * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function normalize(type, seed, number, attempt) {
  const raw = type.generate(`${seed}|sudoku-minesweeper|${type.id}|${attempt}|${number}`, number, attempt, []);
  return puzzles.normalizeTypeRound(type, raw, number);
}

function typeById(id) {
  const type = puzzles.puzzleTypes.find((candidate) => candidate.id === id);
  assert(type, `Missing puzzle type: ${id}`);
  return type;
}

function requiredShape(round) {
  assert(round.id, "Missing id");
  assert(round.name, `Missing name for ${round.id}`);
  assert(round.sourceWorld, `Missing source world for ${round.id}`);
  assert(round.difficulty, `Missing difficulty for ${round.id}`);
  assert(round.answerMode, `Missing answer mode for ${round.id}`);
  assert(round.targeting && round.targeting.targetType, `Missing targeting for ${round.id}`);
  assert(round.briefing, `Missing briefing for ${round.id}`);
  assert(round.example && round.example.cells && round.example.cells.length, `Missing example for ${round.id}`);
  assert(round.symbols && round.symbols.length, `Missing symbols for ${round.id}`);
  assert(round.board && round.board.length && round.board.length <= puzzles.CELL_COUNT, `Bad board size for ${round.id}`);
  assert(round.answerIndex !== undefined || (round.answerIndices && round.answerIndices.length), `Missing answer for ${round.id}`);
  assert(round.explanation, `Missing explanation for ${round.id}`);
  assert(round.wrongTapHint, `Missing wrong tap hint for ${round.id}`);
  assert(round.breakSignature, `Missing break signature for ${round.id}`);
  assert(round.evidence, `Missing evidence for ${round.id}`);
  assert(round.validator, `Missing validator for ${round.id}`);
}

function validateSudokuRound(round) {
  requiredShape(round);
  assert(round.sourceWorld === "Sudoku", `Wrong source world for ${round.id}`);
  assert(round.columns === 4, `${round.id} must render as 4 columns`);
  assert(round.board.length === 16, `${round.id} must be a 4x4 board`);
  assert(round.board.every((cell) => cell.value && cell.value.sudoku), `${round.id} cells must carry Sudoku values`);

  if (round.id === "mini-sudoku-swap") {
    assert(round.answerMode === "multiSelect", "Mini Sudoku Swap must be multiSelect");
    assert(round.answerIndices.length === 2, "Mini Sudoku Swap must have exactly two answer cells");
    const digits = puzzles.sudokuDigitsFromBoard(round.board);
    const repairs = puzzles.findSudokuSwapRepairs(digits);
    assert(repairs.length === 1, "Mini Sudoku Swap must have exactly one restoring swap");
    assert(sameSet(repairs[0].indices, round.answerIndices), "Mini Sudoku Swap answer must match the unique restoring swap");
    const repaired = digits.slice();
    const [a, b] = round.answerIndices;
    const temp = repaired[a];
    repaired[a] = repaired[b];
    repaired[b] = temp;
    assert(puzzles.isValidMiniSudokuDigits(repaired), "Mini Sudoku Swap final board must satisfy rows, columns, and boxes");
  }

  if (round.id === "sudoku-conflict") {
    assert(round.answerMode === "identifyOne", "Sudoku Conflict must be identifyOne");
    assert(round.answerIndices.length === 1, "Sudoku Conflict must have exactly one wrong cell");
    const repairs = puzzles.findSudokuSingleRepairs(puzzles.sudokuDigitsFromBoard(round.board));
    assert(repairs.length === 1, "Sudoku Conflict must have exactly one repair cell");
    assert(repairs[0].index === round.answerIndex, "Sudoku Conflict answerIndex must match unique repair");
  }
}

function validateMinesweeperRound(round) {
  requiredShape(round);
  assert(round.sourceWorld === "Minesweeper", `Wrong source world for ${round.id}`);
  assert(round.columns === 5 || !round.columns, `${round.id} should render as 5 columns`);
  assert(round.board.length === 25, `${round.id} must use a 5x5 board`);
  assert(round.board.every((cell) => !(cell.value && cell.value.mine && cell.glyph === "💣")), `${round.id} active board reveals a mine`);
  assert(round.board.filter((cell) => cell.value && cell.value.minesweeper === "clue").every((cell) => cell.interactive === false && cell.selectable === false), `${round.id} clue cells must be disabled`);
  assert(round.board.filter((cell) => cell.selectable !== false && cell.interactive !== false).every((cell) => cell.value && cell.value.minesweeper === "hidden"), `${round.id} selectable cells must be hidden candidates`);

  const layouts = puzzles.enumerateMinesweeperLayouts(round);
  assert(layouts.length > 0, `${round.id} must have at least one valid mine layout`);

  if (round.id === "minesweeper-forced-mine") {
    const forced = puzzles.forcedMineIndexes(layouts);
    assert(round.answerMode === "chooseOne", "Minesweeper Forced Mine must be chooseOne");
    assert(forced.length === 1, "Minesweeper Forced Mine must have exactly one forced mine");
    assert(forced[0] === round.answerIndex, "Minesweeper Forced Mine answer must be the forced mine");
  }

  if (round.id === "minesweeper-mark-all") {
    assert(round.answerMode === "multiSelect", "Minesweeper Mark All must be multiSelect");
    assert(layouts.length === 1, "Minesweeper Mark All must have a unique mine layout");
    assert(sameSet(layouts[0], round.answerIndices), "Minesweeper Mark All answerIndices must equal all mines");
  }
}

function validateDirectTypes() {
  REQUIRED_IDS.forEach((id) => {
    const type = typeById(id);
    for (let sample = 0; sample < 300; sample += 1) {
      const round = normalize(type, dateKey(sample), sample + 1, (sample % 5) + 1);
      const result = puzzles.validateRound(round);
      assert(result.valid, `Round validator failed for ${id} sample ${sample}`);
      if (round.sourceWorld === "Sudoku") {
        validateSudokuRound(round);
        assert(!type.sourceWorld.includes("Latin"), `${id} must not duplicate Latin Trap metadata`);
      } else {
        validateMinesweeperRound(round);
      }
    }
  });
}

function validateSelection() {
  for (let sample = 0; sample < 300; sample += 1) {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const seed = dateKey(sample);
      const ladder = puzzles.generateSurvivalLevels(seed, attempt, [], 20).levels;
      const freePlay = puzzles.generateFreePlaySet(seed, attempt, []).levels;

      assert(freePlay.length === 3, "Free Play must produce exactly 3 puzzles");
      ladder.forEach((level, index) => {
        if (level.id === "mini-sudoku-swap" || level.id === "minesweeper-forced-mine") {
          assert(index + 1 >= 4, `${level.id} appeared before level 4`);
        }
        if (level.id === "minesweeper-mark-all") {
          assert(index + 1 > 3, "Minesweeper Mark All appeared in the first three Ladder levels");
        }
      });
      const numberGridFreePlay = freePlay.filter((level) => level.sourceWorld === "Sudoku" || level.sourceWorld === "Minesweeper");
      assert(numberGridFreePlay.length <= 1 || freePlay.every((level) => level.difficulty <= 2), "Free Play selected too many hard number-grid puzzles");
    }
  }
}

function sameSet(a, b) {
  const left = [...new Set(a)].sort((x, y) => x - y);
  const right = [...new Set(b)].sort((x, y) => x - y);
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

validateDirectTypes();
validateSelection();
console.log("Validated Sudoku and Minesweeper puzzle families: 300 samples per type, Ladder placement, Free Play placement, uniqueness, and targeting.");
