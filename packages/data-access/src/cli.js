const { initializeDatabase } = require("./db/database");
const { resolveDatabasePath } = require("./config/database-config");

function main() {
  const command = process.argv[2];
  if (command !== "init") {
    throw new Error("Usage: npm run db:init");
  }

  const databasePath = resolveDatabasePath();
  const database = initializeDatabase(databasePath);
  database.close();
  console.log("SQLite data store initialized.");
}

try {
  main();
} catch (error) {
  console.error(`Database initialization failed: ${error.message}`);
  process.exitCode = 1;
}
