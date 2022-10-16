const { CronJob } = require('cron');
const logger = require('../utils/logger');
const farms = require('../farmer-john');
const models = require('../models');
const excel = require('../utils/googleExcel');

let serviceName = __filename.split('\\').pop();
serviceName = serviceName.split('/').pop().split('.').slice(0, -1)
  .join('.');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


module.exports.execute = async function () {

  try {

    if (module.exports.isServiceEnabled && !(await module.exports.isServiceEnabled(serviceName))) {
      return;
    }

    const farms = await models.farms.findAll();
    const configurations = await models.alertConfigurations.findAll(); // getting also non active normaly
    const userChannels = await models.userChannels.findAll();

    const result = await excel.GetGoogleExcel('AlertLevels');

    let rowIndex = 0;

    for (const res of result) {

      try {
        rowIndex++;
        // skip lastupdated and headers
        if (rowIndex <= 2) {
          continue;
        }        
        
        let chain = res[0];
        if (!chain) {
          continue;
        }
        let farm = res[1];
        let pool = res[2];

        let minutesBeforeToCheck = parseInt(res[3] || 1);
        let condition = res[4];
        let message = res[5];
        let isActive = res[6].toLowerCase() == 'true';
        let users = res[7].split(',');

        if (chain == '' || chain.toLowerCase() == 'all' || chain.toLowerCase() == 'everything') {
          chain = null;
        }

        if (farm == '' || farm.toLowerCase() == 'all' || farm.toLowerCase() == 'everything') {
          farm = null;
        }

        if (pool == '' || pool.toLowerCase() == 'all' || pool.toLowerCase() == 'everything') {
          pool = null;
        }

        const notFoundUsers = [];
        for (const user of users) {
          const userFound = userChannels.filter(x=>x.name == user);
          if (userFound.length == 0) {
            notFoundUsers.push(user);
          }
        }
        if (notFoundUsers.length > 0) {
          await excel.ApplyToGoogleExcel([[`users: ${notFoundUsers.join(',')} not found`]],
            'AlertLevels', null, 'I' + rowIndex);
            continue;
        }

        await models.alertConfigurations.upsert({
          rowIndex,
          chain,
          farm,
          pool,
          minutesBeforeToCheck,
          condition,
          isActive,
          message,
          users
        }, {
          rowIndex
        });

        await excel.ApplyToGoogleExcel([['']], 'AlertLevels', null, 'I' + rowIndex );

      } catch (err) {

        try {
          await excel.ApplyToGoogleExcel([[`${JSON.stringify(err, Object.getOwnPropertyNames(err))}`]],
            'AlertLevels', null, 'I' + rowIndex);
        } catch (ierr) {
          logger.error(`row sync exception: ${JSON.stringify(err, Object.getOwnPropertyNames(ierr))}`, serviceName);
        }
      }

    }

    // Notify of sync
    let lastUpdated = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    lastUpdated = lastUpdated.substr(5, lastUpdated.length - 5);
    await excel.ApplyToGoogleExcel([[lastUpdated]], 'AlertLevels', null, 'B1')


  } catch (err) {
    await excel.ApplyToGoogleExcel([[err]], 'AlertLevels', null, 'C1')
    logger.error(`${JSON.stringify(err, Object.getOwnPropertyNames(err))}`, serviceName);
  }

};


function start() {
  module.exports.execute();
}

module.exports.start = function () {
  logger.log(`[CRON] starting ${serviceName}`, serviceName);
  module.exports.job = new CronJob('*/3 * * * *', start);
  module.exports.job.start();
  module.exports.execute();
};
