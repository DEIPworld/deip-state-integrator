const schedule = require('node-schedule');
const EventEmitter = require('events');
const { CRON_EVENTS } = require('./constants');

const eventEmitter = new EventEmitter();

// every 2 hours temporary for staging
schedule.scheduleJob('0 */2 * * *', () => {
  eventEmitter.emit(CRON_EVENTS.EVERY_DAY);
});

module.exports = eventEmitter;
