const { MAX_REQUEST_BYTES } = require("../config/server");
const { HttpError } = require("./http-error");

async function readJsonBody(request) {
  const chunks = [];
  let bytesRead = 0;
  let tooLarge = false;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytesRead += buffer.length;

    if (bytesRead > MAX_REQUEST_BYTES) {
      tooLarge = true;
      chunks.length = 0;
      continue;
    }

    if (!tooLarge) {
      chunks.push(buffer);
    }
  }

  if (tooLarge) {
    throw new HttpError(
      413,
      "PAYLOAD_TOO_LARGE",
      "Ukuran request melebihi batas yang diizinkan.",
    );
  }

  if (bytesRead === 0) {
    return undefined;
  }

  const contentType = request.headers["content-type"]
    ?.split(";")[0]
    .trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    throw new HttpError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type harus application/json.",
    );
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(
      400,
      "INVALID_JSON",
      "Body harus berupa JSON yang valid.",
    );
  }
}

module.exports = { readJsonBody };
