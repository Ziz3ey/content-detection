const { detectText } = require("../services/detection-service");
const { readJsonBody } = require("../utils/read-json-body");
const { sendJson } = require("../utils/send-json");
const { validateDetectionInput } = require("../utils/validate-detection-input");

async function detectionController(
  request,
  response,
  detectionService = detectText,
) {
  const body = await readJsonBody(request);
  const text = validateDetectionInput(body);
  const data = await detectionService(text);

  sendJson(response, 200, { success: true, data });
}

module.exports = { detectionController };
