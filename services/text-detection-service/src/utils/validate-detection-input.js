const { MAX_TEXT_LENGTH } = require("../config/server");
const { HttpError } = require("./http-error");
const { validateText } = require("./validate-text");

function validateDetectionInput(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Body request harus berupa object JSON dengan field 'text'.",
    );
  }

  let text;
  try {
    text = validateText(body.text);
  } catch (error) {
    if (!(error instanceof TypeError || error instanceof RangeError)) {
      throw error;
    }

    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Field 'text' harus berupa string dan tidak boleh kosong.",
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      `Field 'text' tidak boleh melebihi ${MAX_TEXT_LENGTH} karakter.`,
    );
  }

  return text;
}

module.exports = { validateDetectionInput };
