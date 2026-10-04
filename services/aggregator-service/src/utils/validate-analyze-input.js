const {
  MAX_HTML_LENGTH,
  MAX_TEXT_LENGTH,
  MAX_URL_LENGTH,
} = require("../config/aggregator-config");
const { HttpError } = require("./http-error");

function requireNonEmptyString(value, field, maxLength) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      `Field '${field}' harus berupa string dan tidak boleh kosong.`,
    );
  }
  if (value.length > maxLength) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      `Field '${field}' melebihi batas panjang.`,
    );
  }
  return value;
}

function validateAnalyzeInput(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_INPUT", "Body harus berupa object JSON.");
  }

  const url = requireNonEmptyString(body.url, "url", MAX_URL_LENGTH);
  const text = requireNonEmptyString(body.text, "text", MAX_TEXT_LENGTH);
  const html = requireNonEmptyString(body.html, "html", MAX_HTML_LENGTH);
  const links = body.links === undefined ? [] : body.links;
  if (!Array.isArray(links)) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Field 'links' harus berupa array URL.",
    );
  }
  const validatedLinks = links.map((link, index) =>
    requireNonEmptyString(link, `links[${index}]`, MAX_URL_LENGTH),
  );

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
  const baselineHtml = requireNonEmptyString(
    body.baseline.html,
    "baseline.html",
    MAX_HTML_LENGTH,
  );

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
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

  return {
    url,
    text,
    html,
    links: validatedLinks,
    baseline: { html: baselineHtml },
  };
}

module.exports = { validateAnalyzeInput };
