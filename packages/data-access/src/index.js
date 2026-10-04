const { resolveDatabasePath } = require("./config/database-config");
const { initializeDatabase } = require("./db/database");
const {
  DataAccessError,
  DataValidationError,
  ScanRepository,
} = require("./repositories/scan-repository");

function createDataAccess(databasePath = resolveDatabasePath()) {
  const database = initializeDatabase(databasePath);
  return {
    database,
    scans: new ScanRepository(database),
    close: () => database.close(),
  };
}

module.exports = {
  createDataAccess,
  DataAccessError,
  DataValidationError,
  initializeDatabase,
  resolveDatabasePath,
  ScanRepository,
};
