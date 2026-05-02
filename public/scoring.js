(function (root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.OneWrongMoveScoring = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function calculateScore(totalActiveMs, mistakes, penaltySeconds) {
    var safeMs = Math.max(0, Number(totalActiveMs) || 0);
    var safeMistakes = Math.max(0, Number(mistakes) || 0);
    var penalty = penaltySeconds === undefined ? 10 : Math.max(0, Number(penaltySeconds) || 0);
    var baseSeconds = Math.ceil(safeMs / 1000);
    var mistakePenaltySeconds = safeMistakes * penalty;

    return {
      baseSeconds: baseSeconds,
      mistakePenaltySeconds: mistakePenaltySeconds,
      scoreSeconds: baseSeconds + mistakePenaltySeconds,
      penaltySecondsPerMistake: penalty
    };
  }

  return {
    calculateScore: calculateScore
  };
}));
