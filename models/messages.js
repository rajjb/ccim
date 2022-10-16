const { Sequelize, DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const entity = sequelize.define('messages', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    message: {
      type: DataTypes.STRING,
      allowNull: true
    },
    details: {
      type: DataTypes.JSON
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
          //TODO: check if the values passed do create changes to the actual object.
          let hasChanges = false;
          for (const prop of Object.keys(values)) {
            if (obj[prop] != values[prop]) {
              hasChanges = true;
              break;
            }
          }
          if (hasChanges) {
            return obj.update(values);
          }
          return obj;
        }
        return entity.create(values);
      })
  );

  return entity;

};
