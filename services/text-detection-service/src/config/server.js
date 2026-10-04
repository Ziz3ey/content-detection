const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MAX_TEXT_LENGTH = 10000;
const MAX_REQUEST_BYTES = 64 * 1024;

module.exports = {
  MAX_REQUEST_BYTES,
  MAX_TEXT_LENGTH,
  PORT,
};
