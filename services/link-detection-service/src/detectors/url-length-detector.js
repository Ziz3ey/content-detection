const {
  LONG_URL_INDICATOR_RATIO,
  MAX_URL_LENGTH,
} = require("../config/link-detection-config");

function analyzeUrlLength(inputUrl) {
  if (inputUrl.length <= MAX_URL_LENGTH * LONG_URL_INDICATOR_RATIO) {
    return null;
  }

  return {
    type: "long_url",
    description: "URL melewati ambang indikator panjang yang dikonfigurasi.",
  };
}

module.exports = { analyzeUrlLength };
