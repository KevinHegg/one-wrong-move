(function (root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.OneWrongMovePuzzles = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var GRID_SIZE = 5;
  var CELL_COUNT = GRID_SIZE * GRID_SIZE;
  var LAUNCH_DATE = "2026-05-02";

  var ROW_SYMBOLS = [
    symbol("☾", "moon"),
    symbol("◆", "diamond"),
    symbol("♛", "crown"),
    symbol("☇", "lightning"),
    symbol("◉", "eye")
  ];
  var OUTSIDERS = [
    symbol("☂", "umbrella"),
    symbol("⚚", "bone mark"),
    symbol("♜", "rook")
  ];
  var ARROWS = [
    symbol("↑", "up arrow"),
    symbol("↗", "up-right arrow"),
    symbol("→", "right arrow"),
    symbol("↘", "down-right arrow"),
    symbol("↓", "down arrow"),
    symbol("↙", "down-left arrow"),
    symbol("←", "left arrow"),
    symbol("↖", "up-left arrow")
  ];
  var LATIN_SYMBOLS = [
    symbol("☾", "moon"),
    symbol("☀", "sun"),
    symbol("◆", "diamond"),
    symbol("♛", "crown"),
    symbol("◉", "eye")
  ];
  var PAIRS = [
    { a: symbol("☾", "moon"), b: symbol("☀", "sun") },
    { a: symbol("☠", "skull"), b: symbol("⚚", "bone mark") },
    { a: symbol("♛", "crown"), b: symbol("◆", "diamond") },
    { a: symbol("◉", "eye"), b: symbol("☇", "lightning") },
    { a: symbol("⚿", "key"), b: symbol("▣", "lock") }
  ];
  var MIRROR_PAIRS = [
    { left: symbol("☾", "moon"), right: symbol("☀", "sun") },
    { left: symbol("☠", "skull"), right: symbol("⚚", "bone mark") },
    { left: symbol("♛", "dark crown"), right: symbol("♔", "light crown") },
    { left: symbol("◆", "filled diamond"), right: symbol("◇", "open diamond") },
    { left: symbol("◉", "watchful eye"), right: symbol("◎", "open eye") }
  ];

  var puzzleTypes = [
    {
      id: "rule-rows",
      name: "Rule Rows",
      difficulty: 1,
      symbolBank: ROW_SYMBOLS.concat(OUTSIDERS).map(pluckLabel),
      briefingText: "Each row follows a shifted symbol recipe. Find the glyph that breaks its row.",
      exampleData: {
        columns: 5,
        caption: "A clean row recipe: moon, diamond, crown, lightning, eye.",
        cells: ["☾", "◆", "♛", "☇", "◉"]
      },
      generate: generateRuleRows,
      validate: validateExpectedMismatch
    },
    {
      id: "conveyor-shift",
      name: "Conveyor Shift",
      difficulty: 1,
      symbolBank: ROW_SYMBOLS.map(pluckLabel),
      briefingText: "Each row is the previous row shifted like a conveyor belt. Find the slipped tile.",
      exampleData: {
        columns: 5,
        caption: "Each new row moves the recipe one slot.",
        cells: ["☾", "◆", "♛", "☇", "◉", "◆", "♛", "☇", "◉", "☾"]
      },
      generate: generateConveyorShift,
      validate: validateExpectedMismatch
    },
    {
      id: "rotation-logic",
      name: "Rotation Logic",
      difficulty: 2,
      symbolBank: ARROWS.map(pluckLabel),
      briefingText: "Arrows rotate by a consistent step. Find the arrow that missed the turn.",
      exampleData: {
        columns: 4,
        caption: "A quarter-turn rhythm: up, right, down, left.",
        cells: ["↑", "→", "↓", "←"]
      },
      generate: generateRotationLogic,
      validate: validateExpectedMismatch
    },
    {
      id: "latin-trap",
      name: "Latin Trap",
      difficulty: 2,
      symbolBank: LATIN_SYMBOLS.map(pluckLabel),
      briefingText: "Rows and columns should each contain one of every symbol. Find the cell causing both duplicates.",
      exampleData: {
        columns: 5,
        caption: "Every row and column wants one of each symbol.",
        cells: ["☾", "☀", "◆", "♛", "◉"]
      },
      generate: generateLatinTrap,
      validate: validateExpectedMismatch
    },
    {
      id: "pair-pact",
      name: "Pair Pact",
      difficulty: 2,
      symbolBank: flattenPairs(PAIRS),
      briefingText: "Symbols travel in partner pairs. Find the symbol that breaks a pact.",
      exampleData: {
        columns: 5,
        caption: "Pairs sit together: moon with sun, skull with bone.",
        cells: ["☾", "☀", "•", "☠", "⚚"]
      },
      generate: generatePairPact,
      validate: validateExpectedMismatch
    },
    {
      id: "path-rhythm",
      name: "Path Rhythm",
      difficulty: 3,
      symbolBank: ["1→", "2↓", "3→", "4↓", "5→"],
      briefingText: "A numbered path alternates movement rhythm. Find the first move that breaks the beat.",
      exampleData: {
        columns: 5,
        caption: "The beat alternates horizontal, vertical, horizontal, vertical.",
        cells: ["1→", "2↓", "3→", "4↓", "5→"]
      },
      generate: generatePathRhythm,
      validate: validateExpectedMismatch
    },
    {
      id: "mirror-trap",
      name: "Mirror Trap",
      difficulty: 3,
      symbolBank: flattenMirrorPairs(MIRROR_PAIRS),
      briefingText: "The right side mirrors the left, but symbols transform into paired counterparts.",
      exampleData: {
        columns: 5,
        caption: "A mirror copy changes moon into sun and skull into bone.",
        cells: ["☾", "☠", "↔", "⚚", "☀"]
      },
      generate: generateMirrorTrap,
      validate: validateMirrorTrap
    }
  ];

  function generateDailyPuzzle(dateKey, sessionAttempt, usedBreakSignatures) {
    var attempt = Number(sessionAttempt) || 1;
    var used = usedBreakSignatures || [];
    var random = createRandom(dateKey + "|selection|" + attempt);
    var selected = [
      chooseType(random, [1]),
      chooseType(random, [2]),
      chooseType(random, [3])
    ];
    var rounds = selected.map(function (type, index) {
      var roundNumber = index + 1;
      var avoidForType = used.filter(function (signature) {
        return signature.indexOf(type.id + "|") === 0;
      });
      var round = type.generate(dateKey + "|" + attempt + "|" + type.id + "|" + roundNumber, roundNumber, attempt, avoidForType);

      round.id = type.id;
      round.name = type.name;
      round.difficulty = type.difficulty;
      round.roundNumber = roundNumber;
      round.symbolBank = type.symbolBank.slice();
      round.briefingText = type.briefingText;
      round.exampleData = cloneExample(type.exampleData);
      round.title = "Round " + roundNumber + ": " + type.name;
      round.valid = type.validate(round).valid;
      return round;
    });

    return {
      dateKey: dateKey,
      sessionAttempt: attempt,
      rounds: rounds
    };
  }

  function chooseType(random, difficulties) {
    var candidates = puzzleTypes.filter(function (type) {
      return difficulties.indexOf(type.difficulty) !== -1;
    });

    return candidates[randomIndex(random, candidates.length)];
  }

  function generateRuleRows(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var offset = randomIndex(random, ROW_SYMBOLS.length);
    var expected = [];
    var baseCells = [];
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      for (var column = 0; column < GRID_SIZE; column += 1) {
        var symbolAtCell = ROW_SYMBOLS[(offset + row + column) % ROW_SYMBOLS.length];
        expected.push(symbolAtCell.label);
        baseCells.push(tokenCell(symbolAtCell, "logic"));
      }
    }

    expected.forEach(function (expectedLabel, index) {
      var row = Math.floor(index / GRID_SIZE);
      var column = index % GRID_SIZE;

      addCandidate(candidates, "rule-rows", "wrong-next-symbol", index, nextSymbol(ROW_SYMBOLS, expectedLabel, 1).label);
      addCandidate(candidates, "rule-rows", "duplicate-symbol", index, expected[positionToIndex(row, column === 0 ? 1 : column - 1)]);
      addCandidate(candidates, "rule-rows", "outside-recipe", index, OUTSIDERS[(index + roundNumber) % OUTSIDERS.length].label);
    });

    return buildExpectedPuzzle({
      typeId: "rule-rows",
      rule: "Each row uses the same five-symbol recipe, shifted one place. One glyph breaks the row grammar.",
      instruction: "Compare rows as sequences, not as pictures. Tap the symbol that does not belong in its row.",
      hint: "The row should be a shifted version of the others. Look for the broken recipe, not the rarest symbol.",
      explanation: "That glyph breaks the shifted row sequence.",
      expected: expected,
      baseCells: baseCells,
      candidates: shuffle(candidates, random),
      avoidBreakSignatures: avoidBreakSignatures
    });
  }

  function generateConveyorShift(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var base = shuffle(ROW_SYMBOLS.slice(), random);
    var direction = random() < 0.5 ? 1 : -1;
    var expected = [];
    var baseCells = [];
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      for (var column = 0; column < GRID_SIZE; column += 1) {
        var symbolAtCell = base[mod(column + direction * row, GRID_SIZE)];
        expected.push(symbolAtCell.label);
        baseCells.push(tokenCell(symbolAtCell, "conveyor"));
      }
    }

    expected.forEach(function (expectedLabel, index) {
      var row = Math.floor(index / GRID_SIZE);
      var column = index % GRID_SIZE;

      if (row > 0) {
        addCandidate(candidates, "conveyor-shift", "wrong-shifted-position", index, expected[positionToIndex(row, mod(column + direction, GRID_SIZE))]);
        addCandidate(candidates, "conveyor-shift", "duplicate-from-previous-row", index, expected[positionToIndex(row - 1, column)]);
        addCandidate(candidates, "conveyor-shift", "neighboring-column", index, expected[positionToIndex(row, mod(column + 1, GRID_SIZE))]);
      }
    });

    return buildExpectedPuzzle({
      typeId: "conveyor-shift",
      rule: "Each row is the previous row shifted " + (direction === 1 ? "left" : "right") + " by one slot. One tile fell off the conveyor.",
      instruction: "Compare each row to the row above it. Tap the symbol that did not shift with the belt.",
      hint: "Use the row above as the source, then shift the whole row one slot.",
      explanation: "That symbol does not match the conveyor shift.",
      expected: expected,
      baseCells: baseCells,
      candidates: shuffle(candidates, random),
      avoidBreakSignatures: avoidBreakSignatures
    });
  }

  function generateRotationLogic(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var offset = randomIndex(random, ARROWS.length);
    var expected = [];
    var baseCells = [];
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      for (var column = 0; column < GRID_SIZE; column += 1) {
        var arrowIndex = mod(offset + row + column * 2, ARROWS.length);
        var arrow = ARROWS[arrowIndex];
        expected.push(arrow.label);
        baseCells.push(tokenCell(arrow, "arrow"));
      }
    }

    expected.forEach(function (expectedLabel, index) {
      var arrowIndex = findSymbolIndex(ARROWS, expectedLabel);

      addCandidate(candidates, "rotation-logic", "rotates-backward", index, ARROWS[mod(arrowIndex - 2, ARROWS.length)].label);
      addCandidate(candidates, "rotation-logic", "skips-quarter-turn", index, ARROWS[mod(arrowIndex + 2, ARROWS.length)].label);
      addCandidate(candidates, "rotation-logic", "opposite-direction", index, ARROWS[mod(arrowIndex + 4, ARROWS.length)].label);
    });

    return buildExpectedPuzzle({
      typeId: "rotation-logic",
      rule: "Across each row, arrows rotate a quarter-turn clockwise. Each new row starts one tick later.",
      instruction: "Read the grid like a mechanical pattern. Tap the arrow that missed its turn.",
      hint: "Move left to right: each arrow should turn 90 degrees clockwise. Rows also drift one arrow forward.",
      explanation: "That arrow breaks the rotation sequence.",
      expected: expected,
      baseCells: baseCells,
      candidates: shuffle(candidates, random),
      avoidBreakSignatures: avoidBreakSignatures
    });
  }

  function generateLatinTrap(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var offset = randomIndex(random, LATIN_SYMBOLS.length);
    var step = random() < 0.5 ? 1 : 2;
    var expected = [];
    var baseCells = [];
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      for (var column = 0; column < GRID_SIZE; column += 1) {
        var symbolAtCell = LATIN_SYMBOLS[mod(offset + row * step + column, GRID_SIZE)];
        expected.push(symbolAtCell.label);
        baseCells.push(tokenCell(symbolAtCell, "latin"));
      }
    }

    expected.forEach(function (expectedLabel, index) {
      var row = Math.floor(index / GRID_SIZE);
      var column = index % GRID_SIZE;

      addCandidate(candidates, "latin-trap", "row-column-duplicate", index, expected[positionToIndex(row, mod(column + 1, GRID_SIZE))]);
      addCandidate(candidates, "latin-trap", "swapped-symbol", index, expected[positionToIndex(mod(row + 1, GRID_SIZE), column)]);
      addCandidate(candidates, "latin-trap", "missing-symbol-trap", index, expected[positionToIndex(row, mod(column + 2, GRID_SIZE))]);
    });

    return buildExpectedPuzzle({
      typeId: "latin-trap",
      rule: "Every row and column should contain exactly one of each symbol. One cell creates both duplicates.",
      instruction: "Find the symbol that makes its row and its column repeat.",
      hint: "Check the row and column together. The answer causes two duplicate problems at once.",
      explanation: "That cell creates the row and column duplicate.",
      expected: expected,
      baseCells: baseCells,
      candidates: shuffle(candidates, random),
      avoidBreakSignatures: avoidBreakSignatures
    });
  }

  function generatePairPact(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var expected = [];
    var baseCells = [];
    var candidates = [];
    var pairOrder = shuffle(PAIRS.concat(PAIRS), random);

    for (var row = 0; row < GRID_SIZE; row += 1) {
      var leftPair = pairOrder[row * 2];
      var rightPair = pairOrder[row * 2 + 1];
      var rowCells = [
        tokenCell(leftPair.a, "pair"),
        tokenCell(leftPair.b, "pair"),
        { label: "•", name: "pair divider", kind: "spine", expectedLabel: "•" },
        tokenCell(rightPair.a, "pair"),
        tokenCell(rightPair.b, "pair")
      ];

      rowCells.forEach(function (cell) {
        expected.push(cell.label);
        baseCells.push(cell);
      });
    }

    [1, 4].forEach(function (column) {
      for (var row = 0; row < GRID_SIZE; row += 1) {
        var index = positionToIndex(row, column);
        var expectedLabel = expected[index];

        addCandidate(candidates, "pair-pact", "wrong-partner", index, chooseOtherPairSymbol(expectedLabel, "partner"));
        addCandidate(candidates, "pair-pact", "outsider-symbol", index, OUTSIDERS[(row + column) % OUTSIDERS.length].label);
        addCandidate(candidates, "pair-pact", "unchanged-leader", index, expected[positionToIndex(row, column - 1)]);
      }
    });

    return buildExpectedPuzzle({
      typeId: "pair-pact",
      rule: "Symbols sit in loyal pairs. One partner has broken the pact.",
      instruction: "Infer the recurring pairs, then tap the symbol that is paired with the wrong mate.",
      hint: "Look for pairs that repeat elsewhere. One partner is not with its usual match.",
      explanation: "That symbol breaks the pairing pact.",
      expected: expected,
      baseCells: baseCells,
      candidates: shuffle(candidates, random),
      avoidBreakSignatures: avoidBreakSignatures
    });
  }

  function generatePathRhythm(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var pathIndexes = [0, 1, 2, 7, 12, 13, 14, 19, 24, 23];
    var expected = makeArray("");
    var baseCells = makeArray(null).map(function () {
      return { label: "", name: "empty square", kind: "empty", expectedLabel: "" };
    });
    var candidates = [];
    var arrowPattern = ["→", "↓"];

    pathIndexes.forEach(function (boardIndex, pathIndex) {
      var arrow = arrowPattern[pathIndex % 2];
      var label = String(pathIndex + 1) + arrow;
      expected[boardIndex] = label;
      baseCells[boardIndex] = {
        label: label,
        name: "move " + (pathIndex + 1) + " " + (arrow === "→" ? "right" : "down"),
        kind: "path",
        expectedLabel: label
      };
    });

    pathIndexes.forEach(function (boardIndex, pathIndex) {
      if (pathIndex > 1 && pathIndex < pathIndexes.length - 1) {
        var expectedArrow = arrowPattern[pathIndex % 2];
        var number = String(pathIndex + 1);

        addCandidate(candidates, "path-rhythm", "repeats-axis", boardIndex, number + (expectedArrow === "→" ? "←" : "↑"));
        addCandidate(candidates, "path-rhythm", "wrong-turn", boardIndex, number + (expectedArrow === "→" ? "↓" : "→"));
        addCandidate(candidates, "path-rhythm", "diagonal-slip", boardIndex, number + (expectedArrow === "→" ? "↘" : "↙"));
      }
    });

    return buildExpectedPuzzle({
      typeId: "path-rhythm",
      rule: "Follow the numbered path. The movement rhythm alternates horizontal, vertical, horizontal, vertical.",
      instruction: "Find the first numbered move whose arrow breaks the rhythm.",
      hint: "Read the numbers in order. The answer is the first arrow that breaks the alternating beat.",
      explanation: "That move breaks the path rhythm.",
      expected: expected,
      baseCells: baseCells,
      candidates: shuffle(candidates, random),
      avoidBreakSignatures: avoidBreakSignatures
    });
  }

  function generateMirrorTrap(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var cells = makeArray(null);
    var expected = makeArray(null);
    var leftSequence = shuffle(MIRROR_PAIRS.concat(MIRROR_PAIRS), random);
    var candidates = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      var spineIndex = positionToIndex(row, 2);
      cells[spineIndex] = {
        label: "↔",
        name: "mirror divider",
        kind: "spine",
        expectedLabel: "↔",
        zone: "spine"
      };
      expected[spineIndex] = "↔";

      for (var leftColumn = 0; leftColumn < 2; leftColumn += 1) {
        var pair = leftSequence[row * 2 + leftColumn];
        var leftIndex = positionToIndex(row, leftColumn);
        var rightIndex = positionToIndex(row, GRID_SIZE - 1 - leftColumn);

        cells[leftIndex] = tokenCell(pair.left, "mirror-left", "source");
        cells[rightIndex] = tokenCell(pair.right, "mirror-right", "copy");
        expected[leftIndex] = pair.left.label;
        expected[rightIndex] = pair.right.label;

        addCandidate(candidates, "mirror-trap", "unchanged-symbol", rightIndex, pair.left.label);
        addCandidate(candidates, "mirror-trap", "wrong-paired-symbol", rightIndex, chooseWrongMirrorLabel(pair.right.label));
        addCandidate(candidates, "mirror-trap", "swapped-partner-from-another-row", rightIndex, findOtherMirrorRight(leftSequence, row, pair.right.label));
      }
    }

    return buildExpectedPuzzle({
      typeId: "mirror-trap",
      rule: "The right half mirrors the left, but every symbol changes into its paired counterpart.",
      instruction: "Infer the symbol pairs from repeats, then tap the right-side symbol with the wrong partner.",
      hint: "Only the mirrored side can be wrong. Find a source symbol whose partner is used consistently elsewhere.",
      explanation: "That mirrored symbol uses the wrong counterpart.",
      expected: expected,
      baseCells: cells,
      candidates: shuffle(candidates, random),
      avoidBreakSignatures: avoidBreakSignatures,
      relatedForAnswer: function (answerIndex) {
        var row = Math.floor(answerIndex / GRID_SIZE);
        var column = answerIndex % GRID_SIZE;

        return [positionToIndex(row, GRID_SIZE - 1 - column)];
      }
    });
  }

  function buildExpectedPuzzle(config) {
    var candidate = selectCandidate(config.candidates.filter(function (item) {
      return item.wrongLabel !== config.expected[item.answerIndex];
    }), config.avoidBreakSignatures || []);
    var cells = cloneCells(config.baseCells);

    cells[candidate.answerIndex] = cloneCell(cells[candidate.answerIndex]);
    cells[candidate.answerIndex].label = candidate.wrongLabel;
    cells[candidate.answerIndex].name = nameForLabel(candidate.wrongLabel);
    cells[candidate.answerIndex].expectedLabel = config.expected[candidate.answerIndex];

    return {
      rule: config.rule,
      instruction: config.instruction,
      hint: config.hint,
      explanation: config.explanation,
      cells: cells,
      expected: config.expected.slice(),
      answerIndex: candidate.answerIndex,
      breakMode: candidate.breakMode,
      breakSignature: candidate.breakSignature,
      fallbackUsed: candidate.fallbackUsed,
      relatedIndexes: config.relatedForAnswer ? config.relatedForAnswer(candidate.answerIndex) : []
    };
  }

  function addCandidate(candidates, typeId, breakMode, answerIndex, wrongLabel) {
    candidates.push({
      answerIndex: answerIndex,
      breakMode: breakMode,
      wrongLabel: wrongLabel,
      breakSignature: makeBreakSignature(typeId, breakMode, answerIndex, wrongLabel)
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
      if (candidateIndex !== -1 && (oldestIndex === -1 || candidateIndex < oldestIndex)) {
        return candidate;
      }
      return oldest;
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
    if (round.id === "mirror-trap") {
      return validateMirrorTrap(round);
    }

    return validateExpectedMismatch(round);
  }

  function validateExpectedMismatch(round) {
    var mismatches = getMismatches(round);

    return {
      valid: mismatches.length === 1 && mismatches[0] === round.answerIndex,
      mismatches: mismatches
    };
  }

  function validateMirrorTrap(round) {
    var mismatches = getMismatches(round);

    return {
      valid: mismatches.length === 1 && mismatches[0] === round.answerIndex && round.answerIndex % GRID_SIZE > 2,
      mismatches: mismatches
    };
  }

  function getMismatches(round) {
    var mismatches = [];

    round.cells.forEach(function (cell, index) {
      if (cell.label !== round.expected[index]) {
        mismatches.push(index);
      }
    });

    return mismatches;
  }

  function tokenCell(symbolValue, kind, zone) {
    return {
      label: symbolValue.label,
      name: symbolValue.name,
      kind: kind,
      zone: zone || "",
      expectedLabel: symbolValue.label
    };
  }

  function symbol(label, name) {
    return {
      label: label,
      name: name
    };
  }

  function pluckLabel(item) {
    return item.label;
  }

  function flattenPairs(pairs) {
    return pairs.reduce(function (labels, pair) {
      labels.push(pair.a.label, pair.b.label);
      return labels;
    }, []);
  }

  function flattenMirrorPairs(pairs) {
    return pairs.reduce(function (labels, pair) {
      labels.push(pair.left.label, pair.right.label);
      return labels;
    }, []);
  }

  function chooseOtherPairSymbol(expectedLabel) {
    var labels = flattenPairs(PAIRS).filter(function (label) {
      return label !== expectedLabel && label !== "•";
    });

    return labels[hashString(expectedLabel) % labels.length];
  }

  function chooseWrongMirrorLabel(expectedLabel) {
    var labels = MIRROR_PAIRS.map(function (pair) {
      return pair.right.label;
    }).filter(function (label) {
      return label !== expectedLabel;
    });

    return labels[hashString(expectedLabel) % labels.length];
  }

  function findOtherMirrorRight(sequence, row, expectedLabel) {
    var labels = sequence.map(function (pair) {
      return pair.right.label;
    }).filter(function (label) {
      return label !== expectedLabel;
    });

    return labels[row % labels.length];
  }

  function nextSymbol(symbols, label, step) {
    var index = findSymbolIndex(symbols, label);

    return symbols[mod(index + step, symbols.length)];
  }

  function findSymbolIndex(symbols, label) {
    for (var index = 0; index < symbols.length; index += 1) {
      if (symbols[index].label === label) {
        return index;
      }
    }

    return 0;
  }

  function nameForLabel(label) {
    var allSymbols = ROW_SYMBOLS.concat(OUTSIDERS, ARROWS, LATIN_SYMBOLS);
    var pairSymbols = [];

    PAIRS.forEach(function (pair) {
      pairSymbols.push(pair.a, pair.b);
    });
    MIRROR_PAIRS.forEach(function (pair) {
      pairSymbols.push(pair.left, pair.right);
    });
    allSymbols = allSymbols.concat(pairSymbols, [
      symbol("•", "pair divider"),
      symbol("↔", "mirror divider"),
      symbol("↙", "down-left arrow"),
      symbol("↘", "down-right arrow")
    ]);

    for (var index = 0; index < allSymbols.length; index += 1) {
      if (allSymbols[index].label === label || label.indexOf(allSymbols[index].label) !== -1) {
        return allSymbols[index].name;
      }
    }

    return "symbol";
  }

  function cloneExample(exampleData) {
    return {
      columns: exampleData.columns,
      caption: exampleData.caption,
      cells: exampleData.cells.slice()
    };
  }

  function cloneCells(cells) {
    return cells.map(cloneCell);
  }

  function cloneCell(cell) {
    return {
      label: cell.label,
      name: cell.name,
      kind: cell.kind,
      zone: cell.zone || "",
      expectedLabel: cell.expectedLabel
    };
  }

  function makeArray(value) {
    return Array.from({ length: CELL_COUNT }, function () {
      return value;
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

  function positionToIndex(row, column) {
    return row * GRID_SIZE + column;
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
    getMismatches: getMismatches,
    getLocalDateKey: getLocalDateKey,
    getPuzzleNumber: getPuzzleNumber,
    createRandom: createRandom,
    hashString: hashString
  };
}));
