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
  var ROUNDS_PER_DAILY = 3;

  var S = Symbols.packs;
  var ABSTRACT = S.abstract;
  var CARDS = S.cards;
  var CHESS = S.chess;
  var GO = S.go;
  var LOGIC = S.logic;
  var DICE = S.dice;
  var DIRECTIONS = S.directions;
  var ANIMALS = S.animals;

  var puzzleTypes = [
    type("rule-rows", "Rule Rows", "Symbol Grammar", 1, "sequence grammar", true, false, ABSTRACT.slice(0, 8), "Each row follows a shifted symbol recipe. Find the glyph that breaks its row.", example(5, "A shifted symbol recipe repeats with a new starting point.", ["☾", "◆", "♛", "☇", "◉"]), generateRuleRows, validateExpectedMismatch),
    type("conveyor-shift", "Conveyor Shift", "Symbol Grammar", 2, "spatial transformation", true, false, ABSTRACT.slice(0, 5), "Each row is the previous row shifted like a conveyor belt. Find the slipped tile.", example(5, "Each new row moves the recipe one slot.", ["☾", "◆", "♛", "☇", "◉", "◆", "♛", "☇", "◉", "☾"]), generateConveyorShift, validateExpectedMismatch),
    type("rotation-logic", "Rotation Logic", "Compass", 2, "rotation sequence", false, false, DIRECTIONS, "Directions rotate by a consistent step. Find the one that missed the turn.", example(4, "A quarter-turn rhythm: north, east, south, west.", ["N", "E", "S", "W"]), generateRotationLogic, validateExpectedMismatch),
    type("latin-trap", "Latin Trap", "Symbol Grammar", 2, "row-column constraints", true, false, ABSTRACT.slice(0, 5), "Every row and column should contain one of each symbol. Find the cell causing both repeats.", example(5, "Every row and column wants one of each symbol.", ["☾", "☀", "◆", "♛", "◉"]), generateLatinTrap, validateExpectedMismatch),
    type("pair-pact", "Pair Pact", "Symbol Grammar", 2, "pair inference", true, false, ABSTRACT, "Symbols travel in partner pairs. Find the symbol that breaks a pact.", example(5, "Pairs sit together: moon with sun, key with lock.", ["☾", "☀", "•", "⚿", "▣"]), generatePairPact, validateExpectedMismatch),
    type("path-rhythm", "Path Rhythm", "Map", 3, "movement rhythm", false, true, DIRECTIONS, "A numbered path alternates movement rhythm. Find the first move that breaks the beat.", example(5, "The beat alternates horizontal, vertical, horizontal, vertical.", ["1→", "2↓", "3→", "4↓", "5→"]), generatePathRhythm, validateExpectedMismatch),
    type("mirror-trap", "Mirror Trap", "Symbol Grammar", 3, "mapping inference", true, false, ABSTRACT, "The right side mirrors the left, but symbols transform into paired counterparts.", example(5, "A mirror copy changes moon into sun and crown into diamond.", ["☾", "♛", "↔", "◆", "☀"]), generateMirrorTrap, validateExpectedMismatch),
    type("card-straight", "Card Straight", "Cards", 1, "rank progression", false, false, cardSymbols(), "Each row is a short straight. Tap the card that breaks rank or suit logic.", example(5, "A clean straight: A♠ 2♥ 3♦ 4♣ 5♠.", ["A♠", "2♥", "3♦", "4♣", "5♠"]), generateCardStraight, validateExpectedMismatch),
    type("suit-cycle", "Suit Cycle", "Cards", 2, "cyclic attributes", false, false, cardSymbols(), "Suits cycle across the row and shift by row. Tap the card with the wrong suit.", example(4, "The suit cycle shifts: ♠, ♥, ♦, ♣.", ["A♠", "A♥", "A♦", "A♣"]), generateSuitCycle, validateExpectedMismatch),
    type("knight-path", "Knight Path", "Chess", 3, "legal movement", false, true, CHESS.filter(hasTag("knight")), "Numbered knights should move in legal L-shapes. Tap the first illegal knight.", example(4, "A knight moves two squares in one direction and one square across.", ["1♞", "", "", "2♞"]), generateKnightPath, validateFirstIllegalKnight),
    type("chess-attack", "Chess Attack", "Chess", 4, "movement classification", false, false, CHESS, "Each piece should legally attack its target vector. Tap the illegal pair.", example(5, "A rook attacks straight; a bishop attacks diagonal; a knight attacks an L.", ["♜", "→", "2,0", "=", "OK"]), generateChessAttack, validateExpectedMismatch),
    type("go-liberties", "Go Liberties", "Go", 4, "orthogonal adjacency", false, false, GO, "Each black stone group should show exactly two liberties. Tap the point that breaks the count.", example(5, "Only orthogonal empty points count as liberties.", ["○", "+", "●", "+", "○"]), generateGoLiberties, validateExpectedMismatch),
    type("logic-gate-row", "Logic Gate Row", "Logic", 2, "boolean logic", false, false, LOGIC, "Each row is A, B, gate, equals, output. Tap the wrong output.", example(5, "1 XOR 0 should output 1.", ["1", "0", "XOR", "=", "1"]), generateLogicGateRow, validateExpectedMismatch),
    type("domino-chain", "Domino Chain", "Dominoes", 2, "matching chain", false, false, DICE, "Neighboring domino halves must match. Tap the domino that breaks the chain.", example(4, "The right half of one domino matches the left half of the next.", ["1|3", "3|5", "5|2", "2|4"]), generateDominoChain, validateExpectedMismatch),
    type("dice-sum", "Dice Sum", "Dice", 2, "small arithmetic", false, false, DICE, "Rows show three dice and a total. Tap the die or total that breaks the sum.", example(5, "2 + 3 + 1 = 6.", ["2", "3", "1", "=", "6"]), generateDiceSum, validateExpectedMismatch),
    type("checkers-jump", "Checkers Jump", "Checkers", 3, "diagonal movement", false, true, S.checkers, "Numbered checkers must step diagonally. Tap the first illegal move.", example(4, "Checkers move along diagonals on dark squares.", ["1", "", "", "2"]), generateCheckersJump, validateFirstIllegalDiagonal),
    type("animal-food-web", "Animal Food Web", "Ecology", 2, "relationship ordering", false, false, ANIMALS, "Each row shows an obvious food chain. Tap the animal that does not belong.", example(5, "Plant feeds insect, frog eats insect, snake eats frog, hawk hunts snake.", ["PL", "IN", "FR", "SN", "HW"]), generateAnimalFoodWeb, validateExpectedMismatch),
    type("compass-rose", "Compass Rose", "Compass", 2, "rotation sequence", false, false, DIRECTIONS, "Directions rotate by the same amount in each row. Tap the direction that misses the rotation.", example(5, "Quarter turns: N, E, S, W, N.", ["N", "E", "S", "W", "N"]), generateCompassRose, validateExpectedMismatch)
  ];

  function type(id, name, sourceWorld, difficulty, cognitiveSkill, abstractGlyph, movement, symbols, briefing, exampleData, generator, validator) {
    return {
      id: id,
      name: name,
      sourceWorld: sourceWorld,
      difficulty: difficulty,
      cognitiveSkill: cognitiveSkill,
      isAbstractGlyphPuzzle: abstractGlyph,
      isMovementPuzzle: movement,
      symbols: symbols.map(symbolLabel),
      symbolBank: symbols.map(symbolLabel),
      briefing: briefing,
      briefingText: briefing,
      example: exampleData,
      exampleData: cloneExample(exampleData),
      generate: generator,
      validator: validator,
      validate: validator
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

    ranges.forEach(function (range, roundIndex) {
      var candidates = puzzleTypes.filter(function (candidate) {
        return range.indexOf(candidate.difficulty) !== -1 && selected.every(function (chosen) {
          return chosen.id !== candidate.id;
        });
      });

      candidates = prefer(candidates, function (candidate) {
        return selected.every(function (chosen) {
          return chosen.sourceWorld !== candidate.sourceWorld;
        });
      });
      candidates = prefer(candidates, function (candidate) {
        return !candidate.isMovementPuzzle || selected.every(function (chosen) {
          return !chosen.isMovementPuzzle;
        });
      });
      candidates = prefer(candidates, function (candidate) {
        return !candidate.isAbstractGlyphPuzzle || selected.filter(function (chosen) {
          return chosen.isAbstractGlyphPuzzle;
        }).length < 1;
      });
      if (roundIndex === 2 && selected.every(function (chosen) { return chosen.isAbstractGlyphPuzzle; })) {
        candidates = prefer(candidates, function (candidate) {
          return !candidate.isAbstractGlyphPuzzle;
        });
      }

      selected.push(shuffle(candidates, random)[0]);
    });

    return selected;
  }

  function prefer(candidates, predicate) {
    var preferred = candidates.filter(predicate);
    return preferred.length > 0 ? preferred : candidates;
  }

  function normalizeRound(selectedType, round, roundNumber) {
    round.id = selectedType.id;
    round.name = selectedType.name;
    round.sourceWorld = selectedType.sourceWorld;
    round.difficulty = selectedType.difficulty;
    round.cognitiveSkill = selectedType.cognitiveSkill;
    round.roundNumber = roundNumber;
    round.symbols = selectedType.symbols.slice();
    round.symbolBank = round.symbols.slice();
    round.briefing = selectedType.briefing;
    round.briefingText = selectedType.briefing;
    round.example = cloneExample(selectedType.example);
    round.exampleData = cloneExample(selectedType.example);
    round.title = "Round " + roundNumber + ": " + selectedType.name;
    round.validator = selectedType.validator;
    round.rule = round.briefing;
    round.instruction = round.goal || round.instruction || "Infer the rule from the board, then tap the one symbol that breaks it.";
    round.hint = round.wrongTapHint;
    round.cells = round.board;
    round.valid = selectedType.validator(round).valid;
    return round;
  }

  function makeExpectedRound(typeId, config) {
    var candidates = shuffle(config.candidates.filter(function (candidate) {
      return candidate.wrong.glyph !== config.expectedBoard[candidate.answerIndex].glyph ||
        candidate.wrong.cornerLabel !== config.expectedBoard[candidate.answerIndex].cornerLabel;
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
      board: board,
      expected: expected,
      answerIndex: selected.answerIndex,
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
    var offset = randomIndex(random, symbols.length);
    var expectedBoard = [];
    var candidates = [];

    forEachIndex(function (index, row, col) {
      var symbol = symbols[(offset + row + col) % symbols.length];
      expectedBoard[index] = token(index, symbol, "abstract", ["token-abstract"]);
    });
    expectedBoard.forEach(function (expectedCell, index) {
      var row = Math.floor(index / GRID_SIZE);
      var col = index % GRID_SIZE;
      addCandidate(candidates, "rule-rows", "wrong-next-symbol", index, token(index, symbols[(symbolIndex(symbols, expectedCell.glyph) + 1) % symbols.length], "abstract", ["token-abstract"]));
      addCandidate(candidates, "rule-rows", "duplicate-symbol", index, token(index, glyphSymbol(symbols, expectedBoard[positionToIndex(row, col === 0 ? 1 : col - 1)].glyph), "abstract", ["token-abstract"]));
      addCandidate(candidates, "rule-rows", "outside-recipe", index, token(index, outsiders[(index + roundNumber) % outsiders.length], "abstract", ["token-abstract"]));
    });
    return makeExpectedRound("rule-rows", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That glyph breaks the shifted row grammar.", "Compare this row to the shifted recipe established by the other rows.", function (selected) {
      return "The other rows establish a five-symbol shifted recipe; this cell uses " + selected.wrong.glyph + " where the recipe expects a different symbol.";
    }));
  }

  function generateConveyorShift(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var symbols = shuffle(ABSTRACT.slice(0, 5), random);
    var direction = random() < 0.5 ? 1 : -1;
    var expectedBoard = [];
    var candidates = [];

    forEachIndex(function (index, row, col) {
      expectedBoard[index] = token(index, symbols[mod(col + direction * row, GRID_SIZE)], "conveyor", ["token-abstract"]);
    });
    expectedBoard.forEach(function (cell, index) {
      var row = Math.floor(index / GRID_SIZE);
      var col = index % GRID_SIZE;
      if (row > 0) {
        addCandidate(candidates, "conveyor-shift", "wrong-shifted-position", index, cloneWithIndex(index, expectedBoard[positionToIndex(row, mod(col + direction, GRID_SIZE))]));
        addCandidate(candidates, "conveyor-shift", "duplicate-from-previous-row", index, cloneWithIndex(index, expectedBoard[positionToIndex(row - 1, col)]));
        addCandidate(candidates, "conveyor-shift", "neighboring-column", index, cloneWithIndex(index, expectedBoard[positionToIndex(row, mod(col + 1, GRID_SIZE))]));
      }
    });
    return makeExpectedRound("conveyor-shift", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That tile does not follow the conveyor shift.", "Use the row above as the source, then shift the whole row one slot.", function () {
      return "Every row is the previous row shifted " + (direction === 1 ? "left" : "right") + "; the tapped cell is out of phase.";
    }));
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
      addCandidate(candidates, "latin-trap", "missing-symbol-trap", index, cloneWithIndex(index, expectedBoard[positionToIndex(row, mod(col + 2, GRID_SIZE))]));
    });
    return makeExpectedRound("latin-trap", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That cell creates the row and column duplicate.", "Check the row and column together; the answer causes both repeats.", function () {
      return "Each row and column should contain one of every symbol; the tapped cell repeats a symbol in both directions.";
    }));
  }

  function generatePairPact(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var pairs = [[ABSTRACT[0], ABSTRACT[5]], [ABSTRACT[6], ABSTRACT[1]], [ABSTRACT[2], ABSTRACT[1]], [ABSTRACT[4], ABSTRACT[3]], [ABSTRACT[8], ABSTRACT[7]]];
    var order = shuffle(pairs.concat(pairs), random);
    var expectedBoard = [];
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      var left = order[row * 2];
      var right = order[row * 2 + 1];
      [left[0], left[1], ABSTRACT[9], right[0], right[1]].forEach(function (symbol, col) {
        expectedBoard[positionToIndex(row, col)] = token(positionToIndex(row, col), symbol, col === 2 ? "divider" : "pair", [col === 2 ? "token-divider" : "token-pair"]);
      });
    }
    [1, 4].forEach(function (col) {
      for (var row = 0; row < GRID_SIZE; row += 1) {
        var index = positionToIndex(row, col);
        addCandidate(candidates, "pair-pact", "wrong-partner", index, token(index, pairs[(row + col + 1) % pairs.length][1], "pair", ["token-pair"]));
        addCandidate(candidates, "pair-pact", "outsider-symbol", index, token(index, ABSTRACT[3], "pair", ["token-pair"]));
        addCandidate(candidates, "pair-pact", "unchanged-leader", index, cloneWithIndex(index, expectedBoard[positionToIndex(row, col - 1)]));
      }
    });
    return makeExpectedRound("pair-pact", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That symbol breaks the pairing pact.", "Look for pairs that repeat elsewhere; one partner is with the wrong mate.", function () {
      return "The board repeats stable symbol pairs; the tapped symbol is not the partner established by the other rows.";
    }));
  }

  function generatePathRhythm(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var expectedBoard = emptyBoard();
    var candidates = [];
    var pathIndexes = [0, 1, 2, 7, 12, 13, 14, 19, 24, 23];
    var arrows = ["→", "↓"];

    pathIndexes.forEach(function (index, pathIndex) {
      var glyph = (pathIndex + 1) + arrows[pathIndex % 2];
      expectedBoard[index] = simpleCell(index, glyph, "path", "move " + (pathIndex + 1), ["token-path"], pathIndex + 1);
    });
    pathIndexes.forEach(function (index, pathIndex) {
      if (pathIndex > 1 && pathIndex < pathIndexes.length - 1) {
        var number = pathIndex + 1;
        var expectedArrow = arrows[pathIndex % 2];
        addCandidate(candidates, "path-rhythm", "repeats-axis", index, simpleCell(index, number + (expectedArrow === "→" ? "←" : "↑"), "path", "move " + number, ["token-path"], number));
        addCandidate(candidates, "path-rhythm", "wrong-turn", index, simpleCell(index, number + (expectedArrow === "→" ? "↓" : "→"), "path", "move " + number, ["token-path"], number));
        addCandidate(candidates, "path-rhythm", "diagonal-slip", index, simpleCell(index, number + (expectedArrow === "→" ? "↘" : "↙"), "path", "move " + number, ["token-path"], number));
      }
    });
    return makeExpectedRound("path-rhythm", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That move breaks the path rhythm.", "Read the numbers in order; the first arrow that breaks the beat is the answer.", function () {
      return "The numbered path alternates horizontal and vertical arrows; the tapped move is the first wrong beat.";
    }));
  }

  function generateMirrorTrap(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var pairs = [[ABSTRACT[0], ABSTRACT[5]], [ABSTRACT[6], ABSTRACT[1]], [ABSTRACT[2], ABSTRACT[1]], [ABSTRACT[4], ABSTRACT[3]], [ABSTRACT[8], ABSTRACT[7]]];
    var sequence = shuffle(pairs.concat(pairs), random);
    var expectedBoard = emptyBoard();
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      expectedBoard[positionToIndex(row, 2)] = simpleCell(positionToIndex(row, 2), "↔", "divider", "mirror divider", ["token-divider"]);
      for (var col = 0; col < 2; col += 1) {
        var pair = sequence[row * 2 + col];
        var leftIndex = positionToIndex(row, col);
        var rightIndex = positionToIndex(row, GRID_SIZE - 1 - col);
        expectedBoard[leftIndex] = token(leftIndex, pair[0], "mirror-left", ["zone-source"]);
        expectedBoard[rightIndex] = token(rightIndex, pair[1], "mirror-right", ["zone-copy"]);
        addCandidate(candidates, "mirror-trap", "unchanged-symbol", rightIndex, token(rightIndex, pair[0], "mirror-right", ["zone-copy"]));
        addCandidate(candidates, "mirror-trap", "wrong-paired-symbol", rightIndex, token(rightIndex, pairs[(row + col + 1) % pairs.length][1], "mirror-right", ["zone-copy"]));
        addCandidate(candidates, "mirror-trap", "swapped-partner", rightIndex, token(rightIndex, sequence[(row + 1) % sequence.length][1], "mirror-right", ["zone-copy"]));
      }
    }
    return makeExpectedRound("mirror-trap", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That mirrored symbol uses the wrong counterpart.", "Only the mirrored side can be wrong; infer the pair mapping from repeated rows.", function () {
      return "The left side establishes source symbols and the right side consistently transforms them; the tapped copy uses the wrong partner.";
    }, function (answerIndex) {
      var row = Math.floor(answerIndex / GRID_SIZE);
      var col = answerIndex % GRID_SIZE;
      return [positionToIndex(row, GRID_SIZE - 1 - col)];
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
      addCandidate(candidates, "card-straight", "impossible-skipped-rank", index, cardCell(index, CARDS.ranks[mod(rankIndex + 3, CARDS.ranks.length)], cardCellValue.value.suitIndex));
    });
    return makeExpectedRound("card-straight", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That card breaks the straight.", "Read each row as a rank progression; suits also follow a steady cycle.", function () {
      return "Each row forms a five-card straight with a consistent suit cycle; the tapped card breaks rank or suit order.";
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
      var cells = [logicCell(positionToIndex(row, 0), String(a)), logicCell(positionToIndex(row, 1), String(b)), logicCell(positionToIndex(row, 2), gate), simpleCell(positionToIndex(row, 3), "=", "logic", "equals", ["token-equals"]), logicCell(positionToIndex(row, 4), String(output))];
      cells.forEach(function (cell) {
        expectedBoard[cell.index] = cell;
      });
      addCandidate(candidates, "logic-gate-row", gate.toLowerCase() + "-output-wrong", positionToIndex(row, 4), logicCell(positionToIndex(row, 4), String(output ? 0 : 1)));
    }
    return makeExpectedRound("logic-gate-row", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That output is wrong for the gate.", "Evaluate A and B through the gate; only one row outputs the wrong bit.", function (selected, expected) {
      var row = Math.floor(selected.answerIndex / GRID_SIZE) + 1;
      return "Rows establish tiny logic circuits; row " + row + " has the wrong output for its gate.";
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
      [dieCell(positionToIndex(row, 0), a), dieCell(positionToIndex(row, 1), b), dieCell(positionToIndex(row, 2), c), simpleCell(positionToIndex(row, 3), "=", "math", "equals", ["token-equals"]), simpleCell(positionToIndex(row, 4), String(sum), "target", "sum target " + sum, ["token-target"], sum)].forEach(function (cell) {
        expectedBoard[cell.index] = cell;
      });
      addCandidate(candidates, "dice-sum", "sum-too-high", positionToIndex(row, 4), simpleCell(positionToIndex(row, 4), String(sum + 1), "target", "sum target " + (sum + 1), ["token-target"], sum + 1));
      addCandidate(candidates, "dice-sum", "sum-too-low", positionToIndex(row, 4), simpleCell(positionToIndex(row, 4), String(sum - 1), "target", "sum target " + (sum - 1), ["token-target"], sum - 1));
      addCandidate(candidates, "dice-sum", "die-breaks-total", positionToIndex(row, 1), dieCell(positionToIndex(row, 1), mod(b + 2, 6) + 1));
    }
    return makeExpectedRound("dice-sum", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That die or total breaks the row sum.", "Numbers stay small: add the first three dice and compare to the target.", function () {
      return "Each row's first three dice add to the target; the tapped cell is the only row whose math fails.";
    }));
  }

  function generateChessAttack(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var pieces = [
      { symbol: chessByTag("rook"), vectors: [[0, 3], [2, 0], [-1, 0]], bad: [[2, 2], [1, 1]], label: "rook" },
      { symbol: chessByTag("bishop"), vectors: [[2, 2], [-1, 1], [3, -3]], bad: [[0, 2], [2, 0]], label: "bishop" },
      { symbol: chessByTag("knight"), vectors: [[2, 1], [1, -2], [-2, 1]], bad: [[1, 1], [0, 1]], label: "knight" },
      { symbol: chessByTag("king"), vectors: [[1, 1], [0, -1], [-1, 0]], bad: [[2, 0], [2, 2]], label: "king" },
      { symbol: chessByTag("queen"), vectors: [[0, 4], [3, 3], [-2, 0]], bad: [[2, 1], [1, 2]], label: "queen" }
    ];
    var expectedBoard = [];
    var candidates = [];
    pieces.forEach(function (piece, row) {
      var vector = piece.vectors[(row + roundNumber) % piece.vectors.length];
      [token(positionToIndex(row, 0), piece.symbol, "chess", ["token-chess"]), simpleCell(positionToIndex(row, 1), "→", "attack", "attacks", ["token-equals"]), simpleCell(positionToIndex(row, 2), vectorLabel(vector), "vector", "target vector " + vectorLabel(vector), ["token-vector"], vectorLabel(vector)), simpleCell(positionToIndex(row, 3), "=", "attack", "equals", ["token-equals"]), simpleCell(positionToIndex(row, 4), "OK", "attack", "legal attack", ["token-ok"])].forEach(function (cell) {
        expectedBoard[cell.index] = cell;
      });
      piece.bad.forEach(function (badVector, modeIndex) {
        addCandidate(candidates, "chess-attack", piece.label + "-illegal-target-" + modeIndex, positionToIndex(row, 2), simpleCell(positionToIndex(row, 2), vectorLabel(badVector), "vector", "target vector " + vectorLabel(badVector), ["token-vector"], vectorLabel(badVector)));
      });
    });
    return makeExpectedRound("chess-attack", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That piece cannot attack the shown target.", "Rook straight, bishop diagonal, knight L, king one square, queen straight or diagonal.", function (selected, expected, board) {
      var row = Math.floor(selected.answerIndex / GRID_SIZE) + 1;
      return "Rows teach the legal movement families; row " + row + " assigns a target vector its piece cannot attack.";
    }));
  }

  function generateGoLiberties(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var expectedBoard = [];
    var candidates = [];
    var black = GO[0];
    var white = GO[1];
    var liberty = GO[3];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      [white, liberty, black, liberty, white].forEach(function (symbol, col) {
        expectedBoard[positionToIndex(row, col)] = token(positionToIndex(row, col), symbol, symbol.id === "go-black" ? "go go-black" : symbol.id === "go-white" ? "go go-white" : "go liberty", ["token-go"]);
      });
      addCandidate(candidates, "go-liberties", "one-too-few-liberties", positionToIndex(row, 1), token(positionToIndex(row, 1), white, "go go-white", ["token-go"]));
      addCandidate(candidates, "go-liberties", "one-too-many-liberties", positionToIndex(row, 0), token(positionToIndex(row, 0), liberty, "go liberty", ["token-go"]));
      addCandidate(candidates, "go-liberties", "suicide-like-fill", positionToIndex(row, 3), token(positionToIndex(row, 3), white, "go go-white", ["token-go"]));
    }
    return makeExpectedRound("go-liberties", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That point gives the black stone group the wrong liberty count.", "Only orthogonal empty points marked + count as liberties.", function (selected) {
      return "Every row shows a black stone with exactly two orthogonal liberties; the tapped point changes that count.";
    }));
  }

  function generateKnightPath(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var path = [0, 7, 18, 21, 10, 1, 12, 3, 6, 15, 22, 13, 4];
    return generateMovementRound("knight-path", random, path, isKnightMove, [
      { mode: "orthogonal-move", delta: [1, 0] },
      { mode: "diagonal-move", delta: [1, 1] },
      { mode: "wrong-l-distance", delta: [2, 2] }
    ], avoidBreakSignatures, "That knight jumps illegally.", "Follow the numbers. The answer is the first knight that does not land in an L-shape.", "The legal path establishes knight L-moves; this numbered knight is the first non-L jump.");
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
      expectedBoard[index] = simpleCell(index, String(moveIndex + 1), "path", "move " + (moveIndex + 1), ["token-path"], moveIndex + 1);
    });
    for (var move = 2; move < path.length; move += 1) {
      var prev = indexToPoint(path[move - 1]);
      breakModes.forEach(function (breakMode) {
        var wrongPoint = { row: prev.row + breakMode.delta[0], col: prev.col + breakMode.delta[1] };
        if (isInside(wrongPoint) && !legalMove(prev, wrongPoint) && path.indexOf(positionToIndex(wrongPoint.row, wrongPoint.col)) === -1) {
          var wrongIndex = positionToIndex(wrongPoint.row, wrongPoint.col);
          var board = cloneBoard(expectedBoard);
          board[path[move]] = emptyCell(path[move]);
          board[wrongIndex] = simpleCell(wrongIndex, String(move + 1), "path", "move " + (move + 1), ["token-path"], move + 1);
          candidates.push({ breakMode: breakMode.mode, answerIndex: wrongIndex, board: board, breakSignature: makeBreakSignature(typeId, breakMode.mode, wrongIndex, String(move + 1)) });
        }
      });
    }
    var selected = selectCandidate(shuffle(candidates, random), avoidBreakSignatures || []);
    return {
      board: selected.board,
      expected: expectedBoard,
      answerIndex: selected.answerIndex,
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
    return {
      index: index,
      row: Math.floor(index / GRID_SIZE),
      col: index % GRID_SIZE,
      kind: "card",
      glyph: card.glyph,
      label: card.glyph,
      value: { rank: rank, suit: card.suit, suitIndex: suitIndex },
      cornerLabel: rank,
      classNames: ["token-card", "suit-" + card.suit],
      ariaLabel: card.ariaLabel,
      interactive: true,
      expectedGlyph: card.glyph,
      expectedValue: { rank: rank, suit: card.suit, suitIndex: suitIndex }
    };
  }

  function logicCell(index, glyph) {
    return simpleCell(index, glyph, "logic", glyph + " logic token", ["token-logic"], glyph);
  }

  function dieCell(index, value) {
    return simpleCell(index, String(value), "dice", "die face " + value, ["token-dice"], value);
  }

  function dominoCell(index, left, right) {
    return simpleCell(index, left + "|" + right, "domino", "domino " + left + " to " + right, ["token-domino"], { left: left, right: right });
  }

  function token(index, symbol, kind, classes) {
    return simpleCell(index, symbol.glyph, kind, symbol.ariaLabel || symbol.label, classes || [], symbol.id, symbol.cornerLabel || "");
  }

  function simpleCell(index, glyph, kind, ariaLabel, classes, value, cornerLabel) {
    return hydrateCell(index, {
      kind: kind,
      glyph: glyph,
      label: glyph,
      value: value === undefined ? glyph : value,
      cornerLabel: cornerLabel || "",
      classNames: classes || [],
      ariaLabel: ariaLabel || glyph,
      interactive: true,
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
    return simpleCell(index, "", "empty", "empty point", ["token-empty"], "");
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
      classNames: [],
      ariaLabel: "empty",
      interactive: true
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
        classNames: (cell.classNames || []).slice(),
        ariaLabel: cell.ariaLabel,
        interactive: cell.interactive !== false,
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
    var validator = round.validator || validateExpectedMismatch;
    return validator(round);
  }

  function validateExpectedMismatch(round) {
    var mismatches = getMismatches(round);
    return {
      valid: mismatches.length === 1 && mismatches[0] === round.answerIndex && boardIsUsable(round),
      mismatches: mismatches,
      answers: mismatches.length === 1 ? mismatches : []
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

  function cardSymbols() {
    return ["A♠", "2♥", "3♦", "4♣", "5♠", "7♥", "J♣"];
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
    return CHESS.filter(hasTag(tag))[0];
  }

  function animalById(id) {
    return ANIMALS.filter(function (animal) {
      return animal.id === id;
    })[0];
  }

  function glyphSymbol(symbols, glyph) {
    return symbols.filter(function (symbol) {
      return symbol.glyph === glyph;
    })[0] || symbols[0];
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

  function vectorLabel(vector) {
    return vector[0] + "," + vector[1];
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
    var day = padNumber(date.getDate(), 2);
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

  function padNumber(number, length) {
    return String(number).padStart(length, "0");
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
    puzzleTypes: puzzleTypes,
    generateDailyPuzzle: generateDailyPuzzle,
    validatePuzzle: validatePuzzle,
    validateRound: validateRound,
    validateExpectedMismatch: validateExpectedMismatch,
    validateFirstIllegalKnight: validateFirstIllegalKnight,
    validateFirstIllegalDiagonal: validateFirstIllegalDiagonal,
    getMismatches: getMismatches,
    getLocalDateKey: getLocalDateKey,
    getPuzzleNumber: getPuzzleNumber,
    createRandom: createRandom,
    hashString: hashString
  };
}));
