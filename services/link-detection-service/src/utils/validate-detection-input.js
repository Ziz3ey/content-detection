const { MAX_URL_LENGTH } = require("../config/link-detection-config");
const { HttpError } = require("./http-error");

function validateDetectionInput(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_INPUT", "Body harus berupa object JSON.");
  }

  if (typeof body.url !== "string" || body.url.trim().length === 0) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Field 'url' harus berupa string dan tidak boleh kosong.",
    );
  }

  if (body.url.length > MAX_URL_LENGTH) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      `Field 'url' tidak boleh melebihi ${MAX_URL_LENGTH} karakter.`,
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(body.url);
  } catch {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Field 'url' harus berupa URL yang valid.",
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "URL hanya boleh menggunakan skema http atau https.",
    );
  }

  return { inputUrl: body.url, parsedUrl };
}

module.exports = { validateDetectionInput };
