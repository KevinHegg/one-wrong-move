(function (root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.OWM_SYMBOLS = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function makeSymbol(id, glyph, label, category, tags, fallback, extra) {
    var details = extra || {};
    var symbol = {
      id: id,
      glyph: glyph,
      emoji: details.emoji || glyph,
      label: label,
      shortLabel: details.shortLabel || label,
      ariaLabel: details.ariaLabel || label,
      category: category,
      theme: details.theme || category,
      tags: tags || [],
      displayKind: details.displayKind || inferDisplayKind(glyph, category),
      fallback: fallback || label,
      difficulty: details.difficulty || 1,
      sourceNote: details.sourceNote || "Curated local symbol"
    };

    Object.keys(details).forEach(function (key) {
      if (symbol[key] === undefined) {
        symbol[key] = details[key];
      }
    });
    return symbol;
  }

  function inferDisplayKind(glyph, category) {
    if (category === "cards") return "card";
    if (category === "chess") return "chess";
    if (category === "go") return "goStone";
    if (category === "dice") return "dice";
    if (category === "dominoes") return "domino";
    if (category === "logic") return "logic";
    if (category === "maze") return "maze";
    return glyph && glyph.length <= 2 && /[\u2600-\u27BF\u{1F000}-\u{1FAFF}]/u.test(glyph) ? "emoji" : "text";
  }

  var suits = [
    makeSymbol("heart", "♥", "hearts", "cards", ["suit", "red"], "H"),
    makeSymbol("diamond", "♦", "diamonds", "cards", ["suit", "red"], "D"),
    makeSymbol("club", "♣", "clubs", "cards", ["suit", "black"], "C"),
    makeSymbol("spade", "♠", "spades", "cards", ["suit", "black"], "S")
  ];
  var ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  function card(rank, suitIndex) {
    var suit = suits[suitIndex % suits.length];
    return makeSymbol(
      "card-" + rank + "-" + suit.id,
      rank + suit.glyph,
      rank + " of " + suit.label,
      "cards",
      ["card", "rank-" + rank, "suit-" + suit.id].concat(suit.tags),
      rank + suit.fallback,
      {
        rank: rank,
        suit: suit.id,
        suitGlyph: suit.glyph,
        cornerLabel: rank,
        ariaLabel: rank + " of " + suit.label,
        displayKind: "card"
      }
    );
  }

  var chess = [
    makeSymbol("white-king", "♔", "white king", "chess", ["king", "white"], "K", { movement: "one-square-any-direction" }),
    makeSymbol("white-queen", "♕", "white queen", "chess", ["queen", "white"], "Q", { movement: "rook-or-bishop" }),
    makeSymbol("white-rook", "♖", "white rook", "chess", ["rook", "white"], "R", { movement: "orthogonal-lines" }),
    makeSymbol("white-bishop", "♗", "white bishop", "chess", ["bishop", "white"], "B", { movement: "diagonal-lines" }),
    makeSymbol("white-knight", "♘", "white knight", "chess", ["knight", "white"], "N", { movement: "l-move" }),
    makeSymbol("white-pawn", "♙", "white pawn", "chess", ["pawn", "white"], "P", { movement: "forward-step" }),
    makeSymbol("black-king", "♚", "black king", "chess", ["king", "black"], "k", { movement: "one-square-any-direction" }),
    makeSymbol("black-queen", "♛", "black queen", "chess", ["queen", "black"], "q", { movement: "rook-or-bishop" }),
    makeSymbol("black-rook", "♜", "black rook", "chess", ["rook", "black"], "r", { movement: "orthogonal-lines" }),
    makeSymbol("black-bishop", "♝", "black bishop", "chess", ["bishop", "black"], "b", { movement: "diagonal-lines" }),
    makeSymbol("black-knight", "♞", "black knight", "chess", ["knight", "black"], "n", { movement: "l-move" }),
    makeSymbol("black-pawn", "♟", "black pawn", "chess", ["pawn", "black"], "p", { movement: "forward-step" })
  ];

  var checkers = [
    makeSymbol("checker-man", "●", "checker man", "checkers", ["diagonal-step", "dark-square"], "man"),
    makeSymbol("checker-king", "◎", "checker king", "checkers", ["diagonal-step", "diagonal-jump", "dark-square"], "king")
  ];

  var go = [
    makeSymbol("go-black", "●", "black stone", "go", ["stone", "black", "orthogonal-adjacency"], "black"),
    makeSymbol("go-white", "○", "white stone", "go", ["stone", "white", "orthogonal-adjacency"], "white"),
    makeSymbol("go-empty", "·", "empty point", "go", ["empty", "liberty"], "empty"),
    makeSymbol("go-liberty", "+", "liberty marker", "go", ["liberty", "orthogonal-adjacency"], "liberty"),
    makeSymbol("go-territory", "□", "territory marker", "go", ["territory"], "territory")
  ];

  var othello = [
    makeSymbol("othello-black", "●", "black disc", "othello", ["disc", "black", "capture"], "black", { displayKind: "unicode" }),
    makeSymbol("othello-white", "○", "white disc", "othello", ["disc", "white", "capture"], "white", { displayKind: "unicode" }),
    makeSymbol("othello-empty", "·", "empty square", "othello", ["empty", "move"], "empty", { displayKind: "text" }),
    makeSymbol("othello-marked-move", "✦", "marked move square", "othello", ["move", "marked"], "move", { displayKind: "unicode" }),
    makeSymbol("othello-flip", "✓", "disc that flips", "othello", ["answer", "flip"], "flip", { displayKind: "unicode" })
  ];

  var logic = [
    makeSymbol("logic-0", "0", "logic zero", "logic", ["input", "output", "false"], "0", { value: 0 }),
    makeSymbol("logic-1", "1", "logic one", "logic", ["input", "output", "true"], "1", { value: 1 }),
    makeSymbol("logic-and", "AND", "AND gate", "logic", ["gate"], "AND"),
    makeSymbol("logic-or", "OR", "OR gate", "logic", ["gate"], "OR"),
    makeSymbol("logic-xor", "XOR", "XOR gate", "logic", ["gate"], "XOR"),
    makeSymbol("logic-not", "NOT", "NOT gate", "logic", ["gate"], "NOT"),
    makeSymbol("logic-nand", "NAND", "NAND gate", "logic", ["gate"], "NAND"),
    makeSymbol("logic-output", "=", "output marker", "logic", ["equals"], "=")
  ];

  var dice = [1, 2, 3, 4, 5, 6].map(function (value) {
    return makeSymbol("die-" + value, String(value), "die face " + value, "dice", ["die", "pips"], String(value), { value: value });
  });

  var sudoku = [1, 2, 3, 4, 5].map(function (value) {
    return makeSymbol("sudoku-" + value, String(value), "digit " + value, "sudoku", ["digit", "number-grid"], String(value), {
      value: value,
      displayKind: "text",
      ariaLabel: "Sudoku digit " + value
    });
  });

  var minesweeper = [
    makeSymbol("mine-hidden", "□", "hidden square", "minesweeper", ["hidden", "candidate"], "hidden", { displayKind: "text" }),
    makeSymbol("mine-flag", "⚑", "flag", "minesweeper", ["flag", "selection"], "flag", { displayKind: "text" }),
    makeSymbol("mine-bomb", "💣", "mine", "minesweeper", ["mine", "answer"], "mine", { displayKind: "emoji" })
  ].concat(Array.from({ length: 9 }, function (_, count) {
    return makeSymbol("mine-clue-" + count, String(count), count + " nearby mines", "minesweeper", ["clue", "number-grid"], String(count), {
      value: count,
      displayKind: "text",
      ariaLabel: "Minesweeper clue " + count
    });
  }));

  function domino(left, right) {
    return makeSymbol(
      "domino-" + left + "-" + right,
      left + "|" + right,
      "domino " + left + " to " + right,
      "dominoes",
      ["domino", "pips"],
      left + "-" + right,
      { left: left, right: right, ariaLabel: "domino with " + left + " and " + right }
    );
  }

  var ecology = [
    makeSymbol("plant", "🌱", "Plant", "ecology", ["producer", "grassland", "forest", "food-chain"], "plant", { shortLabel: "Plant" }),
    makeSymbol("insect", "🐛", "Insect", "ecology", ["prey", "grassland", "insect", "food-chain"], "insect", { shortLabel: "Insect" }),
    makeSymbol("frog", "🐸", "Frog", "ecology", ["predator", "prey", "water", "food-chain"], "frog", { shortLabel: "Frog" }),
    makeSymbol("snake", "🐍", "Snake", "ecology", ["predator", "prey", "grassland", "reptile", "food-chain"], "snake", { shortLabel: "Snake" }),
    makeSymbol("hawk", "🦅", "Hawk", "ecology", ["predator", "sky", "bird", "food-chain"], "hawk", { shortLabel: "Hawk", fallback: "eagle" }),
    makeSymbol("fish", "🐟", "Fish", "ecology", ["prey", "water", "ocean", "food-chain"], "fish", { shortLabel: "Fish" }),
    makeSymbol("bear", "🐻", "Bear", "ecology", ["predator", "forest"], "bear", { shortLabel: "Bear" }),
    makeSymbol("rabbit", "🐇", "Rabbit", "ecology", ["prey", "grassland", "forest"], "rabbit", { shortLabel: "Rabbit" }),
    makeSymbol("fox", "🦊", "Fox", "ecology", ["predator", "forest", "grassland"], "fox", { shortLabel: "Fox" }),
    makeSymbol("bee", "🐝", "Bee", "ecology", ["pollinator", "insect", "grassland"], "bee", { shortLabel: "Bee" }),
    makeSymbol("flower", "🌸", "Flower", "ecology", ["plant", "pollinator-pair", "grassland"], "flower", { shortLabel: "Flower" }),
    makeSymbol("mouse", "🐁", "Mouse", "ecology", ["prey", "forest", "farm"], "mouse", { shortLabel: "Mouse" }),
    makeSymbol("owl", "🦉", "Owl", "ecology", ["predator", "bird", "forest"], "owl", { shortLabel: "Owl" }),
    makeSymbol("snail", "🐌", "Snail", "ecology", ["prey", "garden"], "snail", { shortLabel: "Snail" }),
    makeSymbol("worm", "🪱", "Worm", "ecology", ["prey", "soil"], "worm", { shortLabel: "Worm" })
  ];

  var food = [
    makeSymbol("tomato", "🍅", "Tomato", "food", ["ingredient", "vegetable", "pizza", "salad", "taco"], "tomato"),
    makeSymbol("onion", "🧅", "Onion", "food", ["ingredient", "vegetable", "taco"], "onion"),
    makeSymbol("garlic", "🧄", "Garlic", "food", ["ingredient", "vegetable", "pasta"], "garlic"),
    makeSymbol("lettuce", "🥬", "Lettuce", "food", ["ingredient", "vegetable", "salad", "burger", "taco"], "lettuce"),
    makeSymbol("cheese", "🧀", "Cheese", "food", ["ingredient", "dairy", "pizza", "burger", "taco"], "cheese"),
    makeSymbol("meat", "🥩", "Meat", "food", ["ingredient", "protein", "taco", "burger"], "meat"),
    makeSymbol("food-fish", "🐟", "Fish", "food", ["ingredient", "protein", "sushi"], "fish"),
    makeSymbol("bread", "🍞", "Bread", "food", ["ingredient", "grain", "breakfast", "burger", "pizza"], "bread"),
    makeSymbol("egg", "🥚", "Egg", "food", ["ingredient", "protein", "breakfast"], "egg"),
    makeSymbol("potato", "🥔", "Potato", "food", ["ingredient", "vegetable"], "potato"),
    makeSymbol("corn", "🌽", "Corn", "food", ["ingredient", "grain", "taco"], "corn"),
    makeSymbol("beans", "🫘", "Beans", "food", ["ingredient", "protein", "taco"], "beans"),
    makeSymbol("mushroom", "🍄", "Mushroom", "food", ["ingredient", "pizza", "salad"], "mushroom"),
    makeSymbol("lemon", "🍋", "Lemon", "food", ["ingredient", "fruit", "salad", "sushi"], "lemon"),
    makeSymbol("strawberry", "🍓", "Strawberry", "food", ["fruit", "breakfast"], "strawberry"),
    makeSymbol("banana", "🍌", "Banana", "food", ["fruit", "breakfast"], "banana"),
    makeSymbol("pizza", "🍕", "Pizza", "dish", ["dish", "pizza"], "pizza"),
    makeSymbol("taco", "🌮", "Taco", "dish", ["dish", "taco"], "taco"),
    makeSymbol("pasta", "🍝", "Pasta", "dish", ["dish", "pasta"], "pasta"),
    makeSymbol("sushi", "🍣", "Sushi", "dish", ["dish", "sushi"], "sushi"),
    makeSymbol("salad", "🥗", "Salad", "dish", ["dish", "salad"], "salad"),
    makeSymbol("ramen", "🍜", "Ramen", "dish", ["dish", "ramen"], "ramen"),
    makeSymbol("burger", "🍔", "Burger", "dish", ["dish", "burger"], "burger"),
    makeSymbol("rice", "🍚", "Rice", "food", ["ingredient", "grain", "sushi"], "rice"),
    makeSymbol("cucumber", "🥒", "Cucumber", "food", ["ingredient", "vegetable", "salad", "sushi"], "cucumber"),
    makeSymbol("carrot", "🥕", "Carrot", "food", ["ingredient", "vegetable", "salad"], "carrot"),
    makeSymbol("coffee", "☕", "Coffee", "food", ["drink", "breakfast"], "coffee")
  ];

  var kitchen = [
    makeSymbol("knife", "🔪", "Knife", "kitchen", ["tool", "cut"], "knife"),
    makeSymbol("spoon", "🥄", "Spoon", "kitchen", ["tool", "serve"], "spoon"),
    makeSymbol("fork", "🍴", "Fork", "kitchen", ["tool", "serve"], "fork"),
    makeSymbol("bowl", "🥣", "Bowl", "kitchen", ["tool", "container"], "bowl"),
    makeSymbol("pan", "🍳", "Pan", "kitchen", ["tool", "cook"], "pan"),
    makeSymbol("pot", "🫕", "Pot", "kitchen", ["tool", "cook"], "pot"),
    makeSymbol("salt", "🧂", "Salt", "kitchen", ["tool", "season"], "salt"),
    makeSymbol("scale", "⚖️", "Scale", "kitchen", ["tool", "measure"], "scale"),
    makeSymbol("timer", "⏲️", "Timer", "kitchen", ["tool", "measure"], "timer"),
    makeSymbol("sponge", "🧽", "Sponge", "kitchen", ["tool", "clean"], "sponge"),
    makeSymbol("oven-mitt", "🧤", "Oven mitt", "kitchen", ["tool", "protect"], "mitt")
  ];

  var music = [
    makeSymbol("guitar", "🎸", "Guitar", "music", ["instrument", "string"], "guitar"),
    makeSymbol("piano", "🎹", "Piano", "music", ["instrument", "keys"], "piano"),
    makeSymbol("drum", "🥁", "Drum", "music", ["instrument", "percussion"], "drum"),
    makeSymbol("trumpet", "🎺", "Trumpet", "music", ["instrument", "brass"], "trumpet"),
    makeSymbol("violin", "🎻", "Violin", "music", ["instrument", "string"], "violin"),
    makeSymbol("flute", "🪈", "Flute", "music", ["instrument", "wind"], "flute"),
    makeSymbol("saxophone", "🎷", "Saxophone", "music", ["instrument", "wind"], "saxophone")
  ];

  var sky = [
    makeSymbol("sun", "☀️", "Sun", "sky", ["weather", "space"], "sun"),
    makeSymbol("moon", "🌙", "Moon", "sky", ["space", "night"], "moon"),
    makeSymbol("star", "⭐", "Star", "sky", ["space"], "star"),
    makeSymbol("cloud", "☁️", "Cloud", "sky", ["weather"], "cloud"),
    makeSymbol("rain", "🌧️", "Rain", "sky", ["weather"], "rain"),
    makeSymbol("snow", "❄️", "Snow", "sky", ["weather"], "snow"),
    makeSymbol("lightning", "⚡", "Lightning", "sky", ["weather"], "lightning"),
    makeSymbol("rainbow", "🌈", "Rainbow", "sky", ["weather"], "rainbow"),
    makeSymbol("planet", "🪐", "Planet", "sky", ["space"], "planet"),
    makeSymbol("rocket", "🚀", "Rocket", "sky", ["space"], "rocket")
  ];

  var sports = [
    makeSymbol("soccer-ball", "⚽", "Soccer ball", "sports", ["ball"], "soccer"),
    makeSymbol("basketball", "🏀", "Basketball", "sports", ["ball"], "basketball"),
    makeSymbol("football", "🏈", "Football", "sports", ["ball"], "football"),
    makeSymbol("baseball", "⚾", "Baseball", "sports", ["ball"], "baseball"),
    makeSymbol("tennis-ball", "🎾", "Tennis ball", "sports", ["ball"], "tennis"),
    makeSymbol("volleyball", "🏐", "Volleyball", "sports", ["ball"], "volleyball"),
    makeSymbol("chess-game", "♟", "Chess piece", "games", ["game"], "chess"),
    makeSymbol("die-game", "🎲", "Die", "games", ["game"], "die"),
    makeSymbol("joker", "🃏", "Joker", "games", ["card", "game"], "joker")
  ];

  var workshop = [
    makeSymbol("hammer", "🔨", "Hammer", "tools", ["workshop", "tool"], "hammer"),
    makeSymbol("wrench", "🔧", "Wrench", "tools", ["workshop", "tool"], "wrench"),
    makeSymbol("screwdriver", "🪛", "Screwdriver", "tools", ["workshop", "tool"], "screwdriver"),
    makeSymbol("saw", "🪚", "Saw", "tools", ["workshop", "tool"], "saw"),
    makeSymbol("magnet", "🧲", "Magnet", "tools", ["workshop", "tool"], "magnet"),
    makeSymbol("ladder", "🪜", "Ladder", "tools", ["workshop", "tool"], "ladder"),
    makeSymbol("gear", "⚙️", "Gear", "tools", ["workshop", "tool"], "gear")
  ];

  var household = [
    makeSymbol("key", "🔑", "Key", "household", ["pair", "access"], "key"),
    makeSymbol("lock", "🔒", "Lock", "household", ["pair", "access"], "lock"),
    makeSymbol("candle", "🕯️", "Candle", "household", ["pair", "light"], "candle"),
    makeSymbol("flame", "🔥", "Flame", "household", ["pair", "light"], "flame"),
    makeSymbol("bulb", "💡", "Light bulb", "household", ["light"], "bulb"),
    makeSymbol("compass", "🧭", "Compass", "household", ["direction"], "compass"),
    makeSymbol("thread", "🧵", "Thread", "household", ["pair", "sewing"], "thread"),
    makeSymbol("needle", "🪡", "Needle", "household", ["pair", "sewing"], "needle"),
    makeSymbol("scissors", "✂️", "Scissors", "household", ["tool", "sewing"], "scissors"),
    makeSymbol("books", "📚", "Books", "household", ["object"], "books"),
    makeSymbol("bone", "🦴", "Bone", "relationship", ["pair"], "bone"),
    makeSymbol("skull", "☠️", "Skull", "relationship", ["pair"], "skull"),
    makeSymbol("bread-butter", "🧈", "Butter", "food", ["pair", "ingredient"], "butter"),
    makeSymbol("fishing-pole", "🎣", "Fishing pole", "relationship", ["pair"], "fishing")
  ];

  var directions = [
    makeSymbol("north", "N", "north", "direction", ["cardinal", "rotation"], "N", { angle: 0 }),
    makeSymbol("northeast", "NE", "northeast", "direction", ["diagonal", "rotation"], "NE", { angle: 45 }),
    makeSymbol("east", "E", "east", "direction", ["cardinal", "rotation"], "E", { angle: 90 }),
    makeSymbol("southeast", "SE", "southeast", "direction", ["diagonal", "rotation"], "SE", { angle: 135 }),
    makeSymbol("south", "S", "south", "direction", ["cardinal", "rotation"], "S", { angle: 180 }),
    makeSymbol("southwest", "SW", "southwest", "direction", ["diagonal", "rotation"], "SW", { angle: 225 }),
    makeSymbol("west", "W", "west", "direction", ["cardinal", "rotation"], "W", { angle: 270 }),
    makeSymbol("northwest", "NW", "northwest", "direction", ["diagonal", "rotation"], "NW", { angle: 315 })
  ];

  var hours = Array.from({ length: 12 }, function (_, index) {
    var hour = index + 1;
    return makeSymbol("hour-" + hour, String(hour), hour + " o'clock", "clock", ["hour", "rotation"], String(hour), { hour: hour });
  });

  var abstract = [
    makeSymbol("moon-mark", "☾", "moon mark", "abstract", ["cycle"], "moon"),
    makeSymbol("diamond-mark", "◆", "diamond", "abstract", ["shape"], "diamond"),
    makeSymbol("crown-mark", "♛", "crown", "abstract", ["shape"], "crown"),
    makeSymbol("lightning-mark", "☇", "lightning mark", "abstract", ["shape"], "lightning"),
    makeSymbol("eye-mark", "◉", "eye mark", "abstract", ["shape"], "eye"),
    makeSymbol("sun-mark", "☀", "sun mark", "abstract", ["cycle"], "sun"),
    makeSymbol("bone-mark", "⚚", "bone mark", "abstract", ["pair"], "bone"),
    makeSymbol("lock-mark", "▣", "lock mark", "abstract", ["pair"], "lock"),
    makeSymbol("key-mark", "⚿", "key mark", "abstract", ["pair"], "key"),
    makeSymbol("divider", "•", "divider", "layout", ["divider"], "divider")
  ];

  var allSymbols = suits.concat(chess, checkers, go, othello, logic, dice, sudoku, minesweeper, ecology, food, kitchen, music, sky, sports, workshop, household, directions, hours, abstract);
  var symbolMap = {};
  allSymbols.forEach(function (symbol) {
    symbolMap[symbol.id] = symbol;
  });

  var relationshipPairs = [
    ["moon", "sun"],
    ["key", "lock"],
    ["bee", "flower"],
    ["skull", "bone"],
    ["thread", "needle"],
    ["bread", "bread-butter"],
    ["candle", "flame"],
    ["fishing-pole", "food-fish"]
  ];

  var themePacks = [
    theme("kitchen-tools", "Kitchen Tools", "Objects", 1, ["knife", "spoon", "fork", "bowl", "pan"], ["tomato", "guitar", "soccer-ball"], "Ladder"),
    theme("workshop-tools", "Workshop Tools", "Objects", 2, ["hammer", "wrench", "screwdriver", "saw", "gear"], ["banana", "flower", "piano"], "Ladder"),
    theme("ocean-animals", "Ocean Animals", "Animals", 2, ["fish", "food-fish", "snail", "frog", "worm"], ["fox", "rabbit", "hawk"], "Free Play"),
    theme("forest-animals", "Forest Animals", "Animals", 2, ["bear", "fox", "rabbit", "owl", "mouse"], ["fish", "tomato", "trumpet"], "Ladder"),
    theme("musical-instruments", "Musical Instruments", "Music", 2, ["guitar", "piano", "drum", "trumpet", "violin"], ["wrench", "basketball", "tomato"], "Ladder"),
    theme("weather", "Weather", "Sky", 2, ["sun", "cloud", "rain", "snow", "lightning"], ["pizza", "hammer", "fox"], "Ladder"),
    theme("space", "Space", "Sky", 2, ["moon", "star", "planet", "rocket", "sun"], ["salad", "knife", "rabbit"], "Free Play"),
    theme("sports-balls", "Sports Balls", "Sports", 1, ["soccer-ball", "basketball", "football", "baseball", "tennis-ball"], ["cheese", "owl", "hammer"], "Free Play"),
    theme("salad-ingredients", "Salad Ingredients", "Food", 1, ["lettuce", "tomato", "cucumber", "carrot", "lemon"], ["wrench", "guitar", "basketball"], "Ladder"),
    theme("pizza-ingredients", "Pizza Ingredients", "Food", 1, ["bread", "tomato", "cheese", "mushroom", "garlic"], ["hammer", "owl", "soccer-ball"], "Ladder"),
    theme("taco-ingredients", "Taco Ingredients", "Food", 1, ["corn", "meat", "lettuce", "cheese", "beans"], ["saxophone", "gear", "moon"], "Ladder"),
    theme("breakfast-foods", "Breakfast Foods", "Food", 1, ["egg", "bread", "cheese", "banana", "coffee"], ["wrench", "snake", "rocket"], "Free Play"),
    theme("household-pairs", "Household Pairs", "Objects", 2, ["key", "lock", "thread", "needle", "scissors"], ["fish", "pizza", "football"], "Lab"),
    theme("farm-animals", "Farm Animals", "Animals", 2, ["rabbit", "mouse", "bee", "worm", "plant"], ["planet", "screwdriver", "sushi"], "Lab"),
    theme("board-games", "Board Games", "Games", 2, ["chess-game", "die-game", "joker", "checker-king", "checker-man"], ["tomato", "rain", "hammer"], "Lab")
  ];

  function theme(id, name, sourceWorld, difficulty, itemIds, imposterIds, availability) {
    return {
      id: id,
      name: name,
      sourceWorld: sourceWorld,
      difficulty: difficulty,
      items: itemIds.map(symbolById),
      cleanRows: itemIds,
      imposters: imposterIds.map(symbolById),
      notes: availability + " pack. Curated to avoid obscure trivia and botanical traps.",
      availability: availability
    };
  }

  function symbolById(id) {
    return symbolMap[id] || makeSymbol(id, id, id, "unknown", [], id, { displayKind: "text" });
  }

  return {
    packs: {
      cards: { suits: suits, ranks: ranks, card: card },
      chess: chess,
      checkers: checkers,
      go: go,
      othello: othello,
      logic: logic,
      dice: dice,
      sudoku: sudoku,
      minesweeper: minesweeper,
      domino: domino,
      animals: ecology,
      ecology: ecology,
      food: food,
      kitchen: kitchen,
      music: music,
      sky: sky,
      sports: sports,
      workshop: workshop,
      household: household,
      directions: directions,
      hours: hours,
      abstract: abstract,
      relationships: relationshipPairs
    },
    themePacks: themePacks,
    allSymbols: allSymbols,
    symbolMap: symbolMap,
    symbolById: symbolById,
    relationshipPairs: relationshipPairs,
    makeSymbol: makeSymbol,
    card: card,
    domino: domino
  };
}));
