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
    "name": "messages",
    "created": "2021-09-04T12:48:34.155Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "userChannels",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "name": {
                  "type": Sequelize.STRING,
                  "field": "name"
                },    
                "type": {
                  "type": Sequelize.STRING,
                  "field": "type"
                },  
                "channelId": {
                  "type": Sequelize.STRING,
                  "field": "channelId"
                },   
                "details": {
                  "type": Sequelize.JSON,
                  "field": "details"
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
