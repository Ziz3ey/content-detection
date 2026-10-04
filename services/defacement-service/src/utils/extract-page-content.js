const cheerio = require("cheerio");
const { normalizeContent } = require("./normalize-content");

function extractPageContent(html) {
  const $ = cheerio.load(html, { xmlMode: true });
  const title = normalizeContent($("title").first().text());

  $("script, style, noscript, template").remove();
  const text = normalizeContent($("body").text());

  return { title, text };
}

module.exports = { extractPageContent };

