/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const models = require('../models');
const logger = require('../utils/logger');

const config = require('../config');

const getStatusSettingName = function (fileName) {
  return `service_${fileName}_status`;
};
const isServiceEnabled = async function (fileName) {

  const enabled = await models.settings.getValue(getStatusSettingName(fileName), true);
  return String(enabled).toLowerCase() === 'true';

};

const allServiceNames = [];
let servicesStarted = [];

const startService = function (filename) {
  const cronService = require(`./${filename}`);
  cronService.isServiceEnabled = isServiceEnabled;
  cronService.serviceName = filename;
  try {
    cronService.start();
    servicesStarted.push(cronService);
  } catch (err) {
    logger.error(`Error Starting ${filename}: ${err}`, 'Cron Index');
  }
};

const checkStartStopServices = async function () {

  const settings = await models.settings.findAll();
  // console.log(settings);
  for (const serviceName of allServiceNames) {

    const statusName = getStatusSettingName(serviceName);
    // console.log("statusName:", statusName)
    const foundSetting = settings.filter(x => x.key === statusName);
    if (!foundSetting.length) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const enabled = foundSetting[0].value;
    const existingService = servicesStarted.filter(x => x.serviceName === serviceName);
    if (String(enabled).toLowerCase() === 'true') {
      if (existingService.length === 0) {
        startService(serviceName);
      }
    } else if (existingService.length > 0) {
      logger.log(`Stopping service ${existingService[0].serviceName}`);
      existingService[0].job.stop();
      servicesStarted = servicesStarted.filter(x => x.serviceName !== existingService[0].serviceName);
    }

  }

  setTimeout(checkStartStopServices, 5000);

};


module.exports = async function () {

  try {

    fs.readdirSync(__dirname)
      .filter(file => (file.indexOf('.') !== 0) && (file !== 'index.js'))
      .forEach(async (file) => {

        const filename = file.split('.').slice(0, -1).join('.');
        allServiceNames.push(filename);

        // do not start the service but check if its enabled
        if (await isServiceEnabled(filename)) {
          startService(filename);
        }
      });

    // after the services have started we are going to identify if the setting has changed so we can stop the
    // service
    setTimeout(checkStartStopServices, 5000);

  } catch (err) {
    console.error(err);
    logger.log(`[CRON] server error: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`, serviceName);
  }

};
