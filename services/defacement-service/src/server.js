const { PORT } = require("./config/defacement-config");
const { createApp } = require("./app");

createApp().listen(PORT, () => {
  console.log(`defacement-service listening on port ${PORT}`);
});
