const schedule = require('node-schedule');
const config = require('config');
const EventEmitter = require('events');
const { CRON_EVENTS, RECURRENCE_RULES } = require('./constants');

const eventEmitter = new EventEmitter();

// every 2 hours temporary for staging
schedule.scheduleJob(config.forceRecurrenceRule || RECURRENCE_RULES.EVERY_DAY_RECURRENCE_RULE, () => {
  eventEmitter.emit(CRON_EVENTS.EVERY_DAY);
});

module.exports = eventEmitter;
