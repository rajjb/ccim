const { Sequelize, DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const entity = sequelize.define('errorLogs', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      autoIncrement: true,
    },
    module: {
      type: DataTypes.STRING
    },
    text: {
      type: DataTypes.TEXT
    },
    times: {
      type: DataTypes.INTEGER
    }
  }, {
    timestamps: true
  });

  entity.upsert = (values, condition) => (
    entity.findOne({
      where: condition
    })
      .then((obj) => {
        if (obj) {
          return obj.update(values);
        }
        return entity.create(values);
      })
  );

  return entity;

};
