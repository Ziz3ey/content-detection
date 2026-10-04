const { loadAggregatorConfig } = require("./config/aggregator-config");
const { createApp } = require("./app");

const config = loadAggregatorConfig();
createApp({ config }).listen(config.port, () => {
  console.log(`aggregator-service listening on port ${config.port}`);
});
