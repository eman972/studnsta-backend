/**
 * Feature 99: MongoDB backup / restore runbook (script stubs)
 *
 * Backup:
 *   mongodump --uri="%MONGODB_URI%" --out=./backups/%DATE%
 *
 * Restore:
 *   mongorestore --uri="%MONGODB_URI%" ./backups/<folder>
 *
 * Schedule daily via Task Scheduler / cron. Keep at least 7 daily + 4 weekly.
 */
console.log("See comments in scripts/backupRunbook.js for mongodump/mongorestore commands.");
