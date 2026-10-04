const { analyzePage } = require("../services/defacement-detection-service");
const { readJsonBody } = require("../utils/read-json-body");
const { sendJson } = require("../utils/send-json");
const { validateDetectionInput } = require("../utils/validate-detection-input");

async function detectionController(request, response, analyze = analyzePage) {
  const body = await readJsonBody(request);
  const { html, baselineHtml } = validateDetectionInput(body);
  const data = await analyze(html, baselineHtml);

  sendJson(response, 200, { success: true, data });
}

module.exports = { detectionController };
