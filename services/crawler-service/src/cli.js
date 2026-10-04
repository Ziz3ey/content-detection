const fs = require("node:fs/promises");
const path = require("node:path");
const { crawl } = require("./crawler/crawler");

async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    throw new Error("Usage: npm run start -- <crawler-config.json>");
  }

  const configText = await fs.readFile(path.resolve(configPath), "utf8");
  const config = JSON.parse(configText);
  const logger = {
    info: (...values) => console.error(...values),
    warn: (...values) => console.error(...values),
    error: (...values) => console.error(...values),
  };
  const results = await crawl(config, { logger });

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(`Crawler could not complete: ${error.message}`);
  process.exitCode = 1;
});
