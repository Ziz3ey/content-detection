const { MAX_HTML_LENGTH } = require("../config/defacement-config");
const { HttpError } = require("./http-error");

function validateDetectionInput(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_INPUT", "Body harus berupa object JSON.");
  }

  if (typeof body.html !== "string" || body.html.trim().length === 0) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Field 'html' harus berupa string dan tidak boleh kosong.",
    );
  }

  if (body.html.length > MAX_HTML_LENGTH) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      `Field 'html' tidak boleh melebihi ${MAX_HTML_LENGTH} karakter.`,
    );
  }

  if (
    body.baseline === null ||
    typeof body.baseline !== "object" ||
    Array.isArray(body.baseline)
  ) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Field 'baseline' harus berupa object dengan field 'html'.",
    );
  }

  if (
    typeof body.baseline.html !== "string" ||
    body.baseline.html.trim().length === 0
  ) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Field 'baseline.html' harus berupa string dan tidak boleh kosong.",
    );
  }

  if (body.baseline.html.length > MAX_HTML_LENGTH) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      `Field 'baseline.html' tidak boleh melebihi ${MAX_HTML_LENGTH} karakter.`,
    );
  }

  return { html: body.html, baselineHtml: body.baseline.html };
}

module.exports = { validateDetectionInput };
