const { readJsonBody } = require("../utils/read-json-body");
const { sendJson } = require("../utils/send-json");
const { validateAnalyzeInput } = require("../utils/validate-analyze-input");

async function analyzeController(request, response, analyze) {
  const body = await readJsonBody(request);
  const input = validateAnalyzeInput(body);
  const data = await analyze(input);

  sendJson(response, 200, { success: true, data });
}

module.exports = { analyzeController };
