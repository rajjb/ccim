const { CronJob } = require('cron');
const logger = require('../utils/logger');
const farms = require('../farmer-john');
const models = require('../models');
const excel = require('../utils/googleExcel');
const telegram = require('../utils/telegram');

let serviceName = __filename.split('\\').pop();
serviceName = serviceName.split('/').pop().split('.').slice(0, -1)
  .join('.');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


module.exports.execute = async function () {
  try {

    if (module.exports.isServiceEnabled && !(await module.exports.isServiceEnabled(serviceName))) {
      return;
    }

    const messagesToSend = await models.messages.findAll({ where: { type: 'telegram' } });
    for (const message of messagesToSend) {
      await telegram.sendMessage(message.message);
      await message.destroy();
    }

  } catch (err) {
    logger.error(`${JSON.stringify(err, Object.getOwnPropertyNames(err))}`, serviceName);
  }

};


function start() {
  module.exports.execute();
}

module.exports.start = function () {
  logger.log(`[CRON] starting ${serviceName}`, serviceName);
  module.exports.job = new CronJob('* * * * *', start);
  module.exports.job.start();
  module.exports.execute();
};
