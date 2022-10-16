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
        fn: "createTable",
        params: [
            "poolConfigurations",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "farmName": {
                  "type": Sequelize.STRING,
                  "field": "farmName"
                },
                "chain": {
                  "type": Sequelize.STRING,
                  "field": "chain"
                },
                "poolName": {
                    "type": Sequelize.STRING,
                    "field": "poolName"
                },
                "tvlPercent": {
                    "type": Sequelize.DECIMAL,
                    "field": "tvlPercent",
                    "allowNull": false
                },
                "aprYearPercent": {
                    "type": Sequelize.DECIMAL,
                    "field": "aprYearPercent"
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
    up: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            function next() {
                if (index < migrationCommands.length)
                {
                    let command = migrationCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
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
