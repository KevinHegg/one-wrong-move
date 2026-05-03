(function (root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./symbols.js"));
  } else {
    root.OneWrongMovePuzzles = factory(root.OWM_SYMBOLS);
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function (Symbols) {
  "use strict";

  var GRID_SIZE = 5;
  var CELL_COUNT = GRID_SIZE * GRID_SIZE;
  var LAUNCH_DATE = "2026-05-02";
  var ANSWER_MODES = {
    identifyOne: "identifyOne",
    chooseOne: "chooseOne",
    multiSelect: "multiSelect"
  };

  var S = Symbols.packs;
  var ABSTRACT = S.abstract;
  var CARDS = S.cards;
  var CHESS = S.chess;
  var GO = S.go;
  var LOGIC = S.logic;
  var DICE = S.dice;
  var DIRECTIONS = S.directions;
  var ANIMALS = S.animals;

  var PAIR_SYMBOLS = [
    { a: "☾", b: "☀", aLabel: "moon", bLabel: "sun" },
    { a: "⚿", b: "▣", aLabel: "key", bLabel: "lock" },
    { a: "☠", b: "⚚", aLabel: "skull", bLabel: "bone" },
    { a: "BE", b: "FL", aLabel: "bee", bLabel: "flower" },
    { a: "◉", b: "👁", aLabel: "eye mark", bLabel: "eye" }
  ];

  var puzzleTypes = [
    type({
      id: "rule-rows",
      name: "Rule Rows",
      sourceWorld: "Symbol Grammar",
      difficulty: 1,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "sequence grammar",
      isAbstractGlyphPuzzle: true,
      retired: true,
      retiredReason: "Retired from daily play: the answer is too often findable by diagonal scanning.",
      symbols: ABSTRACT.slice(0, 8),
      briefing: "Each row follows a shifted symbol recipe. Find the glyph that breaks its row.",
      example: example(5, "A shifted symbol recipe repeats with a new starting point.", ["☾", "◆", "♛", "☇", "◉"]),
      generate: generateRuleRows,
      validator: validateExpectedMismatch
    }),
    type({
      id: "conveyor-shift",
      name: "Conveyor Shift",
      sourceWorld: "Symbol Grammar",
      difficulty: 2,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "spatial transformation",
      isAbstractGlyphPuzzle: true,
      retired: true,
      retiredReason: "Retired from daily play: the shift can be solved by shallow diagonal scanning.",
      symbols: ABSTRACT.slice(0, 5),
      briefing: "Each row is the previous row shifted like a conveyor belt. Find the slipped tile.",
      example: example(5, "Each new row moves the recipe one slot.", ["☾", "◆", "♛", "☇", "◉"]),
      generate: generateConveyorShift,
      validator: validateExpectedMismatch
    }),
    type({
      id: "knight-path",
      name: "Knight Path",
      sourceWorld: "Chess",
      difficulty: 3,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "legal movement",
      isMovementPuzzle: true,
      retired: true,
      retiredReason: "Retired from daily play: Chess Attack is the richer chess movement puzzle.",
      symbols: CHESS.filter(hasTag("knight")),
      briefing: "Numbered knights should move in legal L-shapes. Tap the first illegal knight.",
      example: example(4, "A knight moves two squares in one direction and one square across.", ["1♞", "", "", "2♞"]),
      generate: generateKnightPath,
      validator: validateFirstIllegalKnight
    }),
    type({
      id: "suit-cycle",
      name: "Suit Cycle",
      sourceWorld: "Cards",
      difficulty: 1,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "cyclic attributes",
      symbols: cardSymbols(),
      briefing: "Suits cycle across the row and shift by row. Tap the card with the wrong suit.",
      example: example(4, "The suit cycle shifts: ♠, ♥, ♦, ♣.", ["A♠", "A♥", "A♦", "A♣"]),
      generate: generateSuitCycle,
      validator: validateExpectedMismatch
    }),
    type({
      id: "pair-pact",
      name: "Pair Pact",
      sourceWorld: "Relationships",
      difficulty: 1,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "pair inference",
      symbols: ["☾", "☀", "⚿", "▣", "☠", "⚚", "BE", "FL"],
      briefing: "Symbols travel in real-world partner pairs. Tap the symbol with the wrong partner.",
      example: example(5, "Moon pairs with sun; key pairs with lock.", ["☾", "☀", "•", "⚿", "▣"]),
      generate: generatePairPact,
      validator: validateExpectedMismatch
    }),
    type({
      id: "domino-chain",
      name: "Domino Chain",
      sourceWorld: "Dominoes",
      difficulty: 1,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "matching chain",
      symbols: DICE,
      briefing: "Neighboring domino halves must match. Tap the domino that breaks the chain.",
      example: example(4, "The right half of one domino matches the left half of the next.", ["1|3", "3|5", "5|2", "2|4"]),
      generate: generateDominoChain,
      validator: validateExpectedMismatch
    }),
    type({
      id: "dice-sum",
      name: "Dice Sum",
      sourceWorld: "Dice",
      difficulty: 1,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "small arithmetic",
      symbols: DICE,
      briefing: "Rows show three dice and a total. Tap the die or total that breaks the sum.",
      example: example(5, "2 + 3 + 1 = 6.", ["2", "3", "1", "=", "6"]),
      generate: generateDiceSum,
      validator: validateExpectedMismatch
    }),
    type({
      id: "card-straight",
      name: "Card Straight",
      sourceWorld: "Cards",
      difficulty: 2,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "rank progression",
      symbols: cardSymbols(),
      briefing: "Each row is a short straight. Tap the card that breaks rank or suit logic.",
      example: example(5, "A clean straight: A♠ 2♥ 3♦ 4♣ 5♠.", ["A♠", "2♥", "3♦", "4♣", "5♠"]),
      generate: generateCardStraight,
      validator: validateExpectedMismatch
    }),
    type({
      id: "logic-gate-row",
      name: "Logic Gate Row",
      sourceWorld: "Logic",
      difficulty: 2,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "boolean logic",
      symbols: LOGIC,
      briefing: "Each row is A, B, gate, equals, output. Tap the wrong output.",
      example: example(5, "1 XOR 0 should output 1.", ["1", "0", "XOR", "=", "1"]),
      generate: generateLogicGateRow,
      validator: validateExpectedMismatch
    }),
    type({
      id: "mirror-trap",
      name: "Mirror Trap",
      sourceWorld: "Relationships",
      difficulty: 2,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "mapping inference",
      symbols: ["☾", "☀", "⚿", "▣", "☠", "⚚", "BE", "FL"],
      briefing: "The right side mirrors the left, but symbols transform into counterparts.",
      example: example(5, "A mirror copy changes key into lock and skull into bone.", ["⚿", "☠", "↔", "⚚", "▣"]),
      generate: generateMirrorTrap,
      validator: validateExpectedMismatch
    }),
    type({
      id: "chess-attack",
      name: "Chess Attack",
      sourceWorld: "Chess",
      difficulty: 3,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "attack sequence",
      isMovementPuzzle: true,
      symbols: CHESS.filter(function (symbol) { return !hasTag("pawn")(symbol); }),
      briefing: "Follow the numbers. Each chess piece must attack the next numbered piece. Tap the first illegal attacker.",
      example: example(5, "Rook straight, bishop diagonal, knight L, queen straight/diagonal, king one square.", ["♜¹", "→", "♝²", "→", "♞³"]),
      generate: generateChessAttack,
      validator: validateChessAttack
    }),
    type({
      id: "poker-hand-trap",
      name: "Poker Hand Trap",
      sourceWorld: "Cards",
      difficulty: 3,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "hand classification",
      symbols: cardSymbols(),
      briefing: "Each row names a tiny poker pattern. Tap the card that ruins its row.",
      example: example(5, "PAIR means two matching ranks; FLUSH means same suit; RUN means consecutive ranks.", ["PAIR", "7♠", "7♥", "4♦", "Q♣"]),
      generate: generatePokerHandTrap,
      validator: validateExpectedMismatch
    }),
    type({
      id: "train-route",
      name: "Train Route",
      sourceWorld: "Routes",
      difficulty: 3,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "connection tracing",
      isMovementPuzzle: true,
      symbols: ["S", "F", "─", "│", "┌", "┐", "└", "┘"],
      briefing: "Track tiles should form one continuous route from S to F. Tap the broken tile.",
      example: example(5, "Track ends must connect: S ─ ┐ turns down.", ["S", "─", "┐", "│", "F"]),
      generate: generateTrainRoute,
      validator: validateExpectedMismatch
    }),
    type({
      id: "go-capture-max",
      name: "Go Capture Max",
      sourceWorld: "Go",
      difficulty: 4,
      answerMode: ANSWER_MODES.chooseOne,
      cognitiveSkill: "capture reading",
      symbols: GO,
      briefing: "Black to play. Tap the empty intersection that captures the most white stones.",
      example: example(5, "Fill the last liberty of a white group to capture it.", ["●", "○", "·", "○", "●"]),
      generate: generateGoCaptureMax,
      validator: validateGoCaptureMax
    }),
    type({
      id: "go-liberties",
      name: "Go Liberties",
      sourceWorld: "Go",
      difficulty: 4,
      answerMode: ANSWER_MODES.multiSelect,
      cognitiveSkill: "orthogonal adjacency",
      symbols: GO,
      briefing: "Tap every liberty of the marked group, then submit.",
      example: example(5, "Only empty orthogonal neighbors are liberties; diagonals do not count.", ["·", "+", "●", "+", "·"]),
      generate: generateGoLiberties,
      validator: validateGoLiberties
    }),
    type({
      id: "rotation-logic",
      name: "Rotation Logic",
      sourceWorld: "Compass",
      difficulty: 2,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "rotation sequence",
      symbols: DIRECTIONS,
      briefing: "Directions rotate by a consistent step. Find the one that missed the turn.",
      example: example(4, "A quarter-turn rhythm: north, east, south, west.", ["N", "E", "S", "W"]),
      generate: generateRotationLogic,
      validator: validateExpectedMismatch
    }),
    type({
      id: "latin-trap",
      name: "Latin Trap",
      sourceWorld: "Symbol Grammar",
      difficulty: 2,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "row-column constraints",
      isAbstractGlyphPuzzle: true,
      symbols: ABSTRACT.slice(0, 5),
      briefing: "Every row and column should contain one of each symbol. Find the cell causing both repeats.",
      example: example(5, "Every row and column wants one of each symbol.", ["☾", "☀", "◆", "♛", "◉"]),
      generate: generateLatinTrap,
      validator: validateExpectedMismatch
    }),
    type({
      id: "checkers-jump",
      name: "Checkers Jump",
      sourceWorld: "Checkers",
      difficulty: 3,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "diagonal movement",
      isMovementPuzzle: true,
      symbols: S.checkers,
      briefing: "Numbered checkers must step diagonally. Tap the first illegal move.",
      example: example(4, "Checkers move along diagonals on dark squares.", ["1", "", "", "2"]),
      generate: generateCheckersJump,
      validator: validateFirstIllegalDiagonal
    }),
    type({
      id: "animal-food-web",
      name: "Animal Food Web",
      sourceWorld: "Ecology",
      difficulty: 2,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "relationship ordering",
      symbols: ANIMALS,
      briefing: "Each row shows an obvious food chain. Tap the animal that does not belong.",
      example: example(5, "Plant feeds insect, frog eats insect, snake eats frog, hawk hunts snake.", ["PL", "IN", "FR", "SN", "HW"]),
      generate: generateAnimalFoodWeb,
      validator: validateExpectedMismatch
    }),
    type({
      id: "compass-rose",
      name: "Compass Rose",
      sourceWorld: "Compass",
      difficulty: 2,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "rotation sequence",
      symbols: DIRECTIONS,
      briefing: "Directions rotate by the same amount in each row. Tap the direction that misses the rotation.",
      example: example(5, "Quarter turns: N, E, S, W, N.", ["N", "E", "S", "W", "N"]),
      generate: generateCompassRose,
      validator: validateExpectedMismatch
    })
  ];

  function type(config) {
    return {
      id: config.id,
      name: config.name,
      sourceWorld: config.sourceWorld,
      difficulty: config.difficulty,
      answerMode: config.answerMode || ANSWER_MODES.identifyOne,
      cognitiveSkill: config.cognitiveSkill,
      isAbstractGlyphPuzzle: Boolean(config.isAbstractGlyphPuzzle),
      isMovementPuzzle: Boolean(config.isMovementPuzzle),
      retired: Boolean(config.retired),
      retiredReason: config.retiredReason || "",
      symbols: config.symbols.map(symbolLabel),
      symbolBank: config.symbols.map(symbolLabel),
      briefing: config.briefing,
      briefingText: config.briefing,
      example: config.example,
      exampleData: cloneExample(config.example),
      generate: config.generate,
      validator: config.validator,
      validate: config.validator
    };
  }

  function generateDailyPuzzle(dateKey, sessionAttempt, usedBreakSignatures) {
    var attempt = Number(sessionAttempt) || 1;
    var used = usedBreakSignatures || [];
    var random = createRandom(dateKey + "|selection|" + attempt);
    var selected = selectDailyTypes(random);
    var rounds = selected.map(function (selectedType, index) {
      var roundNumber = index + 1;
      var avoidForType = used.filter(function (signature) {
        return signature.indexOf(selectedType.id + "|") === 0;
      });
      return normalizeRound(selectedType, selectedType.generate(dateKey + "|" + attempt + "|" + selectedType.id + "|" + roundNumber, roundNumber, attempt, avoidForType), roundNumber);
    });

    return {
      dateKey: dateKey,
      sessionAttempt: attempt,
      rounds: rounds
    };
  }

  function selectDailyTypes(random) {
    var ranges = [[1, 2], [2, 3], [3, 4, 5]];
    var selected = [];
    var activeTypes = puzzleTypes.filter(function (candidate) {
      return !candidate.retired;
    });

    ranges.forEach(function (range, roundIndex) {
      var candidates = activeTypes.filter(function (candidate) {
        return range.indexOf(candidate.difficulty) !== -1 && selected.every(function (chosen) {
          return chosen.id !== candidate.id;
        });
      });

      if (roundIndex === 0) {
        candidates = prefer(candidates, function (candidate) {
          return ["suit-cycle", "domino-chain", "dice-sum", "pair-pact"].indexOf(candidate.id) !== -1;
        });
      }
      if (roundIndex === 1) {
        candidates = prefer(candidates, function (candidate) {
          return ["card-straight", "logic-gate-row", "mirror-trap", "chess-attack"].indexOf(candidate.id) !== -1;
        });
      }
      if (roundIndex === 2) {
        candidates = prefer(candidates, function (candidate) {
          return ["go-capture-max", "go-liberties", "poker-hand-trap", "train-route", "chess-attack"].indexOf(candidate.id) !== -1;
        });
      }

      candidates = prefer(candidates, function (candidate) {
        return selected.every(function (chosen) {
          return chosen.sourceWorld !== candidate.sourceWorld;
        });
      });
      candidates = prefer(candidates, function (candidate) {
        return candidate.sourceWorld !== "Cards" || selected.every(function (chosen) {
          return chosen.sourceWorld !== "Cards";
        });
      });
      candidates = prefer(candidates, function (candidate) {
        return candidate.sourceWorld !== "Go" || selected.every(function (chosen) {
          return chosen.sourceWorld !== "Go";
        });
      });
      candidates = prefer(candidates, function (candidate) {
        return !candidate.isMovementPuzzle || selected.every(function (chosen) {
          return !chosen.isMovementPuzzle;
        });
      });
      candidates = prefer(candidates, function (candidate) {
        return !candidate.isAbstractGlyphPuzzle || selected.every(function (chosen) {
          return !chosen.isAbstractGlyphPuzzle;
        });
      });

      selected.push(shuffle(candidates, random)[0]);
    });

    return selected;
  }

  function prefer(candidates, predicate) {
    var preferred = candidates.filter(predicate);
    return preferred.length > 0 ? preferred : candidates;
  }

  function normalizeRound(selectedType, round, roundNumber) {
    var answerMode = round.answerMode || selectedType.answerMode || ANSWER_MODES.identifyOne;
    var answerIndices = round.answerIndices || (typeof round.answerIndex === "number" ? [round.answerIndex] : []);
    var normalized = Object.assign({}, round);

    normalized.id = selectedType.id;
    normalized.name = selectedType.name;
    normalized.sourceWorld = selectedType.sourceWorld;
    normalized.difficulty = selectedType.difficulty;
    normalized.answerMode = answerMode;
    normalized.cognitiveSkill = selectedType.cognitiveSkill;
    normalized.roundNumber = roundNumber;
    normalized.symbols = selectedType.symbols.slice();
    normalized.symbolBank = normalized.symbols.slice();
    normalized.briefing = selectedType.briefing;
    normalized.briefingText = selectedType.briefing;
    normalized.example = cloneExample(selectedType.example);
    normalized.exampleData = cloneExample(selectedType.example);
    normalized.title = "Round " + roundNumber + ": " + selectedType.name;
    normalized.validator = selectedType.validator;
    normalized.rule = selectedType.briefing;
    normalized.answerIndices = uniqueSorted(answerIndices);
    normalized.answerIndex = typeof round.answerIndex === "number" ? round.answerIndex : normalized.answerIndices[0];
    normalized.minSelections = round.minSelections || (answerMode === ANSWER_MODES.multiSelect ? normalized.answerIndices.length : 1);
    normalized.maxSelections = round.maxSelections || (answerMode === ANSWER_MODES.multiSelect ? normalized.answerIndices.length : 1);
    normalized.submitLabel = round.submitLabel || (answerMode === ANSWER_MODES.multiSelect ? "Submit" : "");
    normalized.instruction = round.instruction || instructionForMode(answerMode);
    normalized.hint = round.wrongTapHint;
    normalized.cells = normalized.board;
    normalized.valid = selectedType.validator(normalized).valid;
    return normalized;
  }

  function instructionForMode(answerMode) {
    if (answerMode === ANSWER_MODES.chooseOne) {
      return "Choose the best move square.";
    }
    if (answerMode === ANSWER_MODES.multiSelect) {
      return "Select every required square, then submit.";
    }
    return "Infer the rule from the board, then tap the one symbol that breaks it.";
  }

  function makeExpectedRound(typeId, config) {
    var candidates = shuffle(config.candidates.filter(function (candidate) {
      return candidate.wrong.glyph !== config.expectedBoard[candidate.answerIndex].glyph ||
        candidate.wrong.cornerLabel !== config.expectedBoard[candidate.answerIndex].cornerLabel ||
        JSON.stringify(candidate.wrong.value) !== JSON.stringify(config.expectedBoard[candidate.answerIndex].value);
    }), config.random);
    var selected = selectCandidate(candidates, config.avoidBreakSignatures || []);
    var board = cloneBoard(config.expectedBoard);
    var expected = cloneBoard(config.expectedBoard);
    var wrong = Object.assign({}, board[selected.answerIndex], selected.wrong);

    wrong.expectedGlyph = expected[selected.answerIndex].glyph;
    wrong.expectedValue = expected[selected.answerIndex].value;
    wrong.breakMode = selected.breakMode;
    board[selected.answerIndex] = hydrateCell(selected.answerIndex, wrong);

    return {
      answerMode: ANSWER_MODES.identifyOne,
      board: board,
      expected: expected,
      answerIndex: selected.answerIndex,
      answerIndices: [selected.answerIndex],
      explanation: config.explanation,
      wrongTapHint: config.wrongTapHint,
      breakSignature: selected.breakSignature,
      breakMode: selected.breakMode,
      fallbackUsed: selected.fallbackUsed,
      evidence: config.evidence(selected, expected, board),
      relatedIndexes: config.relatedIndexes ? config.relatedIndexes(selected.answerIndex) : []
    };
  }

  function generateRuleRows(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var symbols = ABSTRACT.slice(0, 5);
    var outsiders = ABSTRACT.slice(5, 8);
    var expectedBoard = [];
    var candidates = [];

    forEachIndex(function (index, row, col) {
      expectedBoard[index] = token(index, symbols[(row + col) % symbols.length], "abstract", ["token-abstract"]);
    });
    expectedBoard.forEach(function (expectedCell, index) {
      addCandidate(candidates, "rule-rows", "wrong-next-symbol", index, token(index, symbols[(symbolIndex(symbols, expectedCell.glyph) + 1) % symbols.length], "abstract", ["token-abstract"]));
      addCandidate(candidates, "rule-rows", "outside-recipe", index, token(index, outsiders[index % outsiders.length], "abstract", ["token-abstract"]));
    });
    return makeExpectedRound("rule-rows", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That glyph breaks the shifted row grammar.", "Compare this row to the shifted recipe established by the other rows.", function (selected) {
      return "The retired row recipe expects a different symbol at this square, but shows " + selected.wrong.glyph + ".";
    }));
  }

  function generateConveyorShift(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var symbols = ABSTRACT.slice(0, 5);
    var expectedBoard = [];
    var candidates = [];

    forEachIndex(function (index, row, col) {
      expectedBoard[index] = token(index, symbols[mod(col + row, GRID_SIZE)], "conveyor", ["token-abstract"]);
    });
    expectedBoard.forEach(function (cell, index) {
      var row = Math.floor(index / GRID_SIZE);
      var col = index % GRID_SIZE;
      if (row > 0) {
        addCandidate(candidates, "conveyor-shift", "wrong-shifted-position", index, cloneWithIndex(index, expectedBoard[positionToIndex(row, mod(col + 1, GRID_SIZE))]));
        addCandidate(candidates, "conveyor-shift", "neighboring-column", index, cloneWithIndex(index, expectedBoard[positionToIndex(row, mod(col + 2, GRID_SIZE))]));
      }
    });
    return makeExpectedRound("conveyor-shift", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That tile does not follow the conveyor shift.", "Use the row above as the source, then shift the whole row one slot.", function () {
      return "The retired conveyor row is out of phase at the tapped cell.";
    }));
  }

  function generateSuitCycle(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var expectedBoard = [];
    var candidates = [];
    var ranks = ["A", "3", "5", "7", "9"];

    forEachIndex(function (index, row, col) {
      expectedBoard[index] = cardCell(index, ranks[row], mod(row + col, 4));
    });
    expectedBoard.forEach(function (cardCellValue, index) {
      addCandidate(candidates, "suit-cycle", "suit-from-wrong-cycle-position", index, cardCell(index, cardCellValue.value.rank, mod(cardCellValue.value.suitIndex + 1, 4)));
      addCandidate(candidates, "suit-cycle", "duplicate-suit", index, cardCell(index, cardCellValue.value.rank, mod(cardCellValue.value.suitIndex - 1, 4)));
      addCandidate(candidates, "suit-cycle", "rank-suit-mismatch", index, cardCell(index, ranks[mod(Math.floor(index / GRID_SIZE) + 1, ranks.length)], mod(cardCellValue.value.suitIndex + 2, 4)));
    });
    return makeExpectedRound("suit-cycle", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That card is off the suit cycle.", "Ignore card color; use the suit position in the repeating cycle.", function () {
      return "The rows shift a four-suit cycle; the tapped card uses the wrong suit for its position.";
    }));
  }

  function generatePairPact(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var pairs = PAIR_SYMBOLS.slice(0, 5);
    var order = shuffle(pairs.concat(pairs), random);
    var expectedBoard = [];
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      var left = order[row * 2];
      var right = order[row * 2 + 1] || order[0];
      [left.a, left.b, "•", right.a, right.b].forEach(function (glyph, col) {
        expectedBoard[positionToIndex(row, col)] = glyphCell(positionToIndex(row, col), glyph, col === 2 ? "divider" : "pair", col === 2 ? "divider" : "partner symbol", [col === 2 ? "token-divider" : "token-pair"]);
      });
    }
    [1, 4].forEach(function (col) {
      for (var row = 0; row < GRID_SIZE; row += 1) {
        var index = positionToIndex(row, col);
        addCandidate(candidates, "pair-pact", "wrong-partner", index, glyphCell(index, pairs[(row + col + 1) % pairs.length].b, "pair", "wrong partner", ["token-pair"]));
        addCandidate(candidates, "pair-pact", "leader-repeated", index, cloneWithIndex(index, expectedBoard[positionToIndex(row, col - 1)]));
      }
    });
    return makeExpectedRound("pair-pact", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That symbol breaks the pairing pact.", "Look for pairs that repeat elsewhere; one partner is with the wrong mate.", function () {
      return "The board repeats real-world pair pacts; the tapped symbol is not the established partner.";
    }));
  }

  function generateDominoChain(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var expectedBoard = [];
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      var start = mod(row + roundNumber, 6) + 1;
      for (var col = 0; col < GRID_SIZE; col += 1) {
        var left = mod(start + col - 1, 6) + 1;
        var right = mod(start + col, 6) + 1;
        expectedBoard[positionToIndex(row, col)] = dominoCell(positionToIndex(row, col), left, right);
      }
    }
    expectedBoard.forEach(function (cellValue, index) {
      addCandidate(candidates, "domino-chain", "left-side-mismatch", index, dominoCell(index, mod(cellValue.value.left + 1, 6) + 1, cellValue.value.right));
      addCandidate(candidates, "domino-chain", "right-side-mismatch", index, dominoCell(index, cellValue.value.left, mod(cellValue.value.right + 2, 6) + 1));
      addCandidate(candidates, "domino-chain", "swapped-domino", index, dominoCell(index, cellValue.value.right, cellValue.value.left));
    });
    return makeExpectedRound("domino-chain", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That domino breaks the matching chain.", "The right half of each domino should match the next domino's left half.", function () {
      return "Neighboring domino halves match across every clean row; the tapped domino breaks that handoff.";
    }));
  }

  function generateDiceSum(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var expectedBoard = [];
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      var a = mod(row + roundNumber, 6) + 1;
      var b = mod(row * 2 + 1, 6) + 1;
      var c = mod(row + 2, 6) + 1;
      var sum = a + b + c;
      [dieCell(positionToIndex(row, 0), a), dieCell(positionToIndex(row, 1), b), dieCell(positionToIndex(row, 2), c), glyphCell(positionToIndex(row, 3), "=", "math", "equals", ["token-equals"]), glyphCell(positionToIndex(row, 4), String(sum), "target", "sum target " + sum, ["token-target"], sum)].forEach(function (cell) {
        expectedBoard[cell.index] = cell;
      });
      addCandidate(candidates, "dice-sum", "sum-too-high", positionToIndex(row, 4), glyphCell(positionToIndex(row, 4), String(sum + 1), "target", "sum target " + (sum + 1), ["token-target"], sum + 1));
      addCandidate(candidates, "dice-sum", "sum-too-low", positionToIndex(row, 4), glyphCell(positionToIndex(row, 4), String(sum - 1), "target", "sum target " + (sum - 1), ["token-target"], sum - 1));
      addCandidate(candidates, "dice-sum", "die-breaks-total", positionToIndex(row, 1), dieCell(positionToIndex(row, 1), mod(b + 2, 6) + 1));
    }
    return makeExpectedRound("dice-sum", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That die or total breaks the row sum.", "Numbers stay small: add the first three dice and compare to the target.", function () {
      return "Each row's first three dice add to the target; the tapped cell is the only row whose math fails.";
    }));
  }

  function generateCardStraight(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var rankOffset = randomIndex(random, 5);
    var expectedBoard = [];
    var candidates = [];

    forEachIndex(function (index, row, col) {
      var rank = CARDS.ranks[rankOffset + row + col];
      expectedBoard[index] = cardCell(index, rank, mod(row + col, 4));
    });
    expectedBoard.forEach(function (cardCellValue, index) {
      var rankIndex = CARDS.ranks.indexOf(cardCellValue.value.rank);
      addCandidate(candidates, "card-straight", "wrong-rank", index, cardCell(index, CARDS.ranks[mod(rankIndex + 2, CARDS.ranks.length)], cardCellValue.value.suitIndex));
      addCandidate(candidates, "card-straight", "wrong-suit", index, cardCell(index, cardCellValue.value.rank, mod(cardCellValue.value.suitIndex + 1, 4)));
      addCandidate(candidates, "card-straight", "duplicate-rank", index, cardCell(index, CARDS.ranks[Math.max(0, rankIndex - 1)], cardCellValue.value.suitIndex));
      addCandidate(candidates, "card-straight", "skipped-rank", index, cardCell(index, CARDS.ranks[mod(rankIndex + 3, CARDS.ranks.length)], cardCellValue.value.suitIndex));
    });
    return makeExpectedRound("card-straight", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That card breaks the straight.", "Read each row as a rank progression; suits also follow a steady cycle.", function () {
      return "Each row forms a five-card straight with a consistent suit cycle; the tapped card breaks rank or suit order.";
    }));
  }

  function generateLogicGateRow(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var gates = ["AND", "OR", "XOR", "NAND"];
    var expectedBoard = [];
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      var a = (row + roundNumber) % 2;
      var b = Math.floor(row / 2) % 2;
      var gate = gates[row % gates.length];
      var output = logicOutput(gate, a, b);
      [logicCell(positionToIndex(row, 0), String(a)), logicCell(positionToIndex(row, 1), String(b)), logicCell(positionToIndex(row, 2), gate), glyphCell(positionToIndex(row, 3), "=", "logic", "equals", ["token-equals"]), logicCell(positionToIndex(row, 4), String(output))].forEach(function (cell) {
        expectedBoard[cell.index] = cell;
      });
      addCandidate(candidates, "logic-gate-row", gate.toLowerCase() + "-output-wrong", positionToIndex(row, 4), logicCell(positionToIndex(row, 4), String(output ? 0 : 1)));
    }
    return makeExpectedRound("logic-gate-row", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That output is wrong for the gate.", "Evaluate A and B through the gate; only one row outputs the wrong bit.", function (selected) {
      return "Rows establish tiny logic circuits; row " + (Math.floor(selected.answerIndex / GRID_SIZE) + 1) + " has the wrong output for its gate.";
    }));
  }

  function generateMirrorTrap(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var pairs = PAIR_SYMBOLS.slice(0, 4);
    var sequence = shuffle(pairs.concat(pairs), random);
    var expectedBoard = emptyBoard();
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      expectedBoard[positionToIndex(row, 2)] = glyphCell(positionToIndex(row, 2), "↔", "divider", "mirror divider", ["token-divider"]);
      for (var col = 0; col < 2; col += 1) {
        var pair = sequence[row * 2 + col] || sequence[0];
        var leftIndex = positionToIndex(row, col);
        var rightIndex = positionToIndex(row, GRID_SIZE - 1 - col);
        expectedBoard[leftIndex] = glyphCell(leftIndex, pair.a, "mirror-left", pair.aLabel, ["zone-source"]);
        expectedBoard[rightIndex] = glyphCell(rightIndex, pair.b, "mirror-right", pair.bLabel, ["zone-copy"]);
        addCandidate(candidates, "mirror-trap", "unchanged-symbol", rightIndex, glyphCell(rightIndex, pair.a, "mirror-right", pair.aLabel, ["zone-copy"]));
        addCandidate(candidates, "mirror-trap", "wrong-paired-symbol", rightIndex, glyphCell(rightIndex, pairs[(row + col + 1) % pairs.length].b, "mirror-right", "wrong paired symbol", ["zone-copy"]));
        addCandidate(candidates, "mirror-trap", "swapped-partner", rightIndex, glyphCell(rightIndex, sequence[(row + 1) % sequence.length].b, "mirror-right", "swapped partner", ["zone-copy"]));
      }
    }
    return makeExpectedRound("mirror-trap", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That mirrored symbol uses the wrong counterpart.", "Only the mirrored side can be wrong; infer the pair mapping from repeated rows.", function () {
      return "The left side establishes source symbols and the right side consistently transforms them; the tapped copy uses the wrong partner.";
    }));
  }

  function generateChessAttack(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle(chessAttackScenarios(), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);
    return buildChessAttackRound(selected);
  }

  function chessAttackScenarios() {
    return [
      { mode: "rook-diagonal-fail", breakNumber: 1, override: { 2: 6 } },
      { mode: "bishop-file-fail", breakNumber: 2, override: { 3: 14 } },
      { mode: "knight-diagonal-fail", breakNumber: 3, override: { 4: 18 } },
      { mode: "queen-crooked-fail", breakNumber: 4, override: { 5: 15 } },
      { mode: "queen-short-crook-fail", breakNumber: 4, override: { 5: 16 } }
    ].map(function (scenario) {
      var board = buildChessBoard(scenario.override);
      var answerIndex = board.filter(function (cell) {
        return cell.value && cell.value.number === scenario.breakNumber;
      })[0].index;
      scenario.board = board;
      scenario.answerIndex = answerIndex;
      scenario.breakSignature = makeBreakSignature("chess-attack", scenario.mode, answerIndex, "piece-" + scenario.breakNumber);
      return scenario;
    });
  }

  function buildChessAttackRound(selected) {
    return {
      answerMode: ANSWER_MODES.identifyOne,
      board: selected.board,
      expected: selected.board,
      answerIndex: selected.answerIndex,
      answerIndices: [selected.answerIndex],
      explanation: "That numbered piece is the first one that cannot attack the next piece.",
      wrongTapHint: "Follow the numbers. Check whether each piece attacks the next numbered square.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "Number " + selected.breakNumber + " is the first piece whose chess attack does not reach the next number.",
      relatedIndexes: chessRelatedIndexes(selected.board, selected.answerIndex)
    };
  }

  function buildChessBoard(overrides) {
    var board = emptyBoard();
    var pieces = [
      { number: 1, tag: "rook", index: 0 },
      { number: 2, tag: "bishop", index: 4 },
      { number: 3, tag: "knight", index: 12 },
      { number: 4, tag: "queen", index: 23 },
      { number: 5, tag: "king", index: 20 }
    ];

    pieces.forEach(function (piece) {
      var index = overrides && overrides[piece.number] !== undefined ? overrides[piece.number] : piece.index;
      board[index] = chessPieceCell(index, piece.tag, piece.number);
    });
    return board;
  }

  function generatePokerHandTrap(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var expectedBoard = emptyBoard();
    var candidates = [];
    var rows = [
      { label: "PAIR", cards: [["7", 3], ["7", 0], ["4", 1], ["Q", 2]], badIndex: 1, bad: ["8", 0], mode: "broken-pair" },
      { label: "FLUSH", cards: [["2", 3], ["5", 3], ["8", 3], ["J", 3]], badIndex: 3, bad: ["J", 1], mode: "broken-flush" },
      { label: "RUN", cards: [["4", 2], ["5", 1], ["6", 0], ["7", 3]], badIndex: 2, bad: ["8", 0], mode: "broken-run" },
      { label: "TRIPS", cards: [["9", 0], ["9", 1], ["9", 2], ["K", 3]], badIndex: 2, bad: ["10", 2], mode: "broken-trips" },
      { label: "PAIR", cards: [["A", 1], ["A", 2], ["3", 0], ["10", 3]], badIndex: 1, bad: ["K", 2], mode: "missing-pair" }
    ];

    rows.forEach(function (rowData, row) {
      expectedBoard[positionToIndex(row, 0)] = glyphCell(positionToIndex(row, 0), rowData.label, "target", rowData.label + " row target", ["token-target"], rowData.label);
      rowData.cards.forEach(function (card, col) {
        expectedBoard[positionToIndex(row, col + 1)] = cardCell(positionToIndex(row, col + 1), card[0], card[1]);
      });
      addCandidate(candidates, "poker-hand-trap", rowData.mode, positionToIndex(row, rowData.badIndex + 1), cardCell(positionToIndex(row, rowData.badIndex + 1), rowData.bad[0], rowData.bad[1]));
    });
    return makeExpectedRound("poker-hand-trap", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That card ruins its row's poker pattern.", "Use the row label: PAIR, FLUSH, RUN, or TRIPS.", function (selected) {
      return "The row label gives the hand pattern; the tapped card is the only one that makes its row false.";
    }));
  }

  function generateTrainRoute(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var expectedBoard = emptyBoard();
    var candidates = [];
    var route = [
      [0, "S"], [1, "─"], [2, "─"], [3, "┐"],
      [8, "│"], [13, "│"], [18, "└"], [19, "┐"], [24, "F"]
    ];

    route.forEach(function (item) {
      expectedBoard[item[0]] = glyphCell(item[0], item[1], item[1] === "S" || item[1] === "F" ? "station" : "train", "track " + item[1], ["token-track"], item[1]);
    });
    [
      { index: 3, glyph: "└", mode: "wrong-corner" },
      { index: 8, glyph: "─", mode: "wrong-straight" },
      { index: 18, glyph: "┌", mode: "wrong-turn" },
      { index: 19, glyph: "┘", mode: "dead-end-turn" },
      { index: 1, glyph: "│", mode: "vertical-on-horizontal" }
    ].forEach(function (candidate) {
      addCandidate(candidates, "train-route", candidate.mode, candidate.index, glyphCell(candidate.index, candidate.glyph, "train", "wrong track " + candidate.glyph, ["token-track"], candidate.glyph));
    });
    return makeExpectedRound("train-route", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That track tile breaks the route.", "Trace the line from S to F; one tile's exits do not connect.", function () {
      return "The route has one continuous connection from S to F; the tapped tile points the track the wrong way.";
    }));
  }

  function generateGoCaptureMax(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle(goCaptureScenarios(), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);
    return buildGoCaptureRound(selected);
  }

  function goCaptureScenarios() {
    var baseBlack = [2, 3, 6, 9, 14, 18];
    var baseWhite = [7, 8, 13];
    var baseAnswer = 12;
    var transforms = ["identity", "rotate90", "rotate180", "mirrorH", "mirrorV", "transpose"];

    return transforms.map(function (transform) {
      var black = baseBlack.map(function (index) { return transformIndex(index, transform); });
      var white = baseWhite.map(function (index) { return transformIndex(index, transform); });
      var answerIndex = transformIndex(baseAnswer, transform);
      var board = goBoard(black, white, [], []);
      return {
        mode: "capture-three-" + transform,
        board: board,
        answerIndex: answerIndex,
        captured: white,
        breakSignature: makeBreakSignature("go-capture-max", "capture-three-" + transform, answerIndex, "captures-3")
      };
    });
  }

  function buildGoCaptureRound(selected) {
    var captureCount = goCaptureScore(selected.board, selected.answerIndex, "black");
    return {
      answerMode: ANSWER_MODES.chooseOne,
      board: selected.board,
      answerIndex: selected.answerIndex,
      answerIndices: [selected.answerIndex],
      explanation: "That move captures " + captureCount + " white stones by filling their last liberty.",
      wrongTapHint: "Captures happen only when a move fills the last liberty of a white group.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "The target white group has one liberty; playing there removes it and captures " + captureCount + " stones.",
      relatedIndexes: selected.captured,
      choiceScores: goScores(selected.board)
    };
  }

  function generateGoLiberties(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle(goLibertyScenarios(), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);
    return buildGoLibertyRound(selected);
  }

  function goLibertyScenarios() {
    var transforms = ["identity", "rotate90", "rotate180", "mirrorH", "mirrorV", "transpose"];
    var baseMarked = [12];
    var baseWhite = [17];
    var baseAnswer = [7, 11, 13];

    return transforms.map(function (transform) {
      var marked = baseMarked.map(function (index) { return transformIndex(index, transform); });
      var white = baseWhite.map(function (index) { return transformIndex(index, transform); });
      var answerIndices = baseAnswer.map(function (index) { return transformIndex(index, transform); });
      var board = goBoard(marked, white, marked, []);
      return {
        mode: "marked-liberties-" + transform,
        board: board,
        answerIndices: uniqueSorted(answerIndices),
        breakSignature: makeBreakSignature("go-liberties", "marked-liberties-" + transform, uniqueSorted(answerIndices).join("."), "set")
      };
    });
  }

  function buildGoLibertyRound(selected) {
    return {
      answerMode: ANSWER_MODES.multiSelect,
      board: selected.board,
      answerIndices: selected.answerIndices,
      answerIndex: selected.answerIndices[0],
      minSelections: selected.answerIndices.length,
      maxSelections: selected.answerIndices.length,
      submitLabel: "Submit liberties",
      explanation: "Those are all " + selected.answerIndices.length + " liberties of the marked group.",
      wrongTapHint: "Liberties are empty points directly up, down, left, or right from the marked group.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "The marked group touches exactly these empty orthogonal points: " + selected.answerIndices.map(displayPoint).join(", ") + ".",
      relatedIndexes: selected.answerIndices
    };
  }

  function generateRotationLogic(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    return generateDirectionCycle("rotation-logic", random, avoidBreakSignatures, 2, "That direction misses the rotation sequence.", "Read left to right: every direction should rotate the same amount.", "Rows establish a quarter-turn direction pattern; the tapped cell rotates to the wrong direction.");
  }

  function generateCompassRose(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    return generateDirectionCycle("compass-rose", random, avoidBreakSignatures, random() < 0.5 ? 1 : 2, "That compass marker misses the rotation.", "Check the repeated turn amount before tapping.", "The compass rose turns by a fixed amount; this marker uses the wrong bearing.");
  }

  function generateDirectionCycle(typeId, random, avoidBreakSignatures, step, explanation, hint, evidence) {
    var offset = randomIndex(random, DIRECTIONS.length);
    var expectedBoard = [];
    var candidates = [];

    forEachIndex(function (index, row, col) {
      expectedBoard[index] = token(index, DIRECTIONS[mod(offset + row + col * step, DIRECTIONS.length)], "direction", ["token-direction"]);
    });
    expectedBoard.forEach(function (cell, index) {
      var dirIndex = symbolIndex(DIRECTIONS, cell.glyph);
      addCandidate(candidates, typeId, "wrong-rotation-amount", index, token(index, DIRECTIONS[mod(dirIndex + step + 1, DIRECTIONS.length)], "direction", ["token-direction"]));
      addCandidate(candidates, typeId, "opposite-direction", index, token(index, DIRECTIONS[mod(dirIndex + 4, DIRECTIONS.length)], "direction", ["token-direction"]));
      addCandidate(candidates, typeId, "skipped-direction", index, token(index, DIRECTIONS[mod(dirIndex + step * 2, DIRECTIONS.length)], "direction", ["token-direction"]));
    });
    return makeExpectedRound(typeId, commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, explanation, hint, function () { return evidence; }));
  }

  function generateLatinTrap(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var symbols = [ABSTRACT[0], ABSTRACT[5], ABSTRACT[1], ABSTRACT[2], ABSTRACT[4]];
    var expectedBoard = [];
    var candidates = [];
    var step = random() < 0.5 ? 1 : 2;

    forEachIndex(function (index, row, col) {
      expectedBoard[index] = token(index, symbols[mod(row * step + col, GRID_SIZE)], "latin", ["token-abstract"]);
    });
    expectedBoard.forEach(function (cell, index) {
      var row = Math.floor(index / GRID_SIZE);
      var col = index % GRID_SIZE;
      addCandidate(candidates, "latin-trap", "row-column-duplicate", index, cloneWithIndex(index, expectedBoard[positionToIndex(row, mod(col + 1, GRID_SIZE))]));
      addCandidate(candidates, "latin-trap", "swapped-symbol", index, cloneWithIndex(index, expectedBoard[positionToIndex(mod(row + 1, GRID_SIZE), col)]));
    });
    return makeExpectedRound("latin-trap", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That cell creates the row and column duplicate.", "Check the row and column together; the answer causes both repeats.", function () {
      return "Each row and column should contain one of every symbol; the tapped cell repeats a symbol in both directions.";
    }));
  }

  function generateKnightPath(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var path = [0, 7, 18, 21, 10, 1, 12, 3, 6, 15, 22, 13, 4];
    return generateMovementRound("knight-path", random, path, isKnightMove, [
      { mode: "orthogonal-move", delta: [1, 0] },
      { mode: "diagonal-move", delta: [1, 1] },
      { mode: "wrong-l-distance", delta: [2, 2] }
    ], avoidBreakSignatures, "That knight jumps illegally.", "Follow the numbers. The answer is the first knight that does not land in an L-shape.", "The retired knight path establishes L-moves; this numbered knight is the first non-L jump.");
  }

  function generateCheckersJump(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var path = [1, 7, 13, 19, 23, 17, 11, 5];
    return generateMovementRound("checkers-jump", random, path, isDiagonalStep, [
      { mode: "orthogonal-step", delta: [1, 0] },
      { mode: "wrong-diagonal-direction", delta: [0, 1] },
      { mode: "fake-jump", delta: [2, 1] }
    ], avoidBreakSignatures, "That checker does not move diagonally.", "Read the numbers in order; checkers should step along diagonals.", "The numbered checkers establish diagonal movement; the tapped checker is the first off-diagonal step.");
  }

  function generateMovementRound(typeId, random, path, legalMove, breakModes, avoidBreakSignatures, explanation, hint, evidence) {
    var expectedBoard = emptyBoard();
    var candidates = [];
    path.forEach(function (index, moveIndex) {
      expectedBoard[index] = glyphCell(index, String(moveIndex + 1), "path", "move " + (moveIndex + 1), ["token-path"], moveIndex + 1);
    });
    for (var move = 2; move < path.length; move += 1) {
      var prev = indexToPoint(path[move - 1]);
      breakModes.forEach(function (breakMode) {
        var wrongPoint = { row: prev.row + breakMode.delta[0], col: prev.col + breakMode.delta[1] };
        if (isInside(wrongPoint) && !legalMove(prev, wrongPoint) && path.indexOf(positionToIndex(wrongPoint.row, wrongPoint.col)) === -1) {
          var wrongIndex = positionToIndex(wrongPoint.row, wrongPoint.col);
          var board = cloneBoard(expectedBoard);
          board[path[move]] = emptyCell(path[move]);
          board[wrongIndex] = glyphCell(wrongIndex, String(move + 1), "path", "move " + (move + 1), ["token-path"], move + 1);
          candidates.push({ breakMode: breakMode.mode, answerIndex: wrongIndex, board: board, breakSignature: makeBreakSignature(typeId, breakMode.mode, wrongIndex, String(move + 1)) });
        }
      });
    }
    var selected = selectCandidate(shuffle(candidates, random), avoidBreakSignatures || []);
    return {
      answerMode: ANSWER_MODES.identifyOne,
      board: selected.board,
      expected: expectedBoard,
      answerIndex: selected.answerIndex,
      answerIndices: [selected.answerIndex],
      explanation: explanation,
      wrongTapHint: hint,
      breakSignature: selected.breakSignature,
      breakMode: selected.breakMode,
      fallbackUsed: selected.fallbackUsed,
      evidence: evidence,
      relatedIndexes: []
    };
  }

  function generateAnimalFoodWeb(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var chain = ["plant", "insect", "frog", "snake", "hawk"].map(animalById);
    var expectedBoard = [];
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      chain.forEach(function (animal, col) {
        expectedBoard[positionToIndex(row, col)] = token(positionToIndex(row, col), animal, "animal", ["token-animal"]);
      });
      addCandidate(candidates, "animal-food-web", "wrong-habitat", positionToIndex(row, 2), token(positionToIndex(row, 2), animalById("fish"), "animal", ["token-animal"]));
      addCandidate(candidates, "animal-food-web", "wrong-food-chain-position", positionToIndex(row, 3), token(positionToIndex(row, 3), animalById("rabbit"), "animal", ["token-animal"]));
      addCandidate(candidates, "animal-food-web", "predator-prey-mismatch", positionToIndex(row, 4), token(positionToIndex(row, 4), animalById("bee"), "animal", ["token-animal"]));
    }
    return makeExpectedRound("animal-food-web", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That animal breaks the food chain.", "Use the taught chain: plant, insect, frog, snake, hawk.", function () {
      return "The rows repeat an obvious food chain; the tapped animal is in the wrong habitat or chain position.";
    }));
  }

  function commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, explanation, wrongTapHint, evidence, relatedIndexes) {
    return {
      random: random,
      expectedBoard: expectedBoard,
      candidates: candidates,
      avoidBreakSignatures: avoidBreakSignatures,
      explanation: explanation,
      wrongTapHint: wrongTapHint,
      evidence: evidence,
      relatedIndexes: relatedIndexes
    };
  }

  function cardCell(index, rank, suitIndex) {
    var card = Symbols.card(rank, suitIndex);
    return hydrateCell(index, {
      kind: "card",
      glyph: card.glyph,
      label: card.glyph,
      value: { rank: rank, suit: card.suit, suitIndex: suitIndex },
      cornerLabel: rank,
      classNames: ["token-card", "suit-" + card.suit],
      ariaLabel: card.ariaLabel,
      expectedGlyph: card.glyph,
      expectedValue: { rank: rank, suit: card.suit, suitIndex: suitIndex }
    });
  }

  function chessPieceCell(index, pieceTag, number) {
    var piece = chessByTag(pieceTag);
    return hydrateCell(index, {
      kind: "chess",
      glyph: piece.glyph,
      label: piece.glyph,
      value: { piece: pieceTag, number: number },
      cornerLabel: String(number),
      classNames: ["token-chess", "numbered-piece"],
      ariaLabel: "Number " + number + " " + pieceTag,
      expectedGlyph: piece.glyph,
      expectedValue: { piece: pieceTag, number: number }
    });
  }

  function goBoard(blackIndexes, whiteIndexes, markedIndexes) {
    var board = emptyBoard();
    var marked = markedIndexes || [];

    forEachIndex(function (index) {
      board[index] = goCell(index, "empty", marked.indexOf(index) !== -1);
    });
    blackIndexes.forEach(function (index) {
      board[index] = goCell(index, "black", marked.indexOf(index) !== -1);
    });
    whiteIndexes.forEach(function (index) {
      board[index] = goCell(index, "white", marked.indexOf(index) !== -1);
    });
    return board;
  }

  function goCell(index, color, marked) {
    var glyph = color === "black" ? "●" : color === "white" ? "○" : "·";
    var classes = ["token-go", "go-" + color];
    if (marked) {
      classes.push("go-marked");
    }
    return hydrateCell(index, {
      kind: "go " + color,
      glyph: glyph,
      label: glyph,
      value: { go: color, marked: Boolean(marked) },
      cornerLabel: marked ? "G" : "",
      classNames: classes,
      ariaLabel: (marked ? "marked " : "") + color + " go point",
      selectable: color === "empty",
      expectedGlyph: glyph,
      expectedValue: { go: color, marked: Boolean(marked) }
    });
  }

  function logicCell(index, glyph) {
    return glyphCell(index, glyph, "logic", glyph + " logic token", ["token-logic"], glyph);
  }

  function dieCell(index, value) {
    return glyphCell(index, String(value), "dice", "die face " + value, ["token-dice"], value);
  }

  function dominoCell(index, left, right) {
    return glyphCell(index, left + "|" + right, "domino", "domino " + left + " to " + right, ["token-domino"], { left: left, right: right });
  }

  function token(index, symbol, kind, classes) {
    return glyphCell(index, symbol.glyph, kind, symbol.ariaLabel || symbol.label, classes || [], symbol.id, symbol.cornerLabel || "");
  }

  function glyphCell(index, glyph, kind, ariaLabel, classes, value, cornerLabel, subLabel) {
    return hydrateCell(index, {
      kind: kind,
      glyph: glyph,
      label: glyph,
      value: value === undefined ? glyph : value,
      cornerLabel: cornerLabel || "",
      subLabel: subLabel || "",
      classNames: classes || [],
      ariaLabel: ariaLabel || glyph,
      interactive: true,
      selectable: true,
      expectedGlyph: glyph,
      expectedValue: value === undefined ? glyph : value
    });
  }

  function emptyBoard() {
    return Array.from({ length: CELL_COUNT }, function (_, index) {
      return emptyCell(index);
    });
  }

  function emptyCell(index) {
    return glyphCell(index, "", "empty", "empty point", ["token-empty"], "", "", "");
  }

  function hydrateCell(index, cell) {
    return Object.assign({
      index: index,
      row: Math.floor(index / GRID_SIZE),
      col: index % GRID_SIZE,
      kind: "token",
      glyph: "",
      label: "",
      value: "",
      cornerLabel: "",
      subLabel: "",
      classNames: [],
      ariaLabel: "empty",
      interactive: true,
      selectable: true,
      selected: false
    }, cell, {
      index: index,
      row: Math.floor(index / GRID_SIZE),
      col: index % GRID_SIZE
    });
  }

  function cloneBoard(board) {
    return board.map(function (cell, index) {
      return hydrateCell(index, {
        kind: cell.kind,
        glyph: cell.glyph,
        label: cell.label,
        value: cloneValue(cell.value),
        cornerLabel: cell.cornerLabel || "",
        subLabel: cell.subLabel || "",
        classNames: (cell.classNames || []).slice(),
        ariaLabel: cell.ariaLabel,
        interactive: cell.interactive !== false,
        selectable: cell.selectable !== false,
        selected: Boolean(cell.selected),
        expectedGlyph: cell.expectedGlyph,
        expectedValue: cloneValue(cell.expectedValue)
      });
    });
  }

  function cloneValue(value) {
    if (value && typeof value === "object") {
      return JSON.parse(JSON.stringify(value));
    }
    return value;
  }

  function cloneWithIndex(index, sourceCell) {
    var clone = cloneBoard([sourceCell])[0];
    return hydrateCell(index, clone);
  }

  function addCandidate(candidates, typeId, breakMode, answerIndex, wrongCell) {
    var wrongKey = wrongCell.glyph + (wrongCell.cornerLabel || "") + JSON.stringify(wrongCell.value || "");
    candidates.push({
      answerIndex: answerIndex,
      breakMode: breakMode,
      wrong: wrongCell,
      breakSignature: makeBreakSignature(typeId, breakMode, answerIndex, wrongKey)
    });
  }

  function selectCandidate(candidates, avoidBreakSignatures) {
    var avoid = avoidBreakSignatures || [];
    var fresh = candidates.filter(function (candidate) {
      return avoid.indexOf(candidate.breakSignature) === -1;
    });

    if (fresh.length > 0) {
      return fresh[0];
    }
    return candidates.reduce(function (oldest, candidate) {
      var oldestIndex = avoid.indexOf(oldest.breakSignature);
      var candidateIndex = avoid.indexOf(candidate.breakSignature);
      candidate.fallbackUsed = true;
      return candidateIndex !== -1 && (oldestIndex === -1 || candidateIndex < oldestIndex) ? candidate : oldest;
    }, candidates[0]);
  }

  function makeBreakSignature(typeId, breakMode, answerIndex, wrongLabel) {
    return [typeId, breakMode, answerIndex, wrongLabel].join("|");
  }

  function validatePuzzle(puzzle) {
    return puzzle.rounds.every(function (round) {
      return validateRound(round).valid;
    });
  }

  function validateRound(round) {
    var validator = round.validator || validatorForMode(round.answerMode);
    return validator(round);
  }

  function validatorForMode(answerMode) {
    if (answerMode === ANSWER_MODES.chooseOne) {
      return validateChooseOne;
    }
    if (answerMode === ANSWER_MODES.multiSelect) {
      return validateMultiSelect;
    }
    return validateExpectedMismatch;
  }

  function validateExpectedMismatch(round) {
    var mismatches = getMismatches(round);
    return {
      valid: mismatches.length === 1 && mismatches[0] === round.answerIndex && boardIsUsable(round),
      mismatches: mismatches,
      answers: mismatches.length === 1 ? mismatches : []
    };
  }

  function validateChooseOne(round) {
    return {
      valid: typeof round.answerIndex === "number" && boardIsUsable(round),
      mismatches: [round.answerIndex],
      answers: [round.answerIndex]
    };
  }

  function validateMultiSelect(round) {
    return {
      valid: Array.isArray(round.answerIndices) && round.answerIndices.length > 0 && boardIsUsable(round),
      mismatches: round.answerIndices || [],
      answers: round.answerIndices || []
    };
  }

  function validateFirstIllegalKnight(round) {
    return validateMovement(round, isKnightMove);
  }

  function validateFirstIllegalDiagonal(round) {
    return validateMovement(round, isDiagonalStep);
  }

  function validateMovement(round, legalMove) {
    var numbered = round.board.filter(function (cell) {
      return typeof cell.value === "number";
    }).sort(function (a, b) {
      return a.value - b.value;
    });
    var answer = null;

    for (var index = 1; index < numbered.length; index += 1) {
      if (!legalMove(numbered[index - 1], numbered[index])) {
        answer = numbered[index].index;
        break;
      }
    }
    return {
      valid: answer === round.answerIndex && boardIsUsable(round),
      mismatches: answer === null ? [] : [answer],
      answers: answer === null ? [] : [answer]
    };
  }

  function validateChessAttack(round) {
    var numbered = chessNumberedCells(round.board);
    var answer = null;

    for (var index = 0; index < numbered.length - 1; index += 1) {
      if (!chessAttacks(numbered[index], numbered[index + 1], round.board)) {
        answer = numbered[index].index;
        break;
      }
    }
    return {
      valid: answer === round.answerIndex && numbered.length === 5 && boardIsUsable(round) && numbered.every(function (cell) {
        return cell.value.piece !== "pawn" && cell.cornerLabel === String(cell.value.number);
      }),
      mismatches: answer === null ? [] : [answer],
      answers: answer === null ? [] : [answer]
    };
  }

  function validateGoCaptureMax(round) {
    var scores = goScores(round.board);
    var bestScore = Math.max.apply(null, scores.map(function (item) { return item.score; }));
    var bestMoves = scores.filter(function (item) { return item.score === bestScore && item.score > 0; }).map(function (item) { return item.index; });
    return {
      valid: bestMoves.length === 1 && bestMoves[0] === round.answerIndex && bestScore > 0 && boardIsUsable(round),
      mismatches: bestMoves,
      answers: bestMoves
    };
  }

  function validateGoLiberties(round) {
    var marked = round.board.filter(function (cell) {
      return cell.value && cell.value.marked;
    });
    var liberties = marked.length ? groupLiberties(round.board, marked[0].index) : [];
    var answers = uniqueSorted(liberties);
    return {
      valid: sameSet(answers, round.answerIndices || []) && answers.length >= 1 && answers.length <= 4 && boardIsUsable(round),
      mismatches: answers,
      answers: answers
    };
  }

  function getMismatches(round) {
    var mismatches = [];
    round.board.forEach(function (cell, index) {
      if (cell.glyph !== cell.expectedGlyph || JSON.stringify(cell.value) !== JSON.stringify(cell.expectedValue)) {
        mismatches.push(index);
      }
    });
    return mismatches;
  }

  function boardIsUsable(round) {
    return Array.isArray(round.board) && round.board.length > 0 && round.board.length <= CELL_COUNT && round.board.some(function (cell) {
      return cell.glyph;
    });
  }

  function chessNumberedCells(board) {
    return board.filter(function (cell) {
      return cell.value && cell.value.piece && typeof cell.value.number === "number";
    }).sort(function (a, b) {
      return a.value.number - b.value.number;
    });
  }

  function chessRelatedIndexes(board, answerIndex) {
    var numbered = chessNumberedCells(board);
    var attacker = numbered.filter(function (cell) { return cell.index === answerIndex; })[0];
    var next = numbered.filter(function (cell) { return attacker && cell.value.number === attacker.value.number + 1; })[0];
    return next ? [next.index] : [];
  }

  function chessAttacks(fromCell, toCell, board) {
    var dr = toCell.row - fromCell.row;
    var dc = toCell.col - fromCell.col;
    var adr = Math.abs(dr);
    var adc = Math.abs(dc);
    var piece = fromCell.value.piece;

    if (piece === "knight") {
      return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
    }
    if (piece === "king") {
      return Math.max(adr, adc) === 1;
    }
    if (piece === "rook") {
      return (dr === 0 || dc === 0) && clearLine(fromCell, toCell, board);
    }
    if (piece === "bishop") {
      return adr === adc && clearLine(fromCell, toCell, board);
    }
    if (piece === "queen") {
      return (dr === 0 || dc === 0 || adr === adc) && clearLine(fromCell, toCell, board);
    }
    return false;
  }

  function clearLine(fromCell, toCell, board) {
    var dr = Math.sign(toCell.row - fromCell.row);
    var dc = Math.sign(toCell.col - fromCell.col);
    var row = fromCell.row + dr;
    var col = fromCell.col + dc;

    while (row !== toCell.row || col !== toCell.col) {
      var cell = board[positionToIndex(row, col)];
      if (cell && cell.glyph) {
        return false;
      }
      row += dr;
      col += dc;
    }
    return true;
  }

  function goScores(board) {
    return board.map(function (cell, index) {
      return {
        index: index,
        score: goCaptureScore(board, index, "black")
      };
    });
  }

  function goCaptureScore(board, moveIndex, color) {
    if (!isEmptyGo(board[moveIndex])) {
      return 0;
    }
    var opponent = color === "black" ? "white" : "black";
    var visitedGroups = [];
    var captured = 0;

    neighbors(moveIndex).forEach(function (neighborIndex) {
      var neighbor = board[neighborIndex];
      if (!neighbor.value || neighbor.value.go !== opponent) {
        return;
      }
      var group = goGroup(board, neighborIndex);
      var key = group.join(",");
      if (visitedGroups.indexOf(key) !== -1) {
        return;
      }
      visitedGroups.push(key);
      if (groupLibertiesAfterMove(board, group, moveIndex).length === 0) {
        captured += group.length;
      }
    });
    return captured;
  }

  function goGroup(board, startIndex) {
    var color = board[startIndex].value.go;
    var queue = [startIndex];
    var group = [];
    var seen = {};
    seen[startIndex] = true;

    while (queue.length) {
      var index = queue.shift();
      group.push(index);
      neighbors(index).forEach(function (neighborIndex) {
        if (!seen[neighborIndex] && board[neighborIndex].value && board[neighborIndex].value.go === color) {
          seen[neighborIndex] = true;
          queue.push(neighborIndex);
        }
      });
    }
    return uniqueSorted(group);
  }

  function groupLiberties(board, startIndex) {
    return groupLibertiesAfterMove(board, goGroup(board, startIndex), null);
  }

  function groupLibertiesAfterMove(board, group, filledIndex) {
    var liberties = [];
    group.forEach(function (index) {
      neighbors(index).forEach(function (neighborIndex) {
        if (neighborIndex !== filledIndex && isEmptyGo(board[neighborIndex])) {
          liberties.push(neighborIndex);
        }
      });
    });
    return uniqueSorted(liberties);
  }

  function isEmptyGo(cell) {
    return cell && cell.value && cell.value.go === "empty";
  }

  function neighbors(index) {
    var point = indexToPoint(index);
    return [
      { row: point.row - 1, col: point.col },
      { row: point.row + 1, col: point.col },
      { row: point.row, col: point.col - 1 },
      { row: point.row, col: point.col + 1 }
    ].filter(isInside).map(function (neighbor) {
      return positionToIndex(neighbor.row, neighbor.col);
    });
  }

  function transformIndex(index, transform) {
    var point = indexToPoint(index);
    var row = point.row;
    var col = point.col;
    if (transform === "rotate90") {
      return positionToIndex(col, GRID_SIZE - 1 - row);
    }
    if (transform === "rotate180") {
      return positionToIndex(GRID_SIZE - 1 - row, GRID_SIZE - 1 - col);
    }
    if (transform === "mirrorH") {
      return positionToIndex(row, GRID_SIZE - 1 - col);
    }
    if (transform === "mirrorV") {
      return positionToIndex(GRID_SIZE - 1 - row, col);
    }
    if (transform === "transpose") {
      return positionToIndex(col, row);
    }
    return index;
  }

  function cardSymbols() {
    return ["A♠", "2♥", "3♦", "4♣", "7♥", "9♠", "J♣", "Q♦"];
  }

  function example(columns, caption, cells) {
    return { columns: columns, caption: caption, cells: cells };
  }

  function cloneExample(exampleData) {
    return {
      columns: exampleData.columns,
      caption: exampleData.caption,
      cells: exampleData.cells.slice()
    };
  }

  function symbolLabel(symbol) {
    return typeof symbol === "string" ? symbol : symbol.glyph;
  }

  function hasTag(tag) {
    return function (symbol) {
      return symbol.tags.indexOf(tag) !== -1;
    };
  }

  function chessByTag(tag) {
    return CHESS.filter(hasTag(tag)).filter(function (symbol) {
      return symbol.tags.indexOf("black") !== -1;
    })[0] || CHESS.filter(hasTag(tag))[0];
  }

  function animalById(id) {
    return ANIMALS.filter(function (animal) {
      return animal.id === id;
    })[0];
  }

  function symbolIndex(symbols, glyph) {
    for (var index = 0; index < symbols.length; index += 1) {
      if (symbols[index].glyph === glyph) {
        return index;
      }
    }
    return 0;
  }

  function logicOutput(gate, a, b) {
    if (gate === "AND") {
      return a && b ? 1 : 0;
    }
    if (gate === "OR") {
      return a || b ? 1 : 0;
    }
    if (gate === "XOR") {
      return a !== b ? 1 : 0;
    }
    if (gate === "NAND") {
      return a && b ? 0 : 1;
    }
    return 0;
  }

  function isKnightMove(a, b) {
    var dr = Math.abs(pointRow(a) - pointRow(b));
    var dc = Math.abs(pointCol(a) - pointCol(b));
    return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
  }

  function isDiagonalStep(a, b) {
    return Math.abs(pointRow(a) - pointRow(b)) === 1 && Math.abs(pointCol(a) - pointCol(b)) === 1;
  }

  function pointRow(point) {
    return point.row !== undefined ? point.row : Math.floor(point.index / GRID_SIZE);
  }

  function pointCol(point) {
    return point.col !== undefined ? point.col : point.index % GRID_SIZE;
  }

  function indexToPoint(index) {
    return { row: Math.floor(index / GRID_SIZE), col: index % GRID_SIZE };
  }

  function displayPoint(index) {
    var point = indexToPoint(index);
    return "row " + (point.row + 1) + ", column " + (point.col + 1);
  }

  function isInside(point) {
    return point.row >= 0 && point.row < GRID_SIZE && point.col >= 0 && point.col < GRID_SIZE;
  }

  function forEachIndex(callback) {
    for (var index = 0; index < CELL_COUNT; index += 1) {
      callback(index, Math.floor(index / GRID_SIZE), index % GRID_SIZE);
    }
  }

  function positionToIndex(row, col) {
    return row * GRID_SIZE + col;
  }

  function uniqueSorted(items) {
    return Array.from(new Set(items)).sort(function (a, b) {
      return a - b;
    });
  }

  function sameSet(a, b) {
    var left = uniqueSorted(a);
    var right = uniqueSorted(b);
    return left.length === right.length && left.every(function (item, index) {
      return item === right[index];
    });
  }

  function shuffle(items, random) {
    var copy = items.slice();
    for (var index = copy.length - 1; index > 0; index -= 1) {
      var swapIndex = randomIndex(random, index + 1);
      var temp = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = temp;
    }
    return copy;
  }

  function mod(value, length) {
    return ((value % length) + length) % length;
  }

  function createRandom(seed) {
    return mulberry32(hashString(seed));
  }

  function randomIndex(random, length) {
    return Math.floor(random() * length);
  }

  function getLocalDateKey(date) {
    var year = date.getFullYear();
    var month = padNumber(date.getMonth() + 1, 2);
    var day = padNumber(date.getDate());
    return year + "-" + month + "-" + day;
  }

  function getPuzzleNumber(dateKey) {
    var start = dateKeyToUtc(LAUNCH_DATE);
    var current = dateKeyToUtc(dateKey);
    var dayMs = 24 * 60 * 60 * 1000;
    return Math.max(1, Math.floor((current - start) / dayMs) + 1);
  }

  function dateKeyToUtc(dateKey) {
    var parts = dateKey.split("-").map(Number);
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }

  function padNumber(number) {
    return String(number).padStart(2, "0");
  }

  function hashString(value) {
    var hash = 2166136261;
    for (var index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  return {
    GRID_SIZE: GRID_SIZE,
    CELL_COUNT: CELL_COUNT,
    LAUNCH_DATE: LAUNCH_DATE,
    ANSWER_MODES: ANSWER_MODES,
    puzzleTypes: puzzleTypes,
    generateDailyPuzzle: generateDailyPuzzle,
    validatePuzzle: validatePuzzle,
    validateRound: validateRound,
    validateExpectedMismatch: validateExpectedMismatch,
    validateChooseOne: validateChooseOne,
    validateMultiSelect: validateMultiSelect,
    validateChessAttack: validateChessAttack,
    validateGoCaptureMax: validateGoCaptureMax,
    validateGoLiberties: validateGoLiberties,
    getMismatches: getMismatches,
    getLocalDateKey: getLocalDateKey,
    getPuzzleNumber: getPuzzleNumber,
    createRandom: createRandom,
    hashString: hashString
  };
}));
