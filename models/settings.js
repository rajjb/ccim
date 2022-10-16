const { Sequelize, DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const entity = sequelize.define('settings', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    timestamps: false
  });

  entity.upsert = (values, condition) => (
    entity.findOne({ where: condition })
      .then((obj) => {
        if (obj) {
          return obj.update(values);
        }
        return entity.create(values);
      })
  );

  entity.getByKey = async (key) => {
    return entity.findOne({ where: { key } });
  };

  entity.getValue = async (key, defaultValue) => {
    const result = await entity.findOne({ where: { key } });
    if (result == null) {
      await entity.setValue(key, defaultValue);
      return defaultValue;
    }
    return result.value;
  };
  entity.setValue = async (key, value) => {
    const result = await entity.findOne({ where: { key } });
    if (result == null) {
      await entity.create({
        key,
        value: value.toString()
      });
      return;
    }
    result.value = value.toString();
    result.update({ value: value.toString() });
  };

  entity.get = async () => {
    return entity.findAll();
  };

  return entity;
};
