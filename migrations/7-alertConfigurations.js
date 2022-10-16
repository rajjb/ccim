'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "farms", deps: []
 * createTable "aprs", deps: [farms]
 *
 **/

var info = {
  "revision": 1,
  "name": "poolConfigurations",
  "created": "2021-08-27T12:48:34.155Z",
  "comment": ""
};

var migrationCommands = [{
  fn: "dropTable",
  params: ["poolConfigurations"]
}, {
  fn: "createTable",
  params: [
    "alertConfigurations",
    {
      "id": {
        "type": Sequelize.INTEGER,
        "field": "id",
        "autoIncrement": true,
        "primaryKey": true,
        "allowNull": false
      },
      "rowIndex": {
        "type": Sequelize.INTEGER,
        "field": "rowIndex"
      },
      "farm": {
        "type": Sequelize.STRING,
        "field": "farm"
      },
      "chain": {
        "type": Sequelize.STRING,
        "field": "chain"
      },
      "pool": {
        "type": Sequelize.STRING,
        "field": "pool"
      },
      "condition": {
        "type": Sequelize.TEXT,
        "field": "condition"
      },
      "isActive": {
        "type": Sequelize.BOOLEAN,
        "field": "isActive"
      },
      "message": {
        "type": Sequelize.STRING,
        "field": "message"
      },
      "minutesBeforeToCheck": {
        "type": Sequelize.INTEGER,
        "field": "minutesBeforeToCheck"
      },
      "users": {
        "type": Sequelize.ARRAY(Sequelize.STRING),
        "field": "users"
      },
      "createdAt": {
        "type": Sequelize.DATE,
        "field": "createdAt"
      },
      "updatedAt": {
        "type": Sequelize.DATE,
        "field": "updatedAt"
      }
    },
    {}
  ]
}
];

module.exports = {
  pos: 0,
  up: function (queryInterface, Sequelize) {
    var index = this.pos;
    return new Promise(function (resolve, reject) {
      function next() {
        if (index < migrationCommands.length) {
          let command = migrationCommands[index];
          console.log("[#" + index + "] execute: " + command.fn);
          index++;
          queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
        }
        else
          resolve();
      }
      next();
    });
  },
  info: info
};
