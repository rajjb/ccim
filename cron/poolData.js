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


async function processFarms() {
  const existingFarms = await models.farms.findAll();

  // farmer-John will return the infos...
  const aprs = [];

  const fiveMinTime = 1000 * 60 * 5;
  let date = new Date();
  date = new Date(Math.floor(date.getTime() / fiveMinTime) * fiveMinTime)
  // date.setHours(date.getHours(), date.getMinutes(), 0, 0);

  const frms = farms();
  for (const frm of frms) {
    // todo: need in parallel here.
    for (const name of frm.files) {
      try {
        let existingFarm = existingFarms.filter(x => x.chain === frm.chain && x.name === name);

        if (existingFarm.length === 0) {
          existingFarm = await models.farms.create({
            name,
            chain: frm.chain,
            isActive: true
          });
          existingFarms.push(existingFarm);
        } else {
          existingFarm = existingFarm[0];
        }

        if (existingFarm.isActive) {
          const infos = await require(`../farmer-john/${existingFarm.chain}/${name}.js`)();
          for (const info of infos.infos.filter(x => x != null)) {
            aprs.push({
              date,
              farmId: existingFarm.id,
              name: info.name || '',
              rewardName: info.rewardName || '',
              price: info.price || 0,
              tvl: info.tvl || 0,
              staked: info.staked || 0,
              aprDay: info.aprDay || (info.aprYear / 365) || 0,
              aprWeek: info.aprWeek || (info.aprYear / 52.1429) || 0,
              aprYear: info.aprYear || 0,
              alertTriggered: false
            });
          }
        }
      } catch (err) {
        console.error(`An error has occurred while processing ${frm.chain} ${name}`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
      }
    }
  }

  await models.aprs.bulkCreate(aprs);
}

async function processAlerts() {

  logger.log('Checking for Alerts');
  const farms = await models.farms.findAll();

  let alertConfigurations = await models.alertConfigurations.findAll({ where: { isActive: true } });
  alertConfigurations = alertConfigurations.filter(x => x.users.length > 0);

  if (alertConfigurations.length === 0) {
    return;
  }

  const userChannels = await models.userChannels.findAll();

  // get the last entries
  let latestEntries = await getlatestEntries();
  latestEntries = latestEntries.filter(x => !x.alertTriggered);
  if (latestEntries.length === 0) {
    return;
  }

  for (const conf of alertConfigurations) {
    for (const latestEntry of latestEntries) {

      if (!(conf.farm == null || conf.farm.toLowerCase() === 'all' || conf.farm === '')) {
        if (latestEntry.farm != conf.farm) {
          continue;
        }
      }
      if (!(conf.chain == null || conf.chain.toLowerCase() === 'all' || conf.chain === '')) {
        if (latestEntry.chain != conf.chain) {
          continue;
        }
      }
      if (!(conf.pool == null || conf.pool.toLowerCase() === 'all' || conf.pool === '')) {
        if (latestEntry.pool != conf.pool) {
          continue;
        }
      }

      const dateBefore = new Date(latestEntry.date.getTime() - conf.minutesBeforeToCheck * 60000);
      const where = {
        date: { $lte: dateBefore }
      };
      let entryToCompare = await models.aprs.findAll(
        {
          where,
          order: [
            ['date', 'DESC']
          ],
          limit: 1
        }
      );

      if (entryToCompare.length > 0) {
        entryToCompare = entryToCompare[0];

        const triggered = verifyCondition(entryToCompare, latestEntry, conf, farms);
        if (triggered.result) {
          for (const user of conf.users) {
            let channel = userChannels.filter(x => x.name == user);
            if (channel.length > 0) {
              channel = channel[0];
              telegram.sendMessage(triggered.message, channel.channelId);
            }
          }
          latestEntry.alertTriggered = true;
          await latestEntry.save();
        }
      }
    }
  }
}

function verifyCondition(entryToCompare, latestEntry, conf, farms) {
  const pprice = entryToCompare.price;
  const ptvl = entryToCompare.ptvl;
  const pstaked = entryToCompare.staked;
  const papy = entryToCompare.aprYear;

  const price = latestEntry.price;
  const tvl = latestEntry.ptvl;
  const staked = latestEntry.staked;
  const apy = latestEntry.aprYear;

  const priceChange = (price - pprice) / pprice;
  const tvlChange = (tvl - ptvl) / ptvl;
  const stakedChange = (staked - pstaked) / pstaked;
  const apyChange = (apy - papy) / papy;

  const abs = Math.abs;
  const response = {};
  response.result = eval(conf.condition);
  response.message = '';

  if (response.result) {

    let message = conf.name;
    message = message.replaceAll('{pprice}', pprice);
    message = message.replaceAll('{ptvl}', ptvl);
    message = message.replaceAll('{pstaked}', pstaked);
    message = message.replaceAll('{papy}', papy);
    message = message.replaceAll('{price}', price);
    message = message.replaceAll('{tvl}', tvl);
    message = message.replaceAll('{staked}', staked);
    message = message.replaceAll('{apy}', apy);
    message = message.replaceAll('{priceChange}', priceChange);
    message = message.replaceAll('{tvlChange}', tvlChange);
    message = message.replaceAll('{stakedChange}', stakedChange);
    message = message.replaceAll('{apyChange}', apyChange);

    const farm = farms.filter(x => x.id == latestEntry.farmId);
    message = message.replaceAll('{chain}', farm.chain);
    message = message.replaceAll('{farm}', farm.name);
    message = message.replaceAll('{pool}', latestEntry.name);

    response.message = message;
  }

  return response;

}


async function getlatestEntries() {
  let lastEntry = await models.aprs.findAll(
    {
      order: [
        ['date', 'DESC']
      ],
      limit: 1
    }
  );

  if (lastEntry.length === 0) {
    return [];
  } else {
    lastEntry = lastEntry[0];
  }

  const entries = await models.aprs.findAll({ where: { date: lastEntry.date } });

  return entries;
}

async function applyLatestExcelEntries() {

  logger.log('Applying Excel');

  const farms = await models.farms.findAll();

  entries = await getlatestEntries();

  const data = [];
  for (const entry of entries.sort((a, b) => a.aprYear > b.aprYear ? -1 : 1)) {

    let farm = farms.filter(x => x.id == entry.farmId);
    farm = farm[0];


    const row = [];
    row.push(farm.chain);
    row.push(farm.name);
    row.push(entry.name);
    row.push(entry.rewardName);
    row.push(entry.price);
    row.push(entry.tvl);
    row.push(entry.staked);
    row.push(entry.aprDay);
    row.push(entry.aprWeek);
    row.push(entry.aprYear);

    data.push(row);
  }

  const emptyRow = [];
  for (const col of Object.keys(data[0])) {
    emptyRow.push('');
  }

  const emptyData = [];
  for (let i = 0; i < 10000; i++) {
    emptyData.push(emptyRow);
  }

  await excel.ApplyToGoogleExcel(emptyData, 'Latest', null, 'A3');
  await excel.ApplyToGoogleExcel(data, 'Latest', null, 'A3');

  let lastUpdated = new Date().toISOString();
  lastUpdated = lastUpdated.substr(5, lastUpdated.length - 5);
  await excel.ApplyToGoogleExcel([[lastUpdated]], 'Latest', null, 'B1');


}

module.exports.execute = async function () {

  try {

    if (module.exports.isServiceEnabled && !(await module.exports.isServiceEnabled(serviceName))) {
      return;
    }

    await processFarms();

    await processAlerts();

    await applyLatestExcelEntries();

  } catch (err) {
    logger.error(`${JSON.stringify(err, Object.getOwnPropertyNames(err))}`, serviceName);
  }

};


function start() {
  module.exports.execute();
}

module.exports.start = function () {
  logger.log(`[CRON] starting ${serviceName}`, serviceName);
  module.exports.job = new CronJob('0 * * * *', start);
  module.exports.job.start();
  module.exports.execute();
  
};
