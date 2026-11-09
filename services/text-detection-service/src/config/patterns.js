const CATEGORY_PATTERNS = Object.freeze({
  gambling: Object.freeze([
    "judi online",
    "situs judi",
    "bandar judi",
    "slot gacor",
    "slot online",
    "togel online",
    "bandar togel",
    "taruhan bola",
    "kasino online",
    "poker online",
    "judi",
  ]),
  pornography: Object.freeze([
    "video porno",
    "situs porno",
    "film dewasa",
    "cerita dewasa",
    "layanan seks",
    "konten dewasa",
    "pornografi",
    "bokep",
  ]),
  fraud: Object.freeze([
    "penipuan online",
    "undian berhadiah",
    "klaim hadiah",
    "bagi-bagi hadiah",
    "bantuan dana palsu",
    "pinjaman online ilegal",
    "pinjol ilegal",
    "hadiah gratis",
  ]),
});

const PATTERN_REGISTRY = Object.freeze(
  Object.entries(CATEGORY_PATTERNS).flatMap(([category, patterns]) =>
    patterns.map((pattern) => Object.freeze({ pattern, category })),
  ),
);

module.exports = { CATEGORY_PATTERNS, PATTERN_REGISTRY };

