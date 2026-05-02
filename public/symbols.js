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
    var symbol = {
      id: id,
      glyph: glyph,
      label: label,
      shortLabel: extra && extra.shortLabel ? extra.shortLabel : glyph,
      category: category,
      tags: tags || [],
      fallback: fallback || label,
      ariaLabel: extra && extra.ariaLabel ? extra.ariaLabel : label
    };

    Object.keys(extra || {}).forEach(function (key) {
      if (key !== "shortLabel" && key !== "ariaLabel") {
        symbol[key] = extra[key];
      }
    });
    return symbol;
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
        ariaLabel: rank + " of " + suit.label
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

  var animals = [
    makeSymbol("plant", "PL", "plant", "ecology", ["producer", "grassland", "forest"], "plant"),
    makeSymbol("insect", "IN", "insect", "ecology", ["prey", "grassland"], "insect"),
    makeSymbol("frog", "FR", "frog", "ecology", ["predator", "prey", "water"], "frog"),
    makeSymbol("snake", "SN", "snake", "ecology", ["predator", "prey", "grassland"], "snake"),
    makeSymbol("hawk", "HW", "hawk", "ecology", ["predator", "sky"], "hawk"),
    makeSymbol("fish", "FI", "fish", "ecology", ["prey", "water"], "fish"),
    makeSymbol("bear", "BR", "bear", "ecology", ["predator", "forest"], "bear"),
    makeSymbol("rabbit", "RB", "rabbit", "ecology", ["prey", "grassland"], "rabbit"),
    makeSymbol("fox", "FX", "fox", "ecology", ["predator", "forest", "grassland"], "fox"),
    makeSymbol("bee", "BE", "bee", "ecology", ["pollinator", "grassland"], "bee")
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
    makeSymbol("moon", "☾", "moon", "abstract", ["cycle"], "moon"),
    makeSymbol("diamond", "◆", "diamond", "abstract", ["shape"], "diamond"),
    makeSymbol("crown", "♛", "crown", "abstract", ["shape"], "crown"),
    makeSymbol("lightning", "☇", "lightning", "abstract", ["shape"], "lightning"),
    makeSymbol("eye", "◉", "eye", "abstract", ["shape"], "eye"),
    makeSymbol("sun", "☀", "sun", "abstract", ["cycle"], "sun"),
    makeSymbol("bone", "⚚", "bone mark", "abstract", ["pair"], "bone"),
    makeSymbol("lock", "▣", "lock", "abstract", ["pair"], "lock"),
    makeSymbol("key", "⚿", "key", "abstract", ["pair"], "key"),
    makeSymbol("divider", "•", "divider", "layout", ["divider"], "divider")
  ];

  return {
    packs: {
      cards: { suits: suits, ranks: ranks, card: card },
      chess: chess,
      checkers: checkers,
      go: go,
      logic: logic,
      dice: dice,
      domino: domino,
      animals: animals,
      directions: directions,
      hours: hours,
      abstract: abstract
    },
    makeSymbol: makeSymbol,
    card: card,
    domino: domino
  };
}));
