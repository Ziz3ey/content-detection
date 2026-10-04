const { createApp, HTTP_PORT } = require("./app");

createApp().listen(HTTP_PORT, () => {
  console.log(`crawler-service listening on port ${HTTP_PORT}`);
});
