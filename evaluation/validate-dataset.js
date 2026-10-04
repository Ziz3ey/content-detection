const fs = require("node:fs");
const path = require("node:path");

const DATASET_DIRECTORY = path.join(__dirname, "datasets", "v1");
const DETECTORS = new Set(["text", "link", "defacement"]);
const SOURCE_TYPES = new Set(["synthetic", "public", "authorized_manual"]);
const SPLITS = new Set(["development", "evaluation"]);
const ANNOTATION_STATUSES = new Set(["independent", "adjudicated"]);
const LABELS = new Set(["positive", "negative", "uncertain"]);
const TEXT_CATEGORIES = ["gambling", "fraud", "pornography"];
const LINK_CHARACTERISTICS = [
  "long_url",
  "many_subdomains",
  "ip_hostname",
  "unusual_hostname",
  "encoded_url_structure",
  "url_credentials",
  "suspicious_path",
  "external_redirect_parameter",
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return (
    isObject(value) &&
    keys.length === Object.keys(value).length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function parseJsonLines(contents, filename, errors) {
  const records = [];
  const lines = contents.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].trim()) continue;
    try {
      records.push({ record: JSON.parse(lines[index]), line: index + 1 });
    } catch {
      errors.push(`${filename}:${index + 1} is not valid JSON.`);
    }
  }

  return records;
}

function isValidSampleId(value) {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)
  );
}

function isValidCodebookVersion(value) {
  return typeof value === "string" && /^\d+\.\d+$/.test(value);
}

function isValidSha256(value) {
  return typeof value === "string" && /^[A-Fa-f0-9]{64}$/.test(value);
}

function validateManifestRecord(record, line, errors) {
  const prefix = `manifest.jsonl:${line}`;
  const required = [
    "record_type",
    "sample_id",
    "detector",
    "source_type",
    "split",
    "group_id",
    "input",
    "reference",
    "provenance",
    "codebook_version",
  ];

  if (
    !isObject(record) ||
    required.some((key) => !Object.hasOwn(record, key))
  ) {
    errors.push(`${prefix} is missing required manifest fields.`);
    return false;
  }
  if (record.record_type !== "manifest" || !isValidSampleId(record.sample_id)) {
    errors.push(`${prefix} has an invalid record_type or sample_id.`);
  }
  if (!DETECTORS.has(record.detector))
    errors.push(`${prefix} has an invalid detector.`);
  if (!SOURCE_TYPES.has(record.source_type))
    errors.push(`${prefix} has an invalid source_type.`);
  if (!SPLITS.has(record.split)) errors.push(`${prefix} has an invalid split.`);
  if (typeof record.group_id !== "string" || !record.group_id.trim()) {
    errors.push(`${prefix} requires a non-empty group_id.`);
  }
  if (!isValidCodebookVersion(record.codebook_version)) {
    errors.push(`${prefix} requires a valid codebook_version.`);
  }
  if (
    !isObject(record.provenance) ||
    typeof record.provenance.license_or_permission !== "string" ||
    !record.provenance.license_or_permission.trim() ||
    !(
      typeof record.provenance.source_reference === "string" ||
      record.provenance.source_reference === null
    ) ||
    !(
      typeof record.provenance.collected_at === "string" ||
      record.provenance.collected_at === null
    )
  ) {
    errors.push(`${prefix} has incomplete provenance.`);
  }

  if (!isObject(record.input)) {
    errors.push(`${prefix} requires an input object.`);
  } else if (record.detector === "text") {
    if (
      record.input.kind !== "text" ||
      typeof record.input.path !== "string" ||
      !isValidSha256(record.input.sha256) ||
      record.reference !== null
    ) {
      errors.push(
        `${prefix} text input must reference a text file with SHA-256 and no reference.`,
      );
    }
  } else if (record.detector === "link") {
    let validUrl = false;
    try {
      const url = new URL(record.input.value);
      validUrl = url.protocol === "http:" || url.protocol === "https:";
    } catch {
      validUrl = false;
    }
    if (record.input.kind !== "url" || !validUrl || record.reference !== null) {
      errors.push(
        `${prefix} link input must be one HTTP(S) URL and have no reference.`,
      );
    }
  } else if (record.detector === "defacement") {
    const validCurrent =
      record.input.kind === "html" &&
      typeof record.input.path === "string" &&
      isValidSha256(record.input.sha256);
    const validBaseline =
      isObject(record.reference) &&
      record.reference.kind === "html" &&
      typeof record.reference.path === "string" &&
      isValidSha256(record.reference.sha256);
    if (!validCurrent || !validBaseline) {
      errors.push(
        `${prefix} defacement input requires current and baseline HTML file references with SHA-256.`,
      );
    }
  }

  return record.record_type === "manifest" && isValidSampleId(record.sample_id);
}

function validateGroundTruth(detector, groundTruth, prefix, errors) {
  if (!isObject(groundTruth)) {
    errors.push(`${prefix} requires a ground_truth object.`);
    return;
  }

  if (detector === "text") {
    if (
      !hasExactKeys(groundTruth, ["categories"]) ||
      !hasExactKeys(groundTruth.categories, TEXT_CATEGORIES)
    ) {
      errors.push(
        `${prefix} text ground_truth must contain exactly gambling, fraud, and pornography.`,
      );
      return;
    }
    for (const category of TEXT_CATEGORIES) {
      if (!LABELS.has(groundTruth.categories[category])) {
        errors.push(`${prefix} has an invalid ${category} label.`);
      }
    }
    return;
  }

  if (detector === "link") {
    if (
      !hasExactKeys(groundTruth, ["characteristics"]) ||
      !hasExactKeys(groundTruth.characteristics, LINK_CHARACTERISTICS)
    ) {
      errors.push(
        `${prefix} link ground_truth must contain exactly the configured characteristics.`,
      );
      return;
    }
    for (const characteristic of LINK_CHARACTERISTICS) {
      if (!LABELS.has(groundTruth.characteristics[characteristic])) {
        errors.push(`${prefix} has an invalid ${characteristic} label.`);
      }
    }
    return;
  }

  if (detector === "defacement") {
    if (
      !hasExactKeys(groundTruth, ["change_status", "pattern_status"]) ||
      !["unchanged", "changed", "uncertain"].includes(
        groundTruth.change_status,
      ) ||
      !["pattern_indication", "no_pattern_indication", "uncertain"].includes(
        groundTruth.pattern_status,
      )
    ) {
      errors.push(
        `${prefix} defacement ground_truth requires independent change_status and pattern_status labels.`,
      );
    }
    return;
  }

  errors.push(
    `${prefix} cannot validate ground_truth for an invalid detector.`,
  );
}

function validateDataset(manifestContents, annotationContents) {
  const errors = [];
  const manifestRecords = parseJsonLines(
    manifestContents,
    "manifest.jsonl",
    errors,
  );
  const annotationRecords = parseJsonLines(
    annotationContents,
    "annotations.jsonl",
    errors,
  );
  const samples = new Map();
  const groupSplits = new Map();

  for (const { record, line } of manifestRecords) {
    if (!validateManifestRecord(record, line, errors)) continue;
    const prefix = `manifest.jsonl:${line}`;
    if (samples.has(record.sample_id)) {
      errors.push(`${prefix} duplicates sample_id '${record.sample_id}'.`);
      continue;
    }
    samples.set(record.sample_id, record);

    if (typeof record.group_id === "string" && SPLITS.has(record.split)) {
      const priorSplit = groupSplits.get(record.group_id);
      if (priorSplit && priorSplit !== record.split) {
        errors.push(
          `${prefix} splits group '${record.group_id}' across development and evaluation.`,
        );
      } else {
        groupSplits.set(record.group_id, record.split);
      }
    }
  }

  const annotationKeys = new Set();
  for (const { record, line } of annotationRecords) {
    const prefix = `annotations.jsonl:${line}`;
    if (
      !isObject(record) ||
      record.record_type !== "annotation" ||
      !isValidSampleId(record.sample_id) ||
      !DETECTORS.has(record.detector) ||
      typeof record.annotator_id !== "string" ||
      !record.annotator_id.trim() ||
      !ANNOTATION_STATUSES.has(record.annotation_status) ||
      typeof record.annotation_notes !== "string"
    ) {
      errors.push(
        `${prefix} has invalid fields or mixes prediction with ground truth.`,
      );
      continue;
    }
    if (!isValidCodebookVersion(record.codebook_version)) {
      errors.push(`${prefix} requires a valid codebook_version.`);
    }
    if (Object.hasOwn(record, "prediction")) {
      errors.push(
        `${prefix} must keep system prediction separate from ground truth.`,
      );
    }

    const sample = samples.get(record.sample_id);
    if (!sample) {
      errors.push(
        `${prefix} references unknown sample_id '${record.sample_id}'.`,
      );
    } else {
      if (record.detector !== sample.detector)
        errors.push(`${prefix} detector does not match its manifest record.`);
      if (record.codebook_version !== sample.codebook_version)
        errors.push(
          `${prefix} codebook_version does not match its manifest record.`,
        );
    }

    const annotationKey = `${record.sample_id}\u0000${record.annotator_id}\u0000${record.annotation_status}`;
    if (annotationKeys.has(annotationKey)) {
      errors.push(
        `${prefix} duplicates an annotation for this sample, annotator, and status.`,
      );
    }
    annotationKeys.add(annotationKey);
    validateGroundTruth(record.detector, record.ground_truth, prefix, errors);
  }

  return {
    errors,
    sampleCount: samples.size,
    annotationCount: annotationRecords.length,
  };
}

function validateDatasetFiles() {
  const manifestPath = path.join(DATASET_DIRECTORY, "manifest.jsonl");
  const annotationsPath = path.join(DATASET_DIRECTORY, "annotations.jsonl");
  const result = validateDataset(
    fs.readFileSync(manifestPath, "utf8"),
    fs.readFileSync(annotationsPath, "utf8"),
  );

  if (result.errors.length) {
    for (const error of result.errors) console.error(error);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Evaluation dataset v1 valid: ${result.sampleCount} samples, ${result.annotationCount} annotations.`,
  );
}

if (require.main === module) validateDatasetFiles();

module.exports = { validateDataset, validateGroundTruth };
