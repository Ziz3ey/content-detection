const { randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");

const SESSION_COOKIE = "content_detection_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const SESSION_DURATION_SECONDS = SESSION_DURATION_MS / 1000;

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function createAuthService({ username, passwordHash, secureCookie = false }) {
  const [, saltHex, expectedHashHex] = passwordHash.split("$");
  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(expectedHashHex, "hex");
  const sessions = new Map();

  function pruneExpiredSessions(now = Date.now()) {
    for (const [token, session] of sessions) {
      if (session.expiresAt <= now) sessions.delete(token);
    }
  }

  function parseSessionToken(request) {
    const cookieHeader = request.headers.cookie || "";
    for (const part of cookieHeader.split(";")) {
      const separator = part.indexOf("=");
      if (separator < 0) continue;
      if (part.slice(0, separator).trim() !== SESSION_COOKIE) continue;
      const value = part.slice(separator + 1).trim();
      return /^[a-f0-9]{64}$/i.test(value) ? value : null;
    }
    return null;
  }

  function createCookie(token, maxAge = SESSION_DURATION_SECONDS) {
    return [
      `${SESSION_COOKIE}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
      `Max-Age=${maxAge}`,
      ...(secureCookie ? ["Secure"] : []),
    ].join("; ");
  }

  function authenticateCredentials(candidateUsername, password) {
    if (
      typeof candidateUsername !== "string" ||
      typeof password !== "string"
    ) {
      return false;
    }
    const candidateHash = scryptSync(password, salt, expectedHash.length);
    return (
      safeEqual(candidateUsername, username) &&
      timingSafeEqual(candidateHash, expectedHash)
    );
  }

  function createSession() {
    pruneExpiredSessions();
    const token = randomBytes(32).toString("hex");
    sessions.set(token, {
      username,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    });
    return { token, cookie: createCookie(token) };
  }

  function authenticate(request) {
    pruneExpiredSessions();
    const token = parseSessionToken(request);
    const session = token ? sessions.get(token) : null;
    return session ? { username: session.username } : null;
  }

  function revokeSession(request) {
    const token = parseSessionToken(request);
    if (token) sessions.delete(token);
  }

  return {
    authenticate,
    authenticateCredentials,
    createSession,
    revokeSession,
    clearCookie: createCookie("", 0),
  };
}

function hashPassword(password, salt = randomBytes(16)) {
  const saltBuffer = Buffer.isBuffer(salt) ? salt : Buffer.from(salt, "hex");
  const hash = scryptSync(password, saltBuffer, 64);
  return `scrypt$${saltBuffer.toString("hex")}$${hash.toString("hex")}`;
}

module.exports = {
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  createAuthService,
  hashPassword,
};
