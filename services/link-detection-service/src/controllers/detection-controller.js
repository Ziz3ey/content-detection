const { analyzeUrl } = require("../services/link-detection-service");
const { readJsonBody } = require("../utils/read-json-body");
const { sendJson } = require("../utils/send-json");
const { validateDetectionInput } = require("../utils/validate-detection-input");

async function detectionController(request, response, analyze = analyzeUrl) {
  const body = await readJsonBody(request);
  const { inputUrl, parsedUrl } = validateDetectionInput(body);
  const data = await analyze(inputUrl, parsedUrl);

  sendJson(response, 200, { success: true, data });
}

module.exports = { detectionController };
