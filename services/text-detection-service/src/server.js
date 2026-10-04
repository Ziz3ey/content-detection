const { PORT } = require("./config/server");
const { createApp } = require("./app");

createApp().listen(PORT, () => {
  console.log(`text-detection-service listening on port ${PORT}`);
});
