// Initialization order is matter
// Initialize cron schedule
require('./cron');

// Initialize schedule-based jobs
require('./jobs');
