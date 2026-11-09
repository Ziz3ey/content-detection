const { HttpError } = require("../utils/http-error");
const { readJsonBody } = require("../utils/read-json-body");
const { sendJson } = require("../utils/send-json");

async function loginController(request, response, auth) {
  const body = await readJsonBody(request, 8192);
  if (
    !body ||
    typeof body.username !== "string" ||
    typeof body.password !== "string" ||
    body.username.trim().length === 0 ||
    body.password.length === 0 ||
    body.username.length > 128 ||
    body.password.length > 1024
  ) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Nama pengguna dan kata sandi wajib diisi.",
    );
  }

  if (!auth.authenticateCredentials(body.username, body.password)) {
    throw new HttpError(
      401,
      "INVALID_CREDENTIALS",
      "Nama pengguna atau kata sandi tidak sesuai.",
    );
  }

  const session = auth.createSession();
  response.setHeader("Set-Cookie", session.cookie);
  sendJson(response, 200, {
    success: true,
    data: { authenticated: true, username: body.username },
  });
}

function sessionController(request, response, auth) {
  const session = auth.authenticate(request);
  sendJson(response, 200, {
    success: true,
    data: session
      ? { authenticated: true, username: session.username }
      : { authenticated: false },
  });
}

function logoutController(request, response, auth) {
  auth.revokeSession(request);
  response.setHeader("Set-Cookie", auth.clearCookie);
  sendJson(response, 200, {
    success: true,
    data: { authenticated: false },
  });
}

module.exports = { loginController, logoutController, sessionController };
