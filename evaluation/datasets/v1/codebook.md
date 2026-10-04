# Codebook v1.0

This codebook defines independent annotations. Annotators must not use Text Detection matches, Link Detection indicators, Defacement Detection outputs, or dashboard results to assign ground truth. The current `alpha`, `beta`, and `gamma` strings are test patterns, not semantic evidence.

## General label values

- `positive`: the stated category or characteristic is present under the operational definition below.
- `negative`: the input is sufficiently complete to assess and the category or characteristic is absent.
- `uncertain`: context, source, or evidence is insufficient or ambiguous. Do not convert it to positive or negative.

## Text Detection

One sample is the exact text sent to Text Detection. Annotate all three existing categories independently; do not add categories.

- `gambling`: positive when the text explicitly offers, promotes, or facilitates online gambling/betting under the approved study definition. A warning, news report, or incidental mention is not automatically positive.
- `fraud`: positive when the text explicitly presents deceptive solicitation or misrepresentation to obtain money, credentials, or another benefit under the approved study definition. Reporting or warning about fraud is not automatically positive.
- `pornography`: positive when the text itself explicitly offers or promotes pornographic material under the approved study definition. Health, safety, or educational discussion is not automatically positive.

Use negative only when enough relevant text is available and it does not meet the category definition. Use uncertain for missing context, ambiguous quotations, or content that cannot be interpreted consistently. The final study must confirm these operational definitions before annotation begins.

Examples for adjudication, not dataset samples: a page warning users about gambling is not automatically gambling-positive; an article reporting a fraud case is not automatically fraud-positive; a health article mentioning sexual health is not automatically pornography-positive. The literal strings `alpha`, `beta`, and `gamma` never determine these labels.

## Link Detection

One sample is one HTTP(S) URL string. For each characteristic, annotate positive/negative/uncertain independently from detector output. These labels describe URL structure, not whether a destination is malicious or safe.

- `long_url`: positive only when the URL length is greater than 75% of the configured 2,048-character maximum (greater than 1,536 characters); otherwise negative if its length is known.
- `many_subdomains`: positive when the simple hostname-label calculation used in the study protocol yields more than two subdomain labels beyond the final two labels. This is not Public Suffix List analysis.
- `ip_hostname`: positive when the parsed hostname is an IPv4 or IPv6 literal.
- `unusual_hostname`: positive when a hostname label begins with `xn--` or a label contains at least three hyphens.
- `encoded_url_structure`: positive when the path or query contains percent-encoded URL structural characters recognized by the configured rule.
- `url_credentials`: positive when the URL authority contains a username or password. Use synthetic placeholders for this condition; never include real credentials.
- `suspicious_path`: positive when the path matches the configured `.env`, `.git`, or `wp-config.php` path rule.
- `external_redirect_parameter`: positive when a configured redirect parameter contains an absolute HTTP(S) URL with a different origin.

An indicator is a rule characteristic to review, not a maliciousness verdict. URLs in this dataset are strings; neither the validator nor annotation process should request them.

## Defacement Detection

One sample is a baseline/current HTML pair for the same page and scope. Annotate two axes because a changed page may also contain a configured pattern, and a pattern may occur without a baseline difference.

- `change_status: unchanged`: reviewed baseline/current title and visible text show no relevant difference under the study's normalization protocol.
- `change_status: changed`: reviewed baseline/current title or visible text differs. This does not mean defacement.
- `change_status: uncertain`: a comparable pair or enough content is unavailable.
- `pattern_status: pattern_indication`: the current title/visible text contains a configured phrase (`hacked by` or `site has been defaced`) when checked independently from detector output.
- `pattern_status: no_pattern_indication`: neither configured phrase is present in the reviewed current content.
- `pattern_status: uncertain`: the current content is incomplete or cannot be reviewed.

`change_status` and `pattern_status` may coexist; for example, a pair can be `changed` and `pattern_indication`. Neither state confirms actual defacement. This schema intentionally has no `confirmed_defacement` label because the project has not identified an independent incident source for it.

## Annotation procedure

Record one independent annotation row per annotator and sample. Use stable pseudonymous `annotator_id` values. If annotations disagree, preserve each independent row and add one `adjudicated` row with the resolution in `annotation_notes`. Never overwrite initial annotations. Use uncertain rather than guessing; record the evidence and reason in notes. Codebook changes require a version change and review of affected annotations.
