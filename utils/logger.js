/* eslint-disable global-require */
/* eslint-disable no-plusplus */

const settingNames = require('../constants/settingNames');
const models = require('../models');

const logger = {};
logger.logType = {
  information: 0,
  warning: 1,
  error: 2
};

logger.log = function (text, module, logType) {
  
  return new Promise(async (resolve) => {
    if (!logType) {
      logType = this.logType.information;
    }
    if (!module) {
      module = '';
    } else {
      module += ':';
    }
    if (!text) {
      return;
    }
    if (!module) {
      module = '';
    }
    // can add time maybe
    console.log(`${module} ${text}`);

    if (logType === logger.logType.error) {
      if (text) {
        text = text.substring(0, 255);
        module = module.substring(0, 255);

        const errorFound = await models.errorLogs.findOne({ where: { text } });
        if (errorFound) {
          errorFound.times++;
          await models.errorLogs.upsert({ times: errorFound.times }, { id: errorFound.id });
        } else {
          await models.errorLogs.create({ text, module, times: 1 });
        }

        const noOfErrorsToKeep = await models.settings.getValue(settingNames.noOfErrorsToKeep, 1000);
        if (noOfErrorsToKeep > 0) {
          let lastPossibleError = await models.errorLogs.findAll({
            attributes: ['id'],
            offset: noOfErrorsToKeep,
            limit: 1,
            order: ['id']
          });

          if (lastPossibleError.length > 0 && lastPossibleError.id > noOfErrorsToKeep) {
            await models.errorLogs.destroy({
              where: { id: { $lt: (lastPossibleError.id || 0) - noOfErrorsToKeep } }
            });
          }

        }
      }
    }

    resolve();
  });

};

logger.error = function (text, module) {
  logger.log(text, module, logger.logType.error);
};

logger.warning = function (text, module) {
  logger.log(text, module, logger.logType.warning);
};

module.exports = logger;
