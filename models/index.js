const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const lodash = require('lodash');
const config = require('../config');

const db = {};
const DBConfig = config.db;
const dbOptions = {
  port: DBConfig.port,
  host: DBConfig.host,
  dialect: DBConfig.dialect,
  logging: DBConfig.logging,
};
dbOptions.pool = DBConfig.pool;
const sequelize = new Sequelize(
  DBConfig.database,
  DBConfig.username,
  DBConfig.password,
  dbOptions
);
fs.readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== 'index.js'))
  .forEach((file) => {
    const sModel = require(path.join(__dirname, file))(sequelize); //eslint-disable-line
    const model = sModel;
    db[model.name] = model;
  });

Object.keys(db)
  .map(name => db[name])
  .filter(model => model.associate)
  .forEach(model => model.associate(db));

sequelize.query = function () {
  // eslint-disable-next-line prefer-rest-params
  return Sequelize.prototype.query.apply(this, arguments).catch((err) => {
    const errStr = err.toString();
    if (errStr.indexOf('ECONNREFUSED') > -1
      || errStr.indexOf('ResourceRequest timed out') > -1
      || errStr.indexOf('ECONNRESET') > -1) {
      console.error('Exiting because of critical error!', err);
      process.exit(1);
    }
    throw err;
  });
};

module.exports = lodash.extend({
  sequelize,
  Sequelize
}, db);
