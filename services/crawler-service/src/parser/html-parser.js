const cheerio = require("cheerio");
const BLOCK_ELEMENTS = [
  "address",
  "article",
  "blockquote",
  "dd",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "td",
  "th",
  "tr",
  "ul",
].join(", ");

function parseHtml(html) {
  const $ = cheerio.load(html);
  const title = $("title").first().text().replace(/\s+/g, " ").trim();
  const links = [];

  $("a[href]").each((_index, element) => {
    links.push($(element).attr("href"));
  });

  // Ekstraksi atribut alt dan title gambar agar teks pada foto dapat dianalisis Aho-Corasick
  $("img[alt], img[title]").each((_index, element) => {
    const alt = $(element).attr("alt");
    const imgTitle = $(element).attr("title");
    if (alt && alt.trim()) $(element).after(` ${alt.trim()} `);
    if (imgTitle && imgTitle.trim()) $(element).after(` ${imgTitle.trim()} `);
  });

  $("script, style, noscript, template").remove();
  const body = $("body");
  body.find("br").replaceWith(" ");
  body.find(BLOCK_ELEMENTS).each((_index, element) => {
    $(element).before(" ").after(" ");
  });
  const text = body.text().replace(/\s+/g, " ").trim();

  return { title, text, links };
}

module.exports = { parseHtml };
