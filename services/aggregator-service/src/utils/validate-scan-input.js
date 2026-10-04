const { MAX_HTML_LENGTH } = require("../config/aggregator-config");
const { HttpError } = require("./http-error");

function validateScanInput(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_INPUT", "Body harus berupa object JSON.");
  }

  if (
    body.crawler === null ||
    typeof body.crawler !== "object" ||
    Array.isArray(body.crawler)
  ) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Field 'crawler' harus berupa object konfigurasi crawler.",
    );
  }

  const baselinesByUrl = body.baselinesByUrl ?? {};
  if (
    baselinesByUrl === null ||
    typeof baselinesByUrl !== "object" ||
    Array.isArray(baselinesByUrl)
  ) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Field 'baselinesByUrl' harus berupa object URL ke HTML baseline.",
    );
  }

  for (const [url, html] of Object.entries(baselinesByUrl)) {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new HttpError(
        400,
        "INVALID_INPUT",
        "Setiap key baseline harus berupa URL absolut yang valid.",
      );
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new HttpError(
        400,
        "INVALID_INPUT",
        "URL baseline hanya boleh menggunakan HTTP atau HTTPS.",
      );
    }
    if (
      typeof html !== "string" ||
      html.trim().length === 0 ||
      html.length > MAX_HTML_LENGTH
    ) {
      throw new HttpError(
        400,
        "INVALID_INPUT",
        "Setiap baseline harus berupa HTML non-kosong dalam batas ukuran.",
      );
    }
  }

  return { crawler: body.crawler, baselinesByUrl };
}

module.exports = { validateScanInput };
