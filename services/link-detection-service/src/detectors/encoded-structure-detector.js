const ENCODED_RESERVED_CHARACTER = /%(?:25)*(?:2e|2f|5c|3f|23|40)/i;

function analyzeEncodedStructure(parsedUrl) {
  if (
    !ENCODED_RESERVED_CHARACTER.test(`${parsedUrl.pathname}${parsedUrl.search}`)
  ) {
    return null;
  }

  return {
    type: "encoded_url_structure",
    description:
      "Path atau query memuat karakter URL struktural dalam bentuk encoded.",
  };
}

module.exports = { analyzeEncodedStructure };
