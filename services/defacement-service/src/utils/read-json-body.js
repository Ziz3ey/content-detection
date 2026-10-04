const { MAX_REQUEST_BYTES } = require("../config/defacement-config");
const { HttpError } = require("./http-error");

async function readJsonBody(request) {
  const chunks = [];
  let bytesRead = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytesRead += buffer.length;
    if (bytesRead > MAX_REQUEST_BYTES) {
      throw new HttpError(
        413,
        "PAYLOAD_TOO_LARGE",
        "Ukuran request melebihi batas.",
      );
    }
    chunks.push(buffer);
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
