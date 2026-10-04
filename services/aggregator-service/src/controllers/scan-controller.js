const { readJsonBody } = require("../utils/read-json-body");
const { sendJson } = require("../utils/send-json");
const { validateScanInput } = require("../utils/validate-scan-input");

async function scanController(request, response, scan) {
  const body = await readJsonBody(request);
  const input = validateScanInput(body);
  const data = await scan(input);

  sendJson(response, 200, { success: true, data });
}

module.exports = { scanController };
