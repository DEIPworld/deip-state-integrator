const schedule = require('node-schedule');
const EventEmitter = require('events');
const { CRON_EVENTS } = require('./constants');

const eventEmitter = new EventEmitter();

schedule.scheduleJob('0 0 * * *', () => {
  eventEmitter.emit(CRON_EVENTS.EVERY_DAY);
});

module.exports = eventEmitter;
