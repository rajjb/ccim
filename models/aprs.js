const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const entity = sequelize.define('aprs', {
    id:{
      primaryKey: true,
      type: DataTypes.INTEGER,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },   
    rewardName: {
      type: DataTypes.STRING,
      allowNull: false
    },   
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    tvl: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    staked: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    aprDay: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    aprWeek: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    aprYear: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    alertTriggered: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  });

  entity.associate = (models) => {
    entity.belongsTo(models.farms, {
      foreignKey: {
        name: 'farmId',
        allowNull: false,
      },
      onDelete: 'RESTRICT',
    })
  };

  entity.upsert = (values, condition) => (
    entity.findOne({ where: condition })
      .then((obj) => {
        if (obj) {
          return obj.update(values);
        }
        return entity.create(values);
      })
  );

  return entity;
}
