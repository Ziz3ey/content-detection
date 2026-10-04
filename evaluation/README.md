# Evaluation Dataset Foundation

This directory defines the data contract and annotation rules for research evaluation. It does not contain detector predictions, an evaluator, or research samples yet. The version 1 JSONL files are intentionally empty; test fixtures are not copied here or treated as ground truth.

## Units and detector contracts

- Text: one exact text value submitted to Text Detection. Ground truth has one semantic label for each existing category: `gambling`, `fraud`, and `pornography`.
- Link: one exact HTTP(S) URL submitted to Link Detection. Ground truth labels the presence of each configured URL characteristic; it does not label a URL malicious or safe.
- Defacement: one current HTML page paired with its baseline HTML for the same page/scope. Ground truth records page change and pattern indication on separate axes because both can occur in one sample.

The active Text Detection patterns `alpha`, `beta`, and `gamma` are development fixtures. They are not semantic labels, research keywords, or ground truth. Pattern matches belong to detector output only.

## Fixture, evaluation sample, and ground truth

Test fixtures exercise code behavior and remain under service test directories. An evaluation sample is an input with documented source and provenance. Ground truth is a separate annotation record made without seeing detector output. The manifest stores inputs and provenance; `annotations.jsonl` stores annotations. Prediction output must be stored separately by a future evaluator, keyed by `sample_id`.

## Files

- `schema/sample.schema.json` describes manifest and annotation records.
- `datasets/v1/manifest.jsonl` contains one manifest record per sample.
- `datasets/v1/annotations.jsonl` contains independent or adjudicated annotation records. Multiple annotators may annotate the same sample.
- `datasets/v1/codebook.md` defines the initial operational labels.

JSONL files may be empty. Do not add guessed or copied detector outputs as annotations.

## Source, provenance, and safe handling

Allowed source types are `synthetic`, `public`, and `authorized_manual`. Synthetic records support technical checks only and must be reported separately from research samples. For public or manually collected samples, record a citation/reference and the applicable license or permission. Never crawl a government website without authorization or actively visit a URL in this dataset. Store file inputs only when distribution is permitted. For file inputs, record a SHA-256 digest; do not put credentials, cookies, private data, or restricted page contents in the repository. Link URLs are data strings and must not be fetched by validation tools.

## Annotation and uncertain cases

Use the versioned codebook. Annotators should not see detector predictions while assigning ground truth. Record independent annotations before adjudication where more than one annotator is available. Preserve the reason for disagreements and the adjudicated label in annotation notes. Use `uncertain` when the sample or evidence does not support a reliable label; do not force uncertain cases into positive or negative.

## Development/evaluation split and leakage control

Every manifest record has a `split` (`development` or `evaluation`) and a `group_id`. Keep related pages, snapshots, URL variants, and duplicates from the same site/source group in one split. Freeze the evaluation split before changing detector patterns or rules. Deduplicate by source and content hash. Do not tune using evaluation labels or reuse evaluation examples as development examples.

## Failures and skipped detectors

`failed` and `skipped` describe execution, not ground truth. They are not valid annotation labels and must not be converted to negative. A future 13B prediction artifact should keep execution status separate from prediction; failed/skipped records have no binary prediction and must be reported separately from metric denominators.

## Limitations and 13B

The current Text Detection registry uses placeholder patterns, Link Detection reports configured characteristics rather than security verdicts, and Defacement Detection reports content/title changes or configured phrases rather than confirmed defacement. These limits must appear in research conclusions. A future 13B evaluator may join manifest and adjudicated annotations by `sample_id`, run predictions through the existing service contracts, and calculate metrics only for explicitly defined targets. This foundation computes no accuracy, confusion matrix, precision, recall, or F1.

## Validation

Validate the empty or populated v1 files with:

```powershell
node evaluation/validate-dataset.js
```

The validator checks JSONL structure, IDs, detector-specific input and labels, codebook versions, annotation references, and split grouping. It does not fetch URLs, create labels, run detectors, or calculate metrics.
