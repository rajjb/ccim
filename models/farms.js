const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('farms', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    chain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      default: true,
    }
  });
}