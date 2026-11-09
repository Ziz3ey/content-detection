const { readJsonBody } = require("../utils/read-json-body");
const { sendJson } = require("../utils/send-json");
const { validateScanInput } = require("../utils/validate-scan-input");
const { HttpError } = require("../utils/http-error");

async function scanController(request, response, scan, scanWorker) {
  const body = await readJsonBody(request);
  const input = validateScanInput(body);

  if (input.background) {
    if (!scanWorker || typeof scanWorker.dispatchSingleScan !== "function") {
      throw new HttpError(503, "SERVICE_UNAVAILABLE", "Worker background scanning tidak aktif.");
    }
    if (!input.officerEmail) {
      throw new HttpError(400, "INVALID_INPUT", "Email petugas wajib diisi untuk pemindaian.");
    }
    const job = await scanWorker.dispatchSingleScan({
      input,
      officerEmail: input.officerEmail,
    });

    sendJson(response, 202, {
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        officerEmail: job.officerEmail,
        targetUrl: job.targetUrl,
        startedAt: job.startedAt,
        message: "Pemindaian telah dimulai di latar belakang. Anda dapat menutup browser atau meninggalkan dashboard.",
      },
    });
    return;
  }

  const data = await scan(input);
  sendJson(response, 200, { success: true, data });
}

module.exports = { scanController };
