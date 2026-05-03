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
    multiSelect: "multiSelect",
    twoStep: "twoStep"
  };
  var TARGET_TYPES = {
    cell: "cell",
    row: "row",
    column: "column",
    region: "region",
    outputCell: "outputCell",
    twoStep: "twoStep",
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
  var FOOD = S.food;
  var KITCHEN = S.kitchen;
  var THEME_PACKS = Symbols.themePacks || [];
  var SYMBOL_BY_ID = Symbols.symbolById || function (id) { return { id: id, glyph: id, label: id, ariaLabel: id }; };

  var PAIR_SYMBOLS = [
    pairSymbols("moon", "sun"),
    pairSymbols("key", "lock"),
    pairSymbols("skull", "bone"),
    pairSymbols("bee", "flower"),
    pairSymbols("thread", "needle")
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
      symbols: flattenPairSymbols(PAIR_SYMBOLS),
      briefing: "Symbols travel in real-world partner pairs. Tap the symbol with the wrong partner.",
      example: example(5, "Moon pairs with sun; bee pairs with flower.", ["🌙", "☀️", "•", "🐝", "🌸"]),
      generate: generatePairPact,
      validator: validateExpectedMismatch
    }),
    type({
      id: "object-row-imposter",
      name: "Object Row Imposter",
      sourceWorld: "Objects",
      difficulty: 1,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "category grouping",
      symbols: objectPuzzleSymbols(),
      briefing: "Each row is a clean group of related objects. Tap the object that does not belong.",
      example: example(5, "Four kitchen tools and one fruit: tap the fruit.", ["🔪", "🥄", "🍳", "🍌", "🥣"]),
      generate: generateObjectRowImposter,
      validator: validateExpectedMismatch
    }),
    type({
      id: "category-swap",
      name: "Category Swap",
      sourceWorld: "Objects",
      difficulty: 2,
      answerMode: ANSWER_MODES.multiSelect,
      cognitiveSkill: "category repair",
      symbols: objectPuzzleSymbols(),
      briefing: "Two objects were swapped between category rows. Select both wrong objects, then submit.",
      example: example(5, "A wrench in foods and a tomato in tools must trade back.", ["🔧", "🍅", "→", "2", "moves"]),
      generate: generateCategorySwap,
      validator: validateObjectSwap
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
      id: "dish-ingredient-imposter",
      name: "Dish Ingredient Imposter",
      sourceWorld: "Food",
      difficulty: 1,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "recipe grouping",
      symbols: dishPuzzleSymbols(),
      briefing: "Each row shows a dish and common ingredients. Tap the ingredient that does not belong.",
      example: example(5, "Taco row: taco, corn, meat, lettuce, cheese; a wrench would not belong.", ["🌮", "🌽", "🥩", "🥬", "🔧"]),
      generate: generateDishIngredientImposter,
      validator: validateExpectedMismatch
    }),
    type({
      id: "recipe-swap",
      name: "Recipe Swap",
      sourceWorld: "Food",
      difficulty: 2,
      answerMode: ANSWER_MODES.multiSelect,
      cognitiveSkill: "recipe repair",
      symbols: dishPuzzleSymbols(),
      briefing: "Two ingredients were swapped between dishes. Select both wrong ingredients, then submit.",
      example: example(5, "Tomato belongs with pizza; beans belong with taco.", ["🍕", "🍅", "↔", "🌮", "🫘"]),
      generate: generateRecipeSwap,
      validator: validateObjectSwap
    }),
    type({
      id: "object-rack-complete",
      name: "Object Rack Complete",
      sourceWorld: "Objects",
      difficulty: 2,
      answerMode: ANSWER_MODES.twoStep,
      cognitiveSkill: "category completion",
      symbols: objectPuzzleSymbols(),
      briefing: "Choose the blank square, then choose the rack object that completes that row's category.",
      example: example(5, "Pick the blank in a tool row, then pick the tool from the rack.", ["🔪", "□", "🥄", "+", "🍳"]),
      generate: generateObjectRackComplete,
      validator: validateObjectRackComplete
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
      id: "row-rhythm",
      name: "Row Rhythm",
      sourceWorld: "Logic Grid",
      difficulty: 2,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "row-level pattern",
      symbols: ["A", "B", "C", "D", "E"],
      briefing: "Four rows follow the same rhythm. Tap any cell in the row that breaks it.",
      example: example(5, "A row target accepts any cell in the broken row.", ["A", "B", "C", "D", "E"]),
      generate: generateRowRhythm,
      validator: validateRowTarget
    }),
    type({
      id: "mirror-trap",
      name: "Mirror Trap",
      sourceWorld: "Relationships",
      difficulty: 2,
      answerMode: ANSWER_MODES.identifyOne,
      cognitiveSkill: "mapping inference",
      symbols: flattenPairSymbols(PAIR_SYMBOLS),
      briefing: "The right side mirrors the left, but symbols transform into counterparts.",
      example: example(5, "A mirror copy changes key into lock and bee into flower.", ["🔑", "🐝", "↔", "🌸", "🔒"]),
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
      id: "yahtzee-fix",
      name: "Yahtzee Fix",
      sourceWorld: "Yahtzee",
      difficulty: 3,
      answerMode: ANSWER_MODES.multiSelect,
      cognitiveSkill: "dice category repair",
      symbols: DICE.concat(["3K", "4K", "FH", "SS", "LS"]),
      briefing: "Each row should satisfy its dice category. Select the two dice that must change, then submit.",
      example: example(5, "FH means full house; SS means small straight; LS means large straight.", ["FH", "3", "3", "5", "5"]),
      generate: generateYahtzeeFix,
      validator: validateExactMismatchSet
    }),
    type({
      id: "maze-exit",
      name: "Maze Exit",
      sourceWorld: "Maze",
      difficulty: 2,
      answerMode: ANSWER_MODES.chooseOne,
      cognitiveSkill: "route tracing",
      symbols: ["S", "A", "B", "C", "·", "■"],
      briefing: "Start at S. Follow open paths. Choose the exit the route can actually reach.",
      example: example(5, "Walls block movement; only orthogonal open paths connect.", ["S", "·", "■", "A", "C"]),
      generate: generateMazeExit,
      validator: validateMazeExit
    }),
    type({
      id: "maze-key-exit",
      name: "Maze Key Exit",
      sourceWorld: "Maze",
      difficulty: 3,
      answerMode: ANSWER_MODES.twoStep,
      cognitiveSkill: "route and pair planning",
      symbols: ["S", "K1", "K2", "A", "B", "·", "■"],
      briefing: "Tap the reachable key, then tap the exit it opens. Submit the two-step move.",
      example: example(5, "A key only matters if you can reach it and it opens the reachable exit.", ["S", "·", "K1", "→", "A"]),
      generate: generateMazeKeyExit,
      validator: validateTwoStep
    }),
    type({
      id: "scrabble-cross",
      name: "Scrabble Cross",
      sourceWorld: "Words",
      difficulty: 3,
      answerMode: ANSWER_MODES.twoStep,
      cognitiveSkill: "word crossing",
      symbols: ["CAT", "DOG", "SUN", "KEY", "LOCK", "A", "O", "E", "R"],
      briefing: "Choose the empty square and rack tile that make both crossing words valid.",
      example: example(5, "Use common words only; one square and one rack letter work together.", ["C", "·", "T", "+", "A"]),
      generate: generateScrabbleCross,
      validator: validateTwoStep
    }),
    type({
      id: "mini-crossword-fill",
      name: "Mini Crossword Fill",
      sourceWorld: "Crossword",
      difficulty: 2,
      answerMode: ANSWER_MODES.twoStep,
      cognitiveSkill: "crossing words",
      symbols: ["CAT", "DOG", "SUN", "TREE", "A", "O", "E", "R"],
      briefing: "Choose the empty crossword square, then choose the rack letter that makes both crossing words valid.",
      example: example(5, "One blank square plus one rack letter completes two common crossing words.", ["C", "□", "T", "+", "A"]),
      generate: generateMiniCrosswordFill,
      validator: validateWordTwoStep
    }),
    type({
      id: "crossword-pair",
      name: "Crossword Pair",
      sourceWorld: "Crossword",
      difficulty: 3,
      answerMode: ANSWER_MODES.multiSelect,
      cognitiveSkill: "crossing word repair",
      symbols: ["WORD", "PLAY", "GAME", "BIRD", "A", "E", "O", "R"],
      briefing: "Fill two blanks so every crossing word is valid. Select the two blanks and two rack letters, then submit.",
      example: example(5, "Select both blank squares and their rack letters as one planned move.", ["W", "□", "R", "D", "+"]),
      generate: generateCrosswordPair,
      validator: validateExactAnswerSet
    }),
    type({
      id: "circuit-switch-pair",
      name: "Circuit Switch Pair",
      sourceWorld: "Circuits",
      difficulty: 3,
      answerMode: ANSWER_MODES.multiSelect,
      cognitiveSkill: "logic repair",
      symbols: ["0", "1", "AND", "OR", "XOR", "LIGHT"],
      briefing: "Select the exact two switches to flip so the target light turns on.",
      example: example(5, "Two switches feed tiny gates; the target should turn on.", ["0", "1", "XOR", "=", "ON"]),
      generate: generateCircuitSwitchPair,
      validator: validateCircuitSwitchPair
    }),
    type({
      id: "maze-bridge-repair",
      name: "Maze Bridge Repair",
      sourceWorld: "Maze",
      difficulty: 3,
      answerMode: ANSWER_MODES.multiSelect,
      cognitiveSkill: "route repair",
      symbols: ["S", "F", "·", "■", "×"],
      briefing: "Select the two broken bridge tiles that repair the route from S to F.",
      example: example(5, "Repair exactly two breaks to connect the route.", ["S", "×", "·", "×", "F"]),
      generate: generateMazeBridgeRepair,
      validator: validateMazeBridgeRepair
    }),
    type({
      id: "tetris-fit",
      name: "Tetris Fit",
      sourceWorld: "Tetris",
      difficulty: 3,
      answerMode: ANSWER_MODES.multiSelect,
      cognitiveSkill: "polyomino placement",
      symbols: ["I", "O", "T", "L", "J", "S", "Z", "■"],
      briefing: "Select the four cells where the falling tetromino fits to complete the target line.",
      example: example(5, "A T piece uses four connected squares; select the exact landing cells.", ["", "■", "", "■", ""]),
      generate: generateTetrisFit,
      validator: validateExactAnswerSet
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
      briefing: "Read each row as a simple food chain. Tap the animal or plant that does not belong.",
      example: example(5, "Plant feeds insect; frog eats insect; snake eats frog; hawk hunts snake.", ["🌱", "🐛", "🐸", "🐍", "🦅"]),
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
      symbolBank: config.symbols.map(symbolChipData),
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

  function generateSurvivalLevels(dateKey, sessionAttempt, usedBreakSignatures, maxLevels) {
    var attempt = Number(sessionAttempt) || 1;
    var count = Math.max(1, Number(maxLevels) || 100);
    var used = (usedBreakSignatures || []).slice();
    var random = createRandom(dateKey + "|survival-selection|" + attempt);
    var selected = selectSurvivalTypes(random, count);
    var levels = selected.map(function (selectedType, index) {
      var levelNumber = index + 1;
      var avoidForType = used.filter(function (signature) {
        return signature.indexOf(selectedType.id + "|") === 0;
      });
      var round = normalizeRound(selectedType, selectedType.generate(dateKey + "|" + attempt + "|survival|" + selectedType.id + "|" + levelNumber, levelNumber, attempt, avoidForType), levelNumber);
      round.levelNumber = levelNumber;
      round.title = "Level " + levelNumber + ": " + selectedType.name;
      used.push(round.breakSignature);
      return round;
    });

    return {
      dateKey: dateKey,
      sessionAttempt: attempt,
      levels: levels,
      rounds: levels
    };
  }

  function generateFreePlaySet(dateKey, sessionAttempt, usedBreakSignatures) {
    var attempt = Number(sessionAttempt) || 1;
    var used = (usedBreakSignatures || []).slice();
    var random = createRandom(dateKey + "|freeplay-selection|" + attempt);
    var selected = selectFreePlayTypes(random);
    var levels = selected.map(function (selectedType, index) {
      var puzzleNumber = index + 1;
      var avoidForType = used.filter(function (signature) {
        return signature.indexOf(selectedType.id + "|") === 0;
      });
      var round = normalizeRound(selectedType, selectedType.generate(dateKey + "|" + attempt + "|freeplay|" + selectedType.id + "|" + puzzleNumber, puzzleNumber, attempt, avoidForType), puzzleNumber);
      round.levelNumber = puzzleNumber;
      round.title = "Puzzle " + puzzleNumber + ": " + selectedType.name;
      used.push(round.breakSignature);
      return round;
    });

    return {
      dateKey: dateKey,
      sessionAttempt: attempt,
      levels: levels,
      rounds: levels
    };
  }

  function selectSurvivalTypes(random, count) {
    var selected = [];
    var activeTypes = puzzleTypes.filter(function (candidate) {
      return !candidate.retired;
    });

    for (var level = 1; level <= count; level += 1) {
      var range = level <= 3 ? [1, 2] : level <= 8 ? [2, 3] : [3, 4, 5];
      var candidates = activeTypes.filter(function (candidate) {
        return range.indexOf(candidate.difficulty) !== -1;
      });
      var previous = selected[selected.length - 1];

      if (previous) {
        candidates = prefer(candidates, function (candidate) {
          return candidate.id !== previous.id;
        });
        candidates = prefer(candidates, function (candidate) {
          return candidate.sourceWorld !== previous.sourceWorld;
        });
        candidates = prefer(candidates, function (candidate) {
          return !(candidate.sourceWorld === "Cards" && previous.sourceWorld === "Cards");
        });
        candidates = prefer(candidates, function (candidate) {
          return !(candidate.sourceWorld === "Go" && previous.sourceWorld === "Go");
        });
        candidates = prefer(candidates, function (candidate) {
          return !(candidate.isMovementPuzzle && previous.isMovementPuzzle);
        });
        candidates = prefer(candidates, function (candidate) {
          return !(isObjectFamily(candidate) && isObjectFamily(previous));
        });
        candidates = prefer(candidates, function (candidate) {
          return !(candidate.sourceWorld === "Food" && previous.sourceWorld === "Food");
        });
      }

      if (level <= 3 && !selected.some(function (candidate) { return candidate.sourceWorld !== "Symbol Grammar"; })) {
        candidates = prefer(candidates, function (candidate) {
          return candidate.sourceWorld !== "Symbol Grammar";
        });
      }

      selected.push(shuffle(candidates, random)[0]);
    }

    return selected;
  }

  function selectFreePlayTypes(random) {
    var activeTypes = puzzleTypes.filter(function (candidate) {
      return !candidate.retired && candidate.difficulty <= 3;
    });
    var selected = [];
    var preferredFirst = prefer(activeTypes, function (candidate) {
      return ["object-row-imposter", "dish-ingredient-imposter", "domino-chain", "dice-sum", "suit-cycle", "pair-pact", "maze-exit"].indexOf(candidate.id) !== -1;
    });
    selected.push(shuffle(preferredFirst, random)[0]);

    var multiOrWord = prefer(activeTypes.filter(function (candidate) {
      return selected.every(function (chosen) { return chosen.id !== candidate.id; });
    }), function (candidate) {
      return candidate.answerMode === ANSWER_MODES.multiSelect || candidate.answerMode === ANSWER_MODES.twoStep || candidate.sourceWorld === "Crossword" || candidate.sourceWorld === "Words";
    });
    selected.push(shuffle(multiOrWord, random)[0]);

    var remaining = activeTypes.filter(function (candidate) {
      return selected.every(function (chosen) {
        return chosen.id !== candidate.id && chosen.sourceWorld !== candidate.sourceWorld;
      });
    });
    if (remaining.length === 0) {
      remaining = activeTypes.filter(function (candidate) {
        return selected.every(function (chosen) { return chosen.id !== candidate.id; });
      });
    }
    selected.push(shuffle(remaining, random)[0]);
    return selected;
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
          return ["object-row-imposter", "dish-ingredient-imposter", "suit-cycle", "domino-chain", "dice-sum", "pair-pact"].indexOf(candidate.id) !== -1;
        });
      }
      if (roundIndex === 1) {
        candidates = prefer(candidates, function (candidate) {
          return ["category-swap", "recipe-swap", "object-rack-complete", "card-straight", "logic-gate-row", "mirror-trap", "chess-attack"].indexOf(candidate.id) !== -1;
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

  function isObjectFamily(candidate) {
    return ["Objects", "Food", "Ecology"].indexOf(candidate.sourceWorld) !== -1 || candidate.id === "animal-food-web";
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
    normalized.symbolBank = selectedType.symbolBank ? selectedType.symbolBank.slice() : normalized.symbols.slice();
    normalized.briefing = selectedType.briefing;
    normalized.briefingText = selectedType.briefing;
    normalized.example = cloneExample(selectedType.example);
    normalized.exampleData = cloneExample(selectedType.example);
    normalized.title = "Round " + roundNumber + ": " + selectedType.name;
    normalized.validator = selectedType.validator;
    normalized.rule = selectedType.briefing;
    normalized.answerIndices = uniqueSorted(answerIndices);
    normalized.answerIndex = typeof round.answerIndex === "number" ? round.answerIndex : normalized.answerIndices[0];
    normalized.answerSteps = (round.answerSteps || []).map(function (step) {
      return Object.assign({}, step);
    });
    if (answerMode === ANSWER_MODES.twoStep && normalized.answerIndices.length === 0) {
      normalized.answerIndices = uniqueSorted(normalized.answerSteps.map(function (step) {
        return step.index;
      }).filter(function (index) {
        return typeof index === "number";
      }));
      normalized.answerIndex = normalized.answerIndices[0];
    }
    normalized.minSelections = round.minSelections || (answerMode === ANSWER_MODES.multiSelect ? normalized.answerIndices.length : 1);
    normalized.maxSelections = round.maxSelections || (answerMode === ANSWER_MODES.multiSelect ? normalized.answerIndices.length : answerMode === ANSWER_MODES.twoStep ? normalized.answerSteps.length : 1);
    normalized.submitLabel = round.submitLabel || (answerMode === ANSWER_MODES.multiSelect || answerMode === ANSWER_MODES.twoStep ? "Submit Move" : "");
    normalized.instruction = round.instruction || instructionForMode(answerMode);
    normalized.hint = round.wrongTapHint;
    normalized.targeting = normalizeTargeting(normalized, round.targeting);
    normalized.board = applyTargetingToBoard(normalized.board, normalized.targeting, normalized.answerMode);
    normalized.cells = normalized.board;
    normalized.valid = selectedType.validator(normalized).valid;
    return normalized;
  }

  function normalizeTargeting(round, customTargeting) {
    var targeting = Object.assign({
      targetType: targetTypeForMode(round.answerMode),
      clickableIndices: [],
      answerIndices: round.answerIndices.slice(),
      answerRow: null,
      answerColumn: null,
      disabledIndices: [],
      acceptsAnyCellInAnswerRow: false,
      acceptsAnyCellInAnswerColumn: false,
      targetHint: ""
    }, customTargeting || {});

    if (targeting.answerIndices.length === 0) {
      targeting.answerIndices = round.answerIndices.slice();
    }
    if (targeting.targetType === TARGET_TYPES.row && targeting.answerRow === null) {
      targeting.answerRow = Math.floor((round.answerIndex || 0) / GRID_SIZE);
    }
    if (targeting.targetType === TARGET_TYPES.column && targeting.answerColumn === null) {
      targeting.answerColumn = (round.answerIndex || 0) % GRID_SIZE;
    }
    if (targeting.acceptsAnyCellInAnswerRow && targeting.answerRow !== null) {
      targeting.answerIndices = rowIndices(targeting.answerRow);
    }
    if (targeting.acceptsAnyCellInAnswerColumn && targeting.answerColumn !== null) {
      targeting.answerIndices = columnIndices(targeting.answerColumn);
    }
    if (targeting.clickableIndices.length === 0) {
      if (round.answerMode === ANSWER_MODES.multiSelect || targeting.targetType === TARGET_TYPES.multiSelect) {
        targeting.clickableIndices = round.board.filter(function (cell) {
          return cell.selectable !== false && cell.interactive !== false;
        }).map(function (cell) { return cell.index; });
      } else if (round.answerMode === ANSWER_MODES.twoStep || targeting.targetType === TARGET_TYPES.twoStep) {
        targeting.clickableIndices = round.board.filter(function (cell) {
          return cell.value && cell.value.selectionRole;
        }).map(function (cell) { return cell.index; });
      } else if (targeting.acceptsAnyCellInAnswerRow && targeting.answerRow !== null) {
        targeting.clickableIndices = rowIndices(targeting.answerRow);
      } else if (targeting.acceptsAnyCellInAnswerColumn && targeting.answerColumn !== null) {
        targeting.clickableIndices = columnIndices(targeting.answerColumn);
      } else {
        targeting.clickableIndices = round.board.filter(function (cell) {
          return cell.selectable !== false && cell.interactive !== false;
        }).map(function (cell) { return cell.index; });
      }
    }
    targeting.answerIndices = uniqueSorted(targeting.answerIndices);
    targeting.clickableIndices = uniqueSorted(targeting.clickableIndices);
    targeting.disabledIndices = uniqueSorted(range(CELL_COUNT).filter(function (index) {
      return targeting.clickableIndices.indexOf(index) === -1;
    }));
    return targeting;
  }

  function targetTypeForMode(answerMode) {
    if (answerMode === ANSWER_MODES.multiSelect) {
      return TARGET_TYPES.multiSelect;
    }
    if (answerMode === ANSWER_MODES.twoStep) {
      return TARGET_TYPES.twoStep;
    }
    return TARGET_TYPES.cell;
  }

  function applyTargetingToBoard(board, targeting, answerMode) {
    var clickable = targeting.clickableIndices || [];
    return board.map(function (cell, index) {
      var clone = hydrateCell(index, cell);
      var isClickable = clickable.indexOf(index) !== -1;

      if (answerMode === ANSWER_MODES.identifyOne || answerMode === ANSWER_MODES.chooseOne) {
        clone.interactive = isClickable;
        clone.selectable = isClickable;
      }
      if (!isClickable) {
        clone.classNames = (clone.classNames || []).concat(["is-disabled-target"]);
      }
      if (targeting.acceptsAnyCellInAnswerRow && targeting.answerRow === clone.row) {
        clone.classNames = (clone.classNames || []).concat(["target-row"]);
        clone.ariaLabel = "Row " + (clone.row + 1) + " target, " + clone.ariaLabel;
      }
      if (targeting.acceptsAnyCellInAnswerColumn && targeting.answerColumn === clone.col) {
        clone.classNames = (clone.classNames || []).concat(["target-column"]);
        clone.ariaLabel = "Column " + (clone.col + 1) + " target, " + clone.ariaLabel;
      }
      return clone;
    });
  }

  function instructionForMode(answerMode) {
    if (answerMode === ANSWER_MODES.chooseOne) {
      return "Choose the best move square.";
    }
    if (answerMode === ANSWER_MODES.multiSelect) {
      return "Select every required square, then submit.";
    }
    if (answerMode === ANSWER_MODES.twoStep) {
      return "Choose both parts of the move, then submit.";
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
      explanation: typeof config.explanation === "function" ? config.explanation(selected, expected, board) : config.explanation,
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

  function generateObjectRowImposter(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var packs = shuffle(themePackSubset(["kitchen-tools", "forest-animals", "musical-instruments", "weather", "sports-balls", "workshop-tools"]), random).slice(0, GRID_SIZE);
    var expectedBoard = [];
    var candidates = [];

    packs.forEach(function (pack, row) {
      pack.items.slice(0, GRID_SIZE).forEach(function (symbol, col) {
        expectedBoard[positionToIndex(row, col)] = objectCell(positionToIndex(row, col), symbol, pack, "object");
      });
      pack.imposters.slice(0, 2).forEach(function (imposter, modeIndex) {
        var answerIndex = positionToIndex(row, GRID_SIZE - 2 + modeIndex);
        addCandidate(candidates, "object-row-imposter", "imposter-in-" + pack.id, answerIndex, objectCell(answerIndex, imposter, pack, "object"));
      });
    });
    return makeExpectedRound("object-row-imposter", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, function (selected) {
      return labelForCell(selected.wrong) + " does not belong in that object row.";
    }, "Find the row's shared theme, then tap the one object outside it.", function (selected) {
      return labelForCell(selected.wrong) + " is the only object outside the row's category.";
    }));
  }

  function generateCategorySwap(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var pairs = [
      ["kitchen-tools", "workshop-tools", 1, 3],
      ["forest-animals", "musical-instruments", 2, 4],
      ["weather", "sports-balls", 0, 4],
      ["salad-ingredients", "kitchen-tools", 1, 2],
      ["pizza-ingredients", "workshop-tools", 3, 1]
    ].map(function (item) {
      return buildThemeSwapCandidate("category-swap", item[0], item[1], item[2], item[3]);
    });
    var selected = selectCandidate(shuffle(pairs, random), avoidBreakSignatures || []);

    return exactSetRound(ANSWER_MODES.multiSelect, selected.board, selected.expected, selected.answerIndices, "Select both swapped objects to repair the category rows.", "Pick exactly the two objects sitting in the wrong category rows.", selected.breakSignature, selected.mode, "The two selected objects belong in each other's rows.", selected.evidence, 2);
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
    var round = makeExpectedRound("dice-sum", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That die or total breaks the row sum.", "Numbers stay small: add the first three dice and compare to the target.", function () {
      return "Each row's first three dice add to the target; the tapped cell is the only row whose math fails.";
    }));
    if (round.answerIndex % GRID_SIZE === 4) {
      round.instruction = "Tap the wrong total.";
      round.targeting = {
        targetType: TARGET_TYPES.outputCell,
        clickableIndices: [4, 9, 14, 19, 24],
        answerIndices: [round.answerIndex],
        targetHint: "Only total cells are clickable."
      };
      round.explanation = "That total does not equal the three dice in its row.";
      round.wrongTapHint = "Only totals can be wrong in this puzzle: add the three dice, then tap the bad total.";
    } else {
      round.instruction = "Tap the wrong die.";
      round.targeting = {
        targetType: TARGET_TYPES.cell,
        clickableIndices: [0, 1, 2, 5, 6, 7, 10, 11, 12, 15, 16, 17, 20, 21, 22],
        answerIndices: [round.answerIndex],
        targetHint: "Only dice cells are clickable."
      };
      round.explanation = "That die is the one that makes its row sum fail.";
      round.wrongTapHint = "Only dice can be wrong in this puzzle: add the dice and compare with the total.";
    }
    return round;
  }

  function generateDishIngredientImposter(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var rows = shuffle(dishRows(), random).slice(0, GRID_SIZE);
    var expectedBoard = [];
    var candidates = [];

    rows.forEach(function (dish, row) {
      expectedBoard[positionToIndex(row, 0)] = objectCell(positionToIndex(row, 0), SYMBOL_BY_ID(dish.dish), { id: dish.id, name: dish.name }, "dish");
      dish.ingredients.slice(0, 4).forEach(function (symbolId, offset) {
        expectedBoard[positionToIndex(row, offset + 1)] = objectCell(positionToIndex(row, offset + 1), SYMBOL_BY_ID(symbolId), { id: dish.id, name: dish.name }, "ingredient");
      });
      dish.imposters.slice(0, 2).forEach(function (symbolId, imposterIndex) {
        var answerIndex = positionToIndex(row, 3 + imposterIndex);
        addCandidate(candidates, "dish-ingredient-imposter", "wrong-ingredient-" + dish.id, answerIndex, objectCell(answerIndex, SYMBOL_BY_ID(symbolId), { id: dish.id, name: dish.name }, "ingredient"));
      });
    });
    return makeExpectedRound("dish-ingredient-imposter", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, function (selected) {
      return labelForCell(selected.wrong) + " is not one of the common ingredients for that dish.";
    }, "Read the dish at the start of the row, then find the ingredient that does not fit.", function (selected) {
      return labelForCell(selected.wrong) + " is the only ingredient outside the row's dish.";
    }));
  }

  function generateRecipeSwap(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var swaps = [
      ["taco", "pizza", 1, 3],
      ["salad", "sushi", 2, 2],
      ["burger", "breakfast", 3, 1],
      ["pizza", "salad", 2, 4],
      ["sushi", "taco", 1, 4]
    ].map(function (item) {
      return buildRecipeSwapCandidate(item[0], item[1], item[2], item[3]);
    });
    var selected = selectCandidate(shuffle(swaps, random), avoidBreakSignatures || []);

    return exactSetRound(ANSWER_MODES.multiSelect, selected.board, selected.expected, selected.answerIndices, "Select both swapped ingredients to repair the dishes.", "Pick exactly the two ingredients that belong in each other's dish rows.", selected.breakSignature, selected.mode, "Those two ingredients were swapped between dishes.", selected.evidence, 2);
  }

  function generateObjectRackComplete(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var candidates = [
      buildObjectRackCandidate("kitchen-tools", 1, ["banana", "basketball", "wrench", "tomato"]),
      buildObjectRackCandidate("musical-instruments", 2, ["hammer", "soccer-ball", "cloud", "cheese"]),
      buildObjectRackCandidate("weather", 3, ["pizza", "fox", "knife", "basketball"]),
      buildObjectRackCandidate("sports-balls", 1, ["guitar", "tomato", "owl", "wrench"]),
      buildObjectRackCandidate("workshop-tools", 2, ["banana", "flower", "trumpet", "coffee"])
    ];
    var selected = selectCandidate(shuffle(candidates, random), avoidBreakSignatures || []);

    return {
      answerMode: ANSWER_MODES.twoStep,
      board: selected.board,
      answerIndex: selected.answerIndices[0],
      answerIndices: selected.answerIndices,
      answerSteps: [
        { role: "board-square", index: selected.blankIndex, tokenId: "blank", label: "Category blank" },
        { role: "rack-object", index: selected.rackIndex, tokenId: selected.answerSymbol.id, label: selected.answerSymbol.label }
      ],
      minSelections: 2,
      maxSelections: 2,
      submitLabel: "Submit Move",
      explanation: selected.answerSymbol.label + " completes the " + selected.pack.name.toLowerCase() + " row.",
      wrongTapHint: "Choose the blank square first, then the rack object that belongs with that row.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "Only " + selected.answerSymbol.label + " completes the " + selected.pack.name + " row.",
      relatedIndexes: selected.answerIndices,
      objectRackSolutionCount: 1
    };
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
    var round = makeExpectedRound("logic-gate-row", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That output is wrong for the gate.", "Evaluate A and B through the gate; only one row outputs the wrong bit.", function (selected) {
      return "Rows establish tiny logic circuits; row " + (Math.floor(selected.answerIndex / GRID_SIZE) + 1) + " has the wrong output for its gate.";
    }));
    round.instruction = "Tap the wrong output.";
    round.targeting = {
      targetType: TARGET_TYPES.outputCell,
      clickableIndices: [4, 9, 14, 19, 24],
      answerIndices: [round.answerIndex],
      targetHint: "Only output cells are clickable."
    };
    return round;
  }

  function generateRowRhythm(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var symbols = ["A", "B", "C", "D", "E"];
    var expectedBoard = [];
    var candidates = [];

    forEachIndex(function (index, row, col) {
      expectedBoard[index] = glyphCell(index, symbols[mod(col + row, symbols.length)], "rowtarget", "rhythm symbol " + symbols[mod(col + row, symbols.length)], ["token-rowtarget"]);
    });
    for (var row = 0; row < GRID_SIZE; row += 1) {
      var answerIndex = positionToIndex(row, 2);
      addCandidate(candidates, "row-rhythm", "broken-row-center", answerIndex, glyphCell(answerIndex, symbols[mod(row + 4, symbols.length)], "rowtarget", "wrong rhythm symbol", ["token-rowtarget"]));
    }
    var round = makeExpectedRound("row-rhythm", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, "That row breaks the rhythm.", "This is a row target: tap any cell in the row whose A-B-C-D-E rhythm is out of order.", function (selected) {
      return "Row " + (Math.floor(selected.answerIndex / GRID_SIZE) + 1) + " is the only row whose shifted rhythm is broken.";
    }));
    var answerRow = Math.floor(round.answerIndex / GRID_SIZE);
    round.instruction = "Tap the row that breaks the rule.";
    round.targeting = {
      targetType: TARGET_TYPES.row,
      clickableIndices: range(CELL_COUNT),
      answerRow: answerRow,
      acceptsAnyCellInAnswerRow: true,
      answerIndices: rowIndices(answerRow),
      targetHint: "Any cell in the broken row counts."
    };
    return round;
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
    var basePieces = [
      { number: 1, tag: "rook", index: 0 },
      { number: 2, tag: "bishop", index: 1 },
      { number: 3, tag: "knight", index: 7 },
      { number: 4, tag: "queen", index: 14 },
      { number: 5, tag: "king", index: 13 },
      { number: 6, tag: "rook", index: 17 },
      { number: 7, tag: "bishop", index: 12 },
      { number: 8, tag: "knight", index: 18 },
      { number: 9, tag: "queen", index: 9 },
      { number: 10, tag: "king", index: 20 }
    ];
    return ["identity", "rotate90", "rotate180", "mirrorH", "mirrorV", "transpose"].map(function (transform) {
      var board = buildChessBoard(basePieces.map(function (piece) {
        return {
          number: piece.number,
          tag: piece.tag,
          index: transformIndex(piece.index, transform)
        };
      }));
      var scenario = {
        mode: "ten-piece-sequence-" + transform,
        breakNumber: 9
      };
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

  function buildChessBoard(pieces) {
    var board = emptyBoard();

    pieces.forEach(function (piece) {
      board[piece.index] = chessPieceCell(piece.index, piece.tag, piece.number);
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
    var baseBlack = [2, 3, 6, 9, 14, 18, 16, 22, 23];
    var baseWhite = [7, 8, 13, 21, 1];
    var baseAnswer = 12;
    var transforms = ["identity", "rotate90", "rotate180", "mirrorH", "mirrorV", "transpose"];

    return transforms.map(function (transform) {
      var black = baseBlack.map(function (index) { return transformIndex(index, transform); });
      var white = baseWhite.map(function (index) { return transformIndex(index, transform); });
      var answerIndex = transformIndex(baseAnswer, transform);
      var board = goBoard(black, white, [], []);
      return {
        mode: "dense-capture-three-" + transform,
        board: board,
        answerIndex: answerIndex,
        captured: baseWhite.slice(0, 3).map(function (index) { return transformIndex(index, transform); }),
        breakSignature: makeBreakSignature("go-capture-max", "dense-capture-three-" + transform, answerIndex, "captures-3")
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
    var baseMarked = [12, 13];
    var baseBlack = [2, 3, 20, 21, 22];
    var baseWhite = [8, 17, 18, 1, 4, 23];
    var baseAnswer = [7, 11, 14];

    return transforms.map(function (transform) {
      var marked = baseMarked.map(function (index) { return transformIndex(index, transform); });
      var black = baseBlack.map(function (index) { return transformIndex(index, transform); }).concat(marked);
      var white = baseWhite.map(function (index) { return transformIndex(index, transform); });
      var answerIndices = baseAnswer.map(function (index) { return transformIndex(index, transform); });
      var board = goBoard(black, white, marked, []);
      return {
        mode: "dense-marked-liberties-" + transform,
        board: board,
        answerIndices: uniqueSorted(answerIndices),
        breakSignature: makeBreakSignature("go-liberties", "dense-marked-liberties-" + transform, uniqueSorted(answerIndices).join("."), "set")
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
      submitLabel: "Submit Move",
      explanation: "Those are all " + selected.answerIndices.length + " liberties of the marked group.",
      wrongTapHint: "Liberties are empty points directly up, down, left, or right from the marked group.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "The marked group touches exactly these empty orthogonal points: " + selected.answerIndices.map(displayPoint).join(", ") + ".",
      relatedIndexes: selected.answerIndices
    };
  }

  function generateYahtzeeFix(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var expectedBoard = emptyBoard();
    var candidates = [];
    var rows = [
      { label: "3K", expected: [4, 4, 4, 2, 6], wrong: [4, 1, 4, 2, 5], answers: [1, 4], mode: "three-kind-two-dice" },
      { label: "4K", expected: [2, 2, 2, 2, 5], wrong: [2, 6, 2, 3, 5], answers: [1, 3], mode: "four-kind-two-dice" },
      { label: "FH", expected: [3, 3, 5, 5, 5], wrong: [3, 2, 5, 4, 5], answers: [1, 3], mode: "full-house-two-dice" },
      { label: "SS", expected: [1, 2, 3, 4, 6], wrong: [1, 2, 6, 4, 1], answers: [2, 4], mode: "small-straight-two-dice" },
      { label: "LS", expected: [2, 3, 4, 5, 6], wrong: [2, 3, 1, 1, 6], answers: [2, 3], mode: "large-straight-two-dice" }
    ];

    rows.forEach(function (rowData, row) {
      rowData.expected.forEach(function (value, col) {
        var index = positionToIndex(row, col);
        expectedBoard[index] = dieCell(index, value);
        expectedBoard[index].subLabel = col === 0 ? rowData.label : "";
        expectedBoard[index].ariaLabel += col === 0 ? " in " + rowData.label + " row" : "";
      });
    });

    rows.forEach(function (rowData, row) {
      var board = cloneBoard(expectedBoard);
      rowData.wrong.forEach(function (value, col) {
        var index = positionToIndex(row, col);
        board[index] = dieCell(index, value);
        board[index].expectedGlyph = String(rowData.expected[col]);
        board[index].expectedValue = rowData.expected[col];
        board[index].subLabel = col === 0 ? rowData.label : "";
      });
      candidates.push({
        breakMode: rowData.mode,
        board: board,
        expected: cloneBoard(expectedBoard),
        answerIndices: rowData.answers.map(function (col) { return positionToIndex(row, col); }),
        breakSignature: makeBreakSignature("yahtzee-fix", rowData.mode, rowData.answers.map(function (col) { return positionToIndex(row, col); }).join("."), rowData.label)
      });
    });

    var selected = selectCandidate(shuffle(candidates, random), avoidBreakSignatures || []);
    return {
      answerMode: ANSWER_MODES.multiSelect,
      board: selected.board,
      expected: selected.expected,
      answerIndex: selected.answerIndices[0],
      answerIndices: selected.answerIndices,
      minSelections: 2,
      maxSelections: 2,
      submitLabel: "Submit Move",
      explanation: "Those two dice are the only dice that must change to satisfy the row category.",
      wrongTapHint: "Select exactly two dice in the broken row before committing.",
      breakSignature: selected.breakSignature,
      breakMode: selected.breakMode,
      evidence: "The selected dice are the only mismatches between the roll and its category recipe.",
      relatedIndexes: selected.answerIndices
    };
  }

  function generateMazeExit(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle(["identity", "rotate90", "rotate180", "mirrorH", "mirrorV"].map(function (transform) {
      var open = [0, 1, 2, 7, 12, 13, 18, 23, 24];
      var exits = [
        { index: 4, label: "A" },
        { index: 10, label: "B" },
        { index: 24, label: "C" }
      ];
      var board = mazeBoard(open.map(function (index) { return transformIndex(index, transform); }), transformIndex(0, transform), exits.map(function (exit) {
        return { index: transformIndex(exit.index, transform), label: exit.label };
      }));
      var answerIndex = transformIndex(24, transform);
      return {
        mode: "reachable-exit-" + transform,
        board: board,
        answerIndex: answerIndex,
        breakSignature: makeBreakSignature("maze-exit", "reachable-exit-" + transform, answerIndex, "exit")
      };
    }), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);

    return {
      answerMode: ANSWER_MODES.chooseOne,
      board: selected.board,
      answerIndex: selected.answerIndex,
      answerIndices: [selected.answerIndex],
      explanation: "That is the only exit connected to S by open orthogonal paths.",
      wrongTapHint: "Trace from S through open dots. Walls block the route.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "A flood fill from S reaches only the selected exit.",
      relatedIndexes: reachableMazeIndexes(selected.board)
    };
  }

  function generateMazeKeyExit(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle(["identity", "mirrorH", "rotate180", "rotate90", "mirrorV", "transpose"].map(function (transform) {
      var board = mazeBoard([0, 1, 2, 7, 12, 13, 18, 23, 24].map(function (index) { return transformIndex(index, transform); }), transformIndex(0, transform), []);
      var keyIndex = transformIndex(7, transform);
      var exitIndex = transformIndex(24, transform);
      var badKey = transformIndex(20, transform);
      var badExit = transformIndex(4, transform);
      board[keyIndex] = mazeToken(keyIndex, "K1", "key", "reachable key K1", { selectionRole: "key", tokenId: "K1" });
      board[badKey] = mazeToken(badKey, "K2", "key", "unreachable key K2", { selectionRole: "key", tokenId: "K2" });
      board[exitIndex] = mazeToken(exitIndex, "A", "exit", "exit A opened by key K1", { selectionRole: "exit", tokenId: "A" });
      board[badExit] = mazeToken(badExit, "B", "exit", "exit B opened by key K2", { selectionRole: "exit", tokenId: "B" });
      return {
        mode: "key-exit-" + transform,
        board: board,
        answerSteps: [
          { role: "key", index: keyIndex, tokenId: "K1", label: "Reachable key" },
          { role: "exit", index: exitIndex, tokenId: "A", label: "Opened exit" }
        ],
        breakSignature: makeBreakSignature("maze-key-exit", "key-exit-" + transform, keyIndex + "." + exitIndex, "K1-A")
      };
    }), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);

    return {
      answerMode: ANSWER_MODES.twoStep,
      board: selected.board,
      answerSteps: selected.answerSteps,
      answerIndices: selected.answerSteps.map(function (step) { return step.index; }),
      answerIndex: selected.answerSteps[0].index,
      submitLabel: "Submit Move",
      explanation: "That key is reachable, and it opens the only reachable exit.",
      wrongTapHint: "Choose one reachable key and the exit that key opens.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "Only the K1 to A route is reachable from S.",
      relatedIndexes: selected.answerSteps.map(function (step) { return step.index; })
    };
  }

  function generateScrabbleCross(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle(["cat-sun", "dog-key", "bear-road", "fish-bone", "king-queen"].map(function (mode, scenarioIndex) {
      var board = emptyBoard();
      var squareIndex = [12, 7, 13, 6, 8][scenarioIndex];
      var tileIndex = [22, 23, 24, 21, 20][scenarioIndex];
      var tile = ["A", "O", "E", "R", "N"][scenarioIndex];
      var rack = ["A", "O", "E", "R", "N"];
      [2, 10, 14, 17].forEach(function (index) {
        board[index] = letterCell(index, ["C", "S", "T", "N"][index % 4], "fixed letter");
      });
      board[squareIndex] = letterCell(squareIndex, "□", "empty crossing square", { crossword: "blank", selectionRole: "board-square", tokenId: "square" });
      rack.forEach(function (letter, offset) {
        var index = 20 + offset;
        board[index] = letterCell(index, letter, "rack tile " + letter, { crossword: "rack", selectionRole: "rack-tile", tokenId: letter });
        board[index].classNames.push("rack-tile");
      });
      return {
        mode: mode,
        board: board,
        answerSteps: [
          { role: "board-square", index: squareIndex, tokenId: "square", label: "Crossing square" },
          { role: "rack-tile", index: tileIndex, tokenId: tile, label: "Rack tile " + tile }
        ],
        validWords: [["CAT", "SUN"], ["DOG", "KEY"], ["BEAR", "ROAD"], ["FISH", "BONE"], ["KING", "QUEEN"]][scenarioIndex],
        breakSignature: makeBreakSignature("scrabble-cross", mode, squareIndex + "." + tileIndex, tile)
      };
    }), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);

    return {
      answerMode: ANSWER_MODES.twoStep,
      board: selected.board,
      answerSteps: selected.answerSteps,
      answerIndices: selected.answerSteps.map(function (step) { return step.index; }),
      answerIndex: selected.answerSteps[0].index,
      submitLabel: "Submit Move",
      explanation: "That square and rack tile make the crossing words valid.",
      wrongTapHint: "Choose one empty square and one rack letter.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "The curated crossing words are " + selected.validWords.join(" and ") + "; only the selected tile/square pair works.",
      relatedIndexes: selected.answerSteps.map(function (step) { return step.index; }),
      candidatePairs: [{ indices: selected.answerSteps.map(function (step) { return step.index; }), valid: true }]
    };
  }

  function generateMiniCrosswordFill(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle([
      { mode: "cat-sun-a", blank: 6, tile: 21, letter: "A", fixed: [[5, "C"], [7, "T"], [1, "S"], [11, "N"]], words: ["CAT", "SUN"] },
      { mode: "dog-owl-o", blank: 12, tile: 22, letter: "O", fixed: [[11, "D"], [13, "G"], [2, "O"], [17, "L"]], words: ["DOG", "OWL"] },
      { mode: "key-tree-e", blank: 8, tile: 23, letter: "E", fixed: [[7, "K"], [9, "Y"], [3, "T"], [13, "R"]], words: ["KEY", "TREE"] },
      { mode: "fox-road-o", blank: 16, tile: 20, letter: "O", fixed: [[15, "F"], [17, "X"], [11, "R"], [21, "A"]], words: ["FOX", "ROAD"] },
      { mode: "bee-hive-e", blank: 18, tile: 23, letter: "E", fixed: [[17, "B"], [19, "E"], [13, "H"], [23, "E"]], words: ["BEE", "HIVE"] }
    ].map(function (scenario) {
      var board = crosswordBaseBoard();
      scenario.fixed.forEach(function (item) {
        board[item[0]] = letterCell(item[0], item[1], "fixed crossword letter " + item[1], { crossword: "fixed" });
        board[item[0]].selectable = false;
      });
      board[scenario.blank] = letterCell(scenario.blank, "□", "empty crossword square", { crossword: "blank", selectionRole: "board-square", tokenId: "blank" });
      ["A", "O", "E", "R", "N"].forEach(function (letter, offset) {
        var index = 20 + offset;
        board[index] = letterCell(index, letter, "rack tile " + letter, { crossword: "rack", selectionRole: "rack-tile", tokenId: letter });
        board[index].classNames.push("rack-tile");
      });
      return {
        mode: scenario.mode,
        board: board,
        answerSteps: [
          { role: "board-square", index: scenario.blank, tokenId: "blank", label: "Crossword blank" },
          { role: "rack-tile", index: scenario.tile, tokenId: scenario.letter, label: "Rack tile " + scenario.letter }
        ],
        solutionCount: 1,
        validWords: scenario.words,
        breakSignature: makeBreakSignature("mini-crossword-fill", scenario.mode, scenario.blank + "." + scenario.tile, scenario.letter)
      };
    }), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);

    return {
      answerMode: ANSWER_MODES.twoStep,
      board: selected.board,
      answerSteps: selected.answerSteps,
      answerIndices: selected.answerSteps.map(function (step) { return step.index; }),
      answerIndex: selected.answerSteps[0].index,
      submitLabel: "Submit Move",
      explanation: "That square and rack letter complete both crossing words.",
      wrongTapHint: "Pick one blank square and one rack tile; both crossings must become common words.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "Only one square-letter pair makes " + selected.validWords.join(" and ") + ".",
      relatedIndexes: selected.answerSteps.map(function (step) { return step.index; }),
      wordSolutions: [{ steps: selected.answerSteps, validWords: selected.validWords }]
    };
  }

  function generateCrosswordPair(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle([
      { mode: "word-play", blanks: [6, 13], tiles: [20, 23], letters: ["O", "A"], fixed: [[5, "W"], [7, "R"], [8, "D"], [12, "L"], [14, "Y"]], words: ["WORD", "PLAY"] },
      { mode: "game-bird", blanks: [7, 17], tiles: [21, 24], letters: ["A", "R"], fixed: [[5, "G"], [6, "M"], [8, "E"], [12, "B"], [22, "D"]], words: ["GAME", "BIRD"] },
      { mode: "lock-key", blanks: [11, 18], tiles: [20, 22], letters: ["O", "E"], fixed: [[10, "L"], [12, "C"], [13, "K"], [8, "K"], [23, "Y"]], words: ["LOCK", "KEY"] },
      { mode: "bear-tree", blanks: [6, 16], tiles: [20, 23], letters: ["E", "R"], fixed: [[5, "B"], [7, "A"], [8, "R"], [11, "T"], [21, "E"]], words: ["BEAR", "TREE"] },
      { mode: "sun-moon", blanks: [8, 18], tiles: [22, 24], letters: ["N", "O"], fixed: [[6, "S"], [7, "U"], [13, "M"], [23, "O"]], words: ["SUN", "MOON"] }
    ].map(function (scenario) {
      var board = crosswordBaseBoard();
      scenario.fixed.forEach(function (item) {
        board[item[0]] = letterCell(item[0], item[1], "fixed crossword letter " + item[1], { crossword: "fixed" });
        board[item[0]].selectable = false;
      });
      scenario.blanks.forEach(function (index) {
        board[index] = letterCell(index, "□", "empty crossword square", { crossword: "blank" });
      });
      ["O", "A", "E", "R", "N"].forEach(function (letter, offset) {
        var index = 20 + offset;
        board[index] = letterCell(index, letter, "rack tile " + letter, { crossword: "rack" });
        board[index].classNames.push("rack-tile");
      });
      return {
        mode: scenario.mode,
        board: board,
        answerIndices: uniqueSorted(scenario.blanks.concat(scenario.tiles)),
        solutionCount: 1,
        validWords: scenario.words,
        breakSignature: makeBreakSignature("crossword-pair", scenario.mode, uniqueSorted(scenario.blanks.concat(scenario.tiles)).join("."), scenario.letters.join(""))
      };
    }), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);

    return {
      answerMode: ANSWER_MODES.multiSelect,
      board: selected.board,
      answerIndices: selected.answerIndices,
      answerIndex: selected.answerIndices[0],
      minSelections: 4,
      maxSelections: 4,
      submitLabel: "Submit Move",
      explanation: "Those two blanks and two rack letters are the only complete crossword repair.",
      wrongTapHint: "Select exactly two blank squares and exactly two rack letters.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "Only this four-part set makes " + selected.validWords.join(" and ") + ".",
      relatedIndexes: selected.answerIndices,
      wordSolutions: [{ indices: selected.answerIndices, validWords: selected.validWords }]
    };
  }

  function generateCircuitSwitchPair(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle([
      { mode: "xor-and", switches: [0, 1, 5, 6], answer: [1, 5], labels: ["0", "1", "1", "0"] },
      { mode: "and-or", switches: [3, 4, 8, 9], answer: [3, 9], labels: ["0", "1", "0", "1"] },
      { mode: "nand-xor", switches: [10, 11, 15, 16], answer: [10, 16], labels: ["1", "1", "0", "0"] },
      { mode: "or-xor", switches: [2, 7, 17, 22], answer: [2, 22], labels: ["0", "0", "1", "1"] },
      { mode: "cross-feed", switches: [4, 9, 19, 24], answer: [9, 19], labels: ["1", "0", "0", "1"] }
    ].map(function (scenario) {
      var board = emptyBoard();
      scenario.switches.forEach(function (index, offset) {
        board[index] = glyphCell(index, scenario.labels[offset], "switch", "switch " + (offset + 1) + " value " + scenario.labels[offset], ["token-switch"], { circuit: "switch", switchId: offset + 1 });
      });
      board[12] = glyphCell(12, "XOR", "logic", "xor gate", ["token-logic"], { circuit: "gate", gate: "XOR" });
      board[13] = glyphCell(13, "AND", "logic", "and gate", ["token-logic"], { circuit: "gate", gate: "AND" });
      board[14] = glyphCell(14, "OFF", "target", "target light off", ["token-target"], { circuit: "light", on: false });
      [12, 13, 14].forEach(function (index) {
        board[index].selectable = false;
      });
      return {
        mode: scenario.mode,
        board: board,
        answerIndices: scenario.answer,
        solutionCount: 1,
        breakSignature: makeBreakSignature("circuit-switch-pair", scenario.mode, scenario.answer.join("."), "light-on")
      };
    }), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);

    return {
      answerMode: ANSWER_MODES.multiSelect,
      board: selected.board,
      answerIndices: selected.answerIndices,
      answerIndex: selected.answerIndices[0],
      minSelections: 2,
      maxSelections: 2,
      submitLabel: "Submit Move",
      explanation: "Flipping exactly those two switches turns the target light on.",
      wrongTapHint: "Choose exactly two switch cells; gates and the light are not switches.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "The circuit template has exactly one two-switch solution.",
      relatedIndexes: selected.answerIndices,
      circuitSolutions: [selected.answerIndices]
    };
  }

  function generateMazeBridgeRepair(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle(["identity", "mirrorH", "rotate180", "mirrorV", "rotate90"].map(function (transform) {
      var open = [0, 1, 3, 4, 9, 14, 19, 24].map(function (index) { return transformIndex(index, transform); });
      var repairs = [2, 7].map(function (index) { return transformIndex(index, transform); });
      var board = mazeBoard(open, transformIndex(0, transform), [{ index: transformIndex(24, transform), label: "F" }]);
      repairs.forEach(function (index) {
        board[index] = mazeToken(index, "×", "bridge", "broken bridge repair candidate", { maze: "bridge" });
      });
      [6, 11, 16].map(function (index) { return transformIndex(index, transform); }).forEach(function (index) {
        board[index] = mazeToken(index, "×", "bridge", "broken bridge decoy", { maze: "bridge" });
      });
      return {
        mode: "bridge-pair-" + transform,
        board: board,
        answerIndices: uniqueSorted(repairs),
        breakSignature: makeBreakSignature("maze-bridge-repair", "bridge-pair-" + transform, uniqueSorted(repairs).join("."), "route")
      };
    }), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);

    return {
      answerMode: ANSWER_MODES.multiSelect,
      board: selected.board,
      answerIndices: selected.answerIndices,
      answerIndex: selected.answerIndices[0],
      minSelections: 2,
      maxSelections: 2,
      submitLabel: "Submit Move",
      explanation: "Repairing those two bridges is the only way to connect S to F.",
      wrongTapHint: "Select exactly the two broken bridges that complete the route.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "Only the selected bridge pair makes the maze route reachable.",
      relatedIndexes: selected.answerIndices
    };
  }

  function generateTetrisFit(seed, roundNumber, sessionAttempt, avoidBreakSignatures) {
    var random = createRandom(seed);
    var scenarios = shuffle([
      { mode: "t-piece-line", filled: [0, 1, 3, 4, 5, 9, 10, 14, 20, 21, 22, 23, 24], answer: [11, 12, 13, 17], piece: "T" },
      { mode: "o-piece-corner", filled: [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21], answer: [16, 17, 22, 23], piece: "O" },
      { mode: "i-piece-column", filled: [0, 1, 2, 3, 4, 5, 7, 9, 10, 12, 14, 20, 22, 24], answer: [6, 11, 16, 21], piece: "I" },
      { mode: "l-piece-notch", filled: [0, 1, 2, 3, 4, 5, 6, 10, 15, 20, 21, 22], answer: [11, 16, 17, 18], piece: "L" },
      { mode: "s-piece-shelf", filled: [0, 1, 2, 5, 6, 10, 14, 15, 19, 20, 21, 22, 23, 24], answer: [7, 8, 11, 12], piece: "S" }
    ].map(function (scenario) {
      var board = emptyBoard();
      scenario.filled.forEach(function (index) {
        board[index] = glyphCell(index, "■", "tetris", "filled tetris block", ["token-tetris"], "filled");
        board[index].selectable = false;
      });
      scenario.answer.forEach(function (index) {
        board[index] = glyphCell(index, "·", "tetris", "empty landing cell", ["token-tetris", "tetris-empty"], "empty");
      });
      return {
        mode: scenario.mode,
        board: board,
        answerIndices: scenario.answer,
        breakSignature: makeBreakSignature("tetris-fit", scenario.mode, scenario.answer.join("."), scenario.piece),
        piece: scenario.piece
      };
    }), random);
    var selected = selectCandidate(scenarios, avoidBreakSignatures || []);

    return {
      answerMode: ANSWER_MODES.multiSelect,
      board: selected.board,
      answerIndices: selected.answerIndices,
      answerIndex: selected.answerIndices[0],
      minSelections: 4,
      maxSelections: 4,
      submitLabel: "Submit Move",
      explanation: "Those four cells are the only " + selected.piece + " placement that completes the target structure.",
      wrongTapHint: "Select exactly four connected landing cells.",
      breakSignature: selected.breakSignature,
      breakMode: selected.mode,
      evidence: "Only the selected " + selected.piece + " tetromino cells complete the board.",
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
    return makeExpectedRound("animal-food-web", commonConfig(random, expectedBoard, candidates, avoidBreakSignatures, function (selected) {
      return labelForCell(selected.wrong) + " does not belong in this simple food chain.";
    }, "Use the taught chain: Plant feeds insect; frog eats insect; snake eats frog; hawk hunts snake.", function (selected) {
      return labelForCell(selected.wrong) + " is the only animal or plant outside the taught food-chain order.";
    }));
  }

  function exactSetRound(answerMode, board, expected, answerIndices, explanation, wrongTapHint, breakSignature, breakMode, evidence, evidenceDetail, count) {
    return {
      answerMode: answerMode,
      board: board,
      expected: expected,
      answerIndex: answerIndices[0],
      answerIndices: uniqueSorted(answerIndices),
      minSelections: count || answerIndices.length,
      maxSelections: count || answerIndices.length,
      submitLabel: "Submit Move",
      explanation: explanation,
      wrongTapHint: wrongTapHint,
      breakSignature: breakSignature,
      breakMode: breakMode,
      evidence: evidenceDetail || evidence,
      relatedIndexes: uniqueSorted(answerIndices)
    };
  }

  function buildThemeSwapCandidate(typeId, packAId, packBId, aOffset, bOffset) {
    var packA = themePackById(packAId);
    var packB = themePackById(packBId);
    var packs = [packA, packB].concat(themePackSubset(["weather", "musical-instruments", "sports-balls", "forest-animals", "kitchen-tools"]).filter(function (pack) {
      return pack.id !== packA.id && pack.id !== packB.id;
    })).slice(0, GRID_SIZE);
    var expected = [];
    var board;
    var aIndex = positionToIndex(0, aOffset);
    var bIndex = positionToIndex(1, bOffset);

    packs.forEach(function (pack, row) {
      pack.items.slice(0, GRID_SIZE).forEach(function (symbol, col) {
        expected[positionToIndex(row, col)] = objectCell(positionToIndex(row, col), symbol, pack, "object");
      });
    });
    board = cloneBoard(expected);
    board[aIndex] = objectCell(aIndex, packB.items[bOffset], packA, "object");
    board[aIndex].expectedGlyph = expected[aIndex].glyph;
    board[aIndex].expectedValue = expected[aIndex].value;
    board[bIndex] = objectCell(bIndex, packA.items[aOffset], packB, "object");
    board[bIndex].expectedGlyph = expected[bIndex].glyph;
    board[bIndex].expectedValue = expected[bIndex].value;

    return {
      mode: packA.id + "-swap-" + packB.id,
      board: board,
      expected: expected,
      answerIndices: uniqueSorted([aIndex, bIndex]),
      evidence: labelForCell(board[aIndex]) + " belongs with " + packB.name + "; " + labelForCell(board[bIndex]) + " belongs with " + packA.name + ".",
      breakSignature: makeBreakSignature(typeId, packA.id + "-swap-" + packB.id, uniqueSorted([aIndex, bIndex]).join("."), board[aIndex].glyph + board[bIndex].glyph)
    };
  }

  function buildRecipeSwapCandidate(dishAId, dishBId, aIngredientOffset, bIngredientOffset) {
    var dishes = dishRows();
    var dishA = dishes.filter(function (dish) { return dish.id === dishAId; })[0];
    var dishB = dishes.filter(function (dish) { return dish.id === dishBId; })[0];
    var rows = [dishA, dishB].concat(dishes.filter(function (dish) {
      return dish.id !== dishA.id && dish.id !== dishB.id;
    })).slice(0, GRID_SIZE);
    var expected = [];
    var board;
    var aIndex = positionToIndex(0, aIngredientOffset);
    var bIndex = positionToIndex(1, bIngredientOffset);

    rows.forEach(function (dish, row) {
      expected[positionToIndex(row, 0)] = objectCell(positionToIndex(row, 0), SYMBOL_BY_ID(dish.dish), { id: dish.id, name: dish.name }, "dish");
      dish.ingredients.slice(0, 4).forEach(function (symbolId, offset) {
        expected[positionToIndex(row, offset + 1)] = objectCell(positionToIndex(row, offset + 1), SYMBOL_BY_ID(symbolId), { id: dish.id, name: dish.name }, "ingredient");
      });
    });
    board = cloneBoard(expected);
    board[aIndex] = objectCell(aIndex, SYMBOL_BY_ID(dishB.ingredients[bIngredientOffset - 1]), { id: dishA.id, name: dishA.name }, "ingredient");
    board[aIndex].expectedGlyph = expected[aIndex].glyph;
    board[aIndex].expectedValue = expected[aIndex].value;
    board[bIndex] = objectCell(bIndex, SYMBOL_BY_ID(dishA.ingredients[aIngredientOffset - 1]), { id: dishB.id, name: dishB.name }, "ingredient");
    board[bIndex].expectedGlyph = expected[bIndex].glyph;
    board[bIndex].expectedValue = expected[bIndex].value;

    return {
      mode: dishA.id + "-swap-" + dishB.id,
      board: board,
      expected: expected,
      answerIndices: uniqueSorted([aIndex, bIndex]),
      evidence: labelForCell(board[aIndex]) + " belongs with " + dishB.name + "; " + labelForCell(board[bIndex]) + " belongs with " + dishA.name + ".",
      breakSignature: makeBreakSignature("recipe-swap", dishA.id + "-swap-" + dishB.id, uniqueSorted([aIndex, bIndex]).join("."), board[aIndex].glyph + board[bIndex].glyph)
    };
  }

  function buildObjectRackCandidate(packId, blankCol, distractorIds) {
    var pack = themePackById(packId);
    var supportPacks = themePackSubset(["salad-ingredients", "forest-animals", "musical-instruments", "weather", "sports-balls"]).filter(function (item) {
      return item.id !== pack.id;
    });
    var board = emptyBoard();
    var blankIndex = positionToIndex(0, blankCol);
    var answerSymbol = pack.items[blankCol];
    var rackIds = [answerSymbol.id].concat(distractorIds).slice(0, GRID_SIZE);
    var rackIndex = positionToIndex(4, 0);

    pack.items.slice(0, GRID_SIZE).forEach(function (symbol, col) {
      board[positionToIndex(0, col)] = objectCell(positionToIndex(0, col), symbol, pack, "object");
      board[positionToIndex(0, col)].selectable = false;
    });
    board[blankIndex] = glyphCell(blankIndex, "□", "object blank", "blank category square", ["token-object", "object-blank"], { selectionRole: "board-square", themeId: pack.id, tokenId: "blank" }, "", "blank");

    supportPacks.slice(0, 3).forEach(function (rowPack, offset) {
      rowPack.items.slice(0, GRID_SIZE).forEach(function (symbol, col) {
        var index = positionToIndex(offset + 1, col);
        board[index] = objectCell(index, symbol, rowPack, "object");
        board[index].selectable = false;
      });
    });
    rackIds.forEach(function (symbolId, offset) {
      var index = positionToIndex(4, offset);
      var symbol = SYMBOL_BY_ID(symbolId);
      board[index] = objectCell(index, symbol, pack, "rack-object");
      board[index].value = Object.assign({}, board[index].value, { selectionRole: "rack-object", tokenId: symbol.id, rack: true });
      board[index].classNames.push("rack-tile");
      if (symbol.id === answerSymbol.id) {
        rackIndex = index;
      }
    });
    return {
      mode: "rack-complete-" + pack.id + "-" + blankCol,
      pack: pack,
      board: board,
      blankIndex: blankIndex,
      rackIndex: rackIndex,
      answerSymbol: answerSymbol,
      answerIndices: uniqueSorted([blankIndex, rackIndex]),
      breakSignature: makeBreakSignature("object-rack-complete", "rack-complete-" + pack.id, uniqueSorted([blankIndex, rackIndex]).join("."), answerSymbol.id)
    };
  }

  function dishRows() {
    return [
      { id: "taco", name: "Taco", dish: "taco", ingredients: ["corn", "meat", "lettuce", "cheese"], imposters: ["sushi", "wrench"] },
      { id: "pizza", name: "Pizza", dish: "pizza", ingredients: ["bread", "tomato", "cheese", "mushroom"], imposters: ["basketball", "banana"] },
      { id: "salad", name: "Salad", dish: "salad", ingredients: ["lettuce", "tomato", "cucumber", "carrot"], imposters: ["hammer", "sushi"] },
      { id: "sushi", name: "Sushi", dish: "sushi", ingredients: ["rice", "food-fish", "cucumber", "lemon"], imposters: ["football", "cheese"] },
      { id: "burger", name: "Burger", dish: "burger", ingredients: ["bread", "meat", "cheese", "lettuce"], imposters: ["flute", "rocket"] },
      { id: "breakfast", name: "Breakfast", dish: "egg", ingredients: ["bread", "egg", "banana", "coffee"], imposters: ["screwdriver", "snake"] }
    ];
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

  function objectCell(index, symbol, pack, role) {
    var label = symbol.label || symbol.ariaLabel || symbol.id;
    return glyphCell(index, symbol.glyph, "object " + (role || "symbol"), label, ["token-object", "symbol-token", "symbol-token--emoji"], {
      symbolId: symbol.id,
      label: label,
      themeId: pack && pack.id,
      themeName: pack && pack.name,
      role: role || "object"
    }, "", symbol.shortLabel || label);
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

  function mazeBoard(openIndexes, startIndex, exits) {
    var board = emptyBoard();
    var openSet = {};

    openIndexes.forEach(function (index) {
      openSet[index] = true;
    });
    forEachIndex(function (index) {
      board[index] = openSet[index] ? mazeToken(index, "·", "path", "open maze path", { maze: "path" }) : mazeToken(index, "■", "wall", "maze wall", { maze: "wall" });
      board[index].selectable = false;
    });
    board[startIndex] = mazeToken(startIndex, "S", "start", "maze start", { maze: "start" });
    board[startIndex].selectable = false;
    exits.forEach(function (exit) {
      board[exit.index] = mazeToken(exit.index, exit.label, "exit", "maze exit " + exit.label, { maze: "exit", selectionRole: "exit", tokenId: exit.label });
    });
    return board;
  }

  function crosswordBaseBoard() {
    var board = emptyBoard();

    forEachIndex(function (index) {
      board[index] = glyphCell(index, "■", "letter block", "crossword block", ["token-letter", "crossword-block"], { crossword: "block" });
      board[index].selectable = false;
    });
    return board;
  }

  function mazeToken(index, glyph, kind, ariaLabel, value) {
    return glyphCell(index, glyph, "maze " + kind, ariaLabel, ["token-maze", "maze-" + kind], Object.assign({ maze: kind }, value || {}), "", kind === "key" || kind === "exit" ? kind.toUpperCase() : "");
  }

  function letterCell(index, glyph, ariaLabel, value) {
    return glyphCell(index, glyph, "letter", ariaLabel || "letter " + glyph, ["token-letter"], Object.assign({ letter: glyph }, value || {}));
  }

  function token(index, symbol, kind, classes) {
    return glyphCell(index, symbol.glyph, kind, symbol.ariaLabel || symbol.label, classes || [], { symbolId: symbol.id, label: symbol.label || symbol.ariaLabel || symbol.id }, symbol.cornerLabel || "", symbol.shortLabel || "");
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
    if (answerMode === ANSWER_MODES.twoStep) {
      return validateTwoStep;
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

  function validateRowTarget(round) {
    var mismatches = getMismatches(round);
    var answerRow = round.targeting && typeof round.targeting.answerRow === "number" ? round.targeting.answerRow : Math.floor(round.answerIndex / GRID_SIZE);
    var answers = rowIndices(answerRow);

    return {
      valid: mismatches.length === 1 && Math.floor(mismatches[0] / GRID_SIZE) === answerRow && boardIsUsable(round),
      mismatches: mismatches,
      answers: answers
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

  function validateTwoStep(round) {
    var answers = (round.answerSteps || []).map(function (step) {
      return step.index;
    }).filter(function (index) {
      return typeof index === "number";
    });

    return {
      valid: answers.length === (round.answerSteps || []).length && answers.length >= 2 && boardIsUsable(round),
      mismatches: answers,
      answers: answers
    };
  }

  function validateWordTwoStep(round) {
    var result = validateTwoStep(round);
    var rackTiles = round.board.filter(function (cell) {
      return cell.value && cell.value.crossword === "rack";
    });
    return {
      valid: result.valid && round.wordSolutions && round.wordSolutions.length === 1 && rackTiles.length >= 4,
      mismatches: result.mismatches,
      answers: result.answers
    };
  }

  function validateExactMismatchSet(round) {
    var mismatches = getMismatches(round);
    var expected = uniqueSorted(round.answerIndices || []);

    return {
      valid: sameSet(mismatches, expected) && expected.length === 2 && boardIsUsable(round),
      mismatches: mismatches,
      answers: sameSet(mismatches, expected) ? expected : []
    };
  }

  function validateExactAnswerSet(round) {
    var expected = uniqueSorted(round.answerIndices || []);

    return {
      valid: expected.length > 0 && boardIsUsable(round),
      mismatches: expected,
      answers: expected
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
      valid: answer === round.answerIndex && numbered.length >= 8 && boardIsUsable(round) && numbered.every(function (cell) {
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

  function validateMazeExit(round) {
    var reachable = reachableMazeIndexes(round.board);
    var answers = round.board.filter(function (cell) {
      return cell.value && cell.value.maze === "exit" && reachable.indexOf(cell.index) !== -1;
    }).map(function (cell) {
      return cell.index;
    });

    return {
      valid: answers.length === 1 && answers[0] === round.answerIndex && boardIsUsable(round),
      mismatches: answers,
      answers: answers
    };
  }

  function validateCircuitSwitchPair(round) {
    return {
      valid: Array.isArray(round.circuitSolutions) && round.circuitSolutions.length === 1 && sameSet(round.circuitSolutions[0], round.answerIndices || []) && boardIsUsable(round),
      mismatches: round.answerIndices || [],
      answers: round.answerIndices || []
    };
  }

  function validateMazeBridgeRepair(round) {
    var repairedReachable = mazeReachableWithRepairs(round.board, round.answerIndices || []);
    var exit = round.board.filter(function (cell) {
      return cell.value && cell.value.maze === "exit";
    })[0];

    return {
      valid: Boolean(exit) && repairedReachable.indexOf(exit.index) !== -1 && (round.answerIndices || []).length === 2 && boardIsUsable(round),
      mismatches: round.answerIndices || [],
      answers: round.answerIndices || []
    };
  }

  function validateObjectSwap(round) {
    var expected = uniqueSorted(round.answerIndices || []);
    var mismatches = getMismatches(round);

    return {
      valid: expected.length === 2 && sameSet(mismatches, expected) && boardIsUsable(round),
      mismatches: mismatches,
      answers: expected
    };
  }

  function validateObjectRackComplete(round) {
    var result = validateTwoStep(round);
    var steps = round.answerSteps || [];
    var hasBlankStep = steps.some(function (step) {
      return step.role === "board-square";
    });
    var hasRackStep = steps.some(function (step) {
      return step.role === "rack-object";
    });

    return {
      valid: result.valid && hasBlankStep && hasRackStep && round.objectRackSolutionCount === 1 && boardIsUsable(round),
      mismatches: result.mismatches,
      answers: result.answers
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

  function reachableMazeIndexes(board) {
    var start = board.filter(function (cell) {
      return cell.value && cell.value.maze === "start";
    })[0];
    var queue = start ? [start.index] : [];
    var seen = {};
    var reachable = [];

    if (start) {
      seen[start.index] = true;
    }
    while (queue.length) {
      var index = queue.shift();
      reachable.push(index);
      neighbors(index).forEach(function (neighborIndex) {
        var neighbor = board[neighborIndex];
        if (!seen[neighborIndex] && neighbor.value && neighbor.value.maze !== "wall" && neighbor.value.maze !== "bridge") {
          seen[neighborIndex] = true;
          queue.push(neighborIndex);
        }
      });
    }
    return uniqueSorted(reachable);
  }

  function mazeReachableWithRepairs(board, repairs) {
    var repairSet = {};

    repairs.forEach(function (index) {
      repairSet[index] = true;
    });
    return reachableMazeIndexes(board.map(function (cell) {
      if (cell.value && cell.value.maze === "bridge" && repairSet[cell.index]) {
        var clone = hydrateCell(cell.index, cell);
        clone.value = Object.assign({}, clone.value, { maze: "path" });
        return clone;
      }
      return cell;
    }));
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

  function pairSymbols(leftId, rightId) {
    var left = SYMBOL_BY_ID(leftId);
    var right = SYMBOL_BY_ID(rightId);

    return {
      a: left.glyph,
      b: right.glyph,
      aLabel: left.label || left.ariaLabel || left.id,
      bLabel: right.label || right.ariaLabel || right.id,
      aSymbol: left,
      bSymbol: right
    };
  }

  function flattenPairSymbols(pairs) {
    var items = [];

    pairs.forEach(function (pair) {
      items.push(pair.aSymbol, pair.bSymbol);
    });
    return items;
  }

  function objectPuzzleSymbols() {
    return uniqueSymbols(themePackSubset([
      "kitchen-tools",
      "workshop-tools",
      "forest-animals",
      "musical-instruments",
      "weather",
      "sports-balls"
    ]).reduce(function (items, pack) {
      return items.concat(pack.items.slice(0, 3));
    }, [])).slice(0, 12);
  }

  function dishPuzzleSymbols() {
    var ids = [];

    dishRows().forEach(function (dish) {
      ids.push(dish.dish);
      ids = ids.concat(dish.ingredients.slice(0, 2));
    });
    return uniqueSymbols(ids.map(SYMBOL_BY_ID)).slice(0, 12);
  }

  function themePackById(id) {
    return THEME_PACKS.filter(function (pack) {
      return pack.id === id;
    })[0] || THEME_PACKS[0];
  }

  function themePackSubset(ids) {
    return ids.map(themePackById).filter(Boolean);
  }

  function uniqueSymbols(symbols) {
    var seen = {};
    return symbols.filter(function (symbol) {
      if (!symbol || seen[symbol.id]) {
        return false;
      }
      seen[symbol.id] = true;
      return true;
    });
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

  function symbolChipData(symbol) {
    if (typeof symbol === "string") {
      return {
        glyph: symbol,
        label: symbol,
        ariaLabel: symbol,
        displayKind: "text"
      };
    }
    return {
      id: symbol.id,
      glyph: symbol.glyph,
      label: symbol.label || symbol.ariaLabel || symbol.glyph,
      shortLabel: symbol.shortLabel || symbol.label || symbol.glyph,
      ariaLabel: symbol.ariaLabel || symbol.label || symbol.glyph,
      displayKind: symbol.displayKind || "text",
      category: symbol.category,
      theme: symbol.theme
    };
  }

  function labelForCell(cell) {
    if (!cell) {
      return "that object";
    }
    if (cell.value && cell.value.label) {
      return cell.value.label;
    }
    return cell.ariaLabel || cell.label || cell.glyph || "that object";
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

  function rowIndices(row) {
    return Array.from({ length: GRID_SIZE }, function (_, col) {
      return positionToIndex(row, col);
    });
  }

  function columnIndices(col) {
    return Array.from({ length: GRID_SIZE }, function (_, row) {
      return positionToIndex(row, col);
    });
  }

  function range(count) {
    return Array.from({ length: count }, function (_, index) {
      return index;
    });
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
    TARGET_TYPES: TARGET_TYPES,
    puzzleTypes: puzzleTypes,
    normalizeTypeRound: normalizeRound,
    generateDailyPuzzle: generateDailyPuzzle,
    generateSurvivalLevels: generateSurvivalLevels,
    generateFreePlaySet: generateFreePlaySet,
    validatePuzzle: validatePuzzle,
    validateRound: validateRound,
    validateExpectedMismatch: validateExpectedMismatch,
    validateRowTarget: validateRowTarget,
    validateChooseOne: validateChooseOne,
    validateMultiSelect: validateMultiSelect,
    validateTwoStep: validateTwoStep,
    validateWordTwoStep: validateWordTwoStep,
    validateExactMismatchSet: validateExactMismatchSet,
    validateExactAnswerSet: validateExactAnswerSet,
    validateMazeExit: validateMazeExit,
    validateCircuitSwitchPair: validateCircuitSwitchPair,
    validateMazeBridgeRepair: validateMazeBridgeRepair,
    validateObjectSwap: validateObjectSwap,
    validateObjectRackComplete: validateObjectRackComplete,
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
