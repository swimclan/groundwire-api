'use strict';
var Model = require('../lib/Model');
var Logger = require('../lib/Logger');
var Sequelize = require('sequelize');

const logger = Logger.getInstance();

class User extends Model {
    constructor(sql, name='user') {
        super(sql, name);
        this.schema({
            firstName: {
                type: Sequelize.STRING
            },
            lastName: {
                type: Sequelize.STRING
            },
            emailAddress: {
                type: Sequelize.STRING
            },
            password: {
                type: Sequelize.STRING
            }
        });
    }
}

module.exports = User;
