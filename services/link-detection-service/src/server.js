const { PORT } = require("./config/link-detection-config");
const { createApp } = require("./app");

createApp().listen(PORT, () => {
  console.log(`link-detection-service listening on port ${PORT}`);
});
