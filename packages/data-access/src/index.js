const { resolveDatabasePath } = require("./config/database-config");
const { initializeDatabase } = require("./db/database");
const {
  DataAccessError,
  DataValidationError,
  ScanRepository,
} = require("./repositories/scan-repository");
const {
  DataAccessError: SiteDataAccessError,
  DataValidationError: SiteDataValidationError,
  SiteRepository,
} = require("./repositories/site-repository");
const {
  ScheduleDataAccessError,
  ScheduleDataValidationError,
  ScheduleRepository,
  computeNextRunAt,
} = require("./repositories/schedule-repository");
const {
  NotificationDataAccessError,
  NotificationDataValidationError,
  NotificationRepository,
} = require("./repositories/notification-repository");
const {
  ScanJobDataAccessError,
  ScanJobDataValidationError,
  ScanJobRepository,
} = require("./repositories/scan-job-repository");

function createDataAccess(databasePath = resolveDatabasePath()) {
  const database = initializeDatabase(databasePath);
  return {
    database,
    sites: new SiteRepository(database),
    scans: new ScanRepository(database),
    schedules: new ScheduleRepository(database),
    notifications: new NotificationRepository(database),
    scanJobs: new ScanJobRepository(database),
    close: () => database.close(),
  };
}

module.exports = {
  createDataAccess,
  DataAccessError,
  DataValidationError,
  SiteRepository,
  SiteDataAccessError,
  SiteDataValidationError,
  ScheduleRepository,
  ScheduleDataAccessError,
  ScheduleDataValidationError,
  NotificationRepository,
  NotificationDataAccessError,
  NotificationDataValidationError,
  ScanJobRepository,
  ScanJobDataAccessError,
  ScanJobDataValidationError,
  computeNextRunAt,
  initializeDatabase,
  resolveDatabasePath,
  ScanRepository,
};
