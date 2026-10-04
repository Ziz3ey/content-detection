const assert = require("node:assert/strict");
const { test } = require("node:test");
const { validateDataset } = require("../validate-dataset");

const hash = "a".repeat(64);

function manifest(sampleId, detector, overrides = {}) {
  const inputByDetector = {
    text: { kind: "text", path: `samples/${sampleId}.txt`, sha256: hash },
    link: { kind: "url", value: "https://example.test/path" },
    defacement: {
      kind: "html",
      path: `samples/${sampleId}-current.html`,
      sha256: hash,
    },
  };
  return {
    record_type: "manifest",
    sample_id: sampleId,
    detector,
    source_type: "synthetic",
    split: "evaluation",
    group_id: `${sampleId}-group`,
    input: inputByDetector[detector],
    reference:
      detector === "defacement"
        ? {
            kind: "html",
            path: `samples/${sampleId}-baseline.html`,
            sha256: hash,
          }
        : null,
    provenance: {
      source_reference: "project-authored test record",
      license_or_permission: "project-authored",
      collected_at: null,
    },
    codebook_version: "1.0",
    ...overrides,
  };
}

function annotation(sampleId, detector, groundTruth, overrides = {}) {
  return {
    record_type: "annotation",
    sample_id: sampleId,
    detector,
    annotator_id: "reviewer-test",
    annotation_status: "adjudicated",
    ground_truth: groundTruth,
    annotation_notes: "In-memory validator test only; not research data.",
    codebook_version: "1.0",
    ...overrides,
  };
}

function validate(manifests, annotations) {
  return validateDataset(
    manifests.map((record) => JSON.stringify(record)).join("\n"),
    annotations.map((record) => JSON.stringify(record)).join("\n"),
  );
}

test("accepts empty JSONL templates without inventing samples", () => {
  assert.deepEqual(validateDataset("", ""), {
    errors: [],
    sampleCount: 0,
    annotationCount: 0,
  });
});

test("accepts detector-specific labels and co-occurring defacement axes", () => {
  const textGroundTruth = {
    categories: {
      gambling: "uncertain",
      fraud: "negative",
      pornography: "negative",
    },
  };
  const linkGroundTruth = {
    characteristics: {
      long_url: "negative",
      many_subdomains: "negative",
      ip_hostname: "positive",
      unusual_hostname: "negative",
      encoded_url_structure: "negative",
      url_credentials: "negative",
      suspicious_path: "negative",
      external_redirect_parameter: "negative",
    },
  };

  for (const [sampleId, detector, groundTruth] of [
    ["text-1", "text", textGroundTruth],
    ["link-1", "link", linkGroundTruth],
    [
      "defacement-1",
      "defacement",
      { change_status: "changed", pattern_status: "pattern_indication" },
    ],
  ]) {
    const result = validate(
      [manifest(sampleId, detector)],
      [annotation(sampleId, detector, groundTruth)],
    );
    assert.deepEqual(result.errors, []);
  }
});

test("rejects duplicate sample IDs and split leakage across a group", () => {
  const first = manifest("text-1", "text");
  const duplicate = manifest("text-1", "text", { split: "development" });
  const sameGroup = manifest("text-2", "text", {
    group_id: first.group_id,
    split: "development",
  });
  const result = validate([first, duplicate, sameGroup], []);

  assert.ok(
    result.errors.some((error) => error.includes("duplicates sample_id")),
  );
  assert.ok(result.errors.some((error) => error.includes("splits group")));
});

test("rejects invalid detector labels and codebook versions", () => {
  const invalidManifest = manifest("text-1", "text", { detector: "unknown" });
  const invalidAnnotation = annotation(
    "text-1",
    "text",
    {
      categories: {
        gambling: "failed",
        fraud: "negative",
        pornography: "negative",
      },
    },
    { codebook_version: "" },
  );
  const result = validate([invalidManifest], [invalidAnnotation]);

  assert.ok(result.errors.some((error) => error.includes("invalid detector")));
  assert.ok(result.errors.some((error) => error.includes("codebook_version")));
  assert.ok(
    result.errors.some((error) => error.includes("invalid gambling label")),
  );
});

test("keeps prediction fields out of ground-truth annotations", () => {
  const result = validate(
    [manifest("text-1", "text")],
    [
      annotation(
        "text-1",
        "text",
        {
          categories: {
            gambling: "negative",
            fraud: "negative",
            pornography: "negative",
          },
        },
        { prediction: { detected: false } },
      ),
    ],
  );

  assert.ok(
    result.errors.some((error) =>
      error.includes("keep system prediction separate"),
    ),
  );
});

test("rejects orphan annotations and failed/skipped as ground-truth labels", () => {
  const orphan = annotation("missing", "link", {
    characteristics: {
      long_url: "negative",
      many_subdomains: "negative",
      ip_hostname: "negative",
      unusual_hostname: "negative",
      encoded_url_structure: "negative",
      url_credentials: "negative",
      suspicious_path: "negative",
      external_redirect_parameter: "negative",
    },
  });
  const invalidLabel = annotation("text-1", "text", {
    categories: {
      gambling: "skipped",
      fraud: "negative",
      pornography: "negative",
    },
  });
  const result = validate([manifest("text-1", "text")], [orphan, invalidLabel]);

  assert.ok(result.errors.some((error) => error.includes("unknown sample_id")));
  assert.ok(
    result.errors.some((error) => error.includes("invalid gambling label")),
  );
});
