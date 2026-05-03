(function (root) {
  "use strict";

  var DEFAULTS = {
    levelTimeLimitSeconds: 60,
    lowTimeWarningSeconds: 10,
    maxGeneratedLevels: 100,
    survivalModeEnabled: true
  };

  function numberInRange(value, fallback, min, max) {
    var parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      return fallback;
    }

    return Math.round(parsed);
  }

  function fromUrl() {
    try {
      var params = new URLSearchParams(root.location.search);
      return params.get("limit");
    } catch (error) {
      return null;
    }
  }

  var configuredLimit = numberInRange(fromUrl(), DEFAULTS.levelTimeLimitSeconds, 15, 180);

  root.OWM_CONFIG = {
    levelTimeLimitSeconds: configuredLimit,
    lowTimeWarningSeconds: DEFAULTS.lowTimeWarningSeconds,
    maxGeneratedLevels: DEFAULTS.maxGeneratedLevels,
    survivalModeEnabled: DEFAULTS.survivalModeEnabled,
    defaults: DEFAULTS,
    validateLevelTimeLimit: function (value) {
      return numberInRange(value, DEFAULTS.levelTimeLimitSeconds, 15, 180);
    }
  };
}(typeof globalThis !== "undefined" ? globalThis : this));
