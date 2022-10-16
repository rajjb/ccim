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
    "revision": 3,
    "name": "aprs",
    "created": "2021-08-25T12:48:34.155Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "dropTable",
        params: ["aprs"]
    }, {
        fn: "createTable",
        params: [
            "aprs",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "farmId": {
                  "type": Sequelize.INTEGER,
                  "field": "farmId",
                  "onUpdate": "CASCADE",
                  "onDelete": "RESTRICT",
                  "references": {
                      "model": "farms",
                      "key": "id"
                  },
                  "allowNull": false,
                  "name": "farmId"
                },
                "name": {
                    "type": Sequelize.STRING,
                    "field": "name",
                    "allowNull": false
                },
                "rewardName": {
                    "type": Sequelize.STRING,
                    "field": "rewardName",
                    "allowNull": false
                },
                "date": {
                    "type": Sequelize.DATE,
                    "field": "date"
                },
                "price": {
                  "type": Sequelize.DECIMAL,
                  "field": "price"
                },
                "tvl": {
                  "type": Sequelize.DECIMAL,
                  "field": "tvl"
                },
                "staked": {
                  "type": Sequelize.DECIMAL,
                  "field": "staked"
                },
                "aprDay": {
                  "type": Sequelize.DECIMAL,
                  "field": "aprDay"
                },
                "aprWeek": {
                  "type": Sequelize.DECIMAL,
                  "field": "aprWeek"
                },
                "aprYear": {
                  "type": Sequelize.DECIMAL,
                  "field": "aprYear"
                },
                "alertTriggered": {
                    "type": Sequelize.BOOLEAN,
                    "field": "alertTriggered"
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
