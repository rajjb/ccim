const { Sequelize, DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const entity = sequelize.define('alertConfigurations', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      autoIncrement: true,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rowIndex: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    farm: {
      type: DataTypes.STRING,
      allowNull: true
    },
    chain: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pool: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    condition: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    minutesBeforeToCheck: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    users: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false
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
