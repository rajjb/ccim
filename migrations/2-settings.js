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
    "revision": 2,
    "name": "settings",
    "created": "2021-08-25T07:48:34.155Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "settings",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "key": {
                    "type": Sequelize.STRING,
                    "field": "key",
                    "allowNull": false
                },
                "value": {
                    "type": Sequelize.STRING,
                    "field": "value",
                    "allowNull": false
                }
            },
            {}
        ]
    }, {
        fn: "createTable",
        params: [
            "errorLogs",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "module": {
                    "type": Sequelize.STRING,
                    "field": "module",
                    "allowNull": false
                },
                "text": {
                    "type": Sequelize.TEXT,
                    "field": "text"
                },
                "times": {
                  "type": Sequelize.INTEGER,
                  "field": "times"
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
