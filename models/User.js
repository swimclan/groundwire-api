'use strict';
var Model = require('../lib/Model');
var Logger = require('../lib/Logger');
var Sequelize = require('sequelize');
var passportLocalSequelize = require('passport-local-sequelize');

const logger = Logger.getInstance();

class User extends Model {
    constructor(db, name='user') {
        super(db, name);
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
            passwordHash: {
                type: Sequelize.TEXT
            },
            passwordSalt: {
                type: Sequelize.TEXT
            }
        });
        passportLocalSequelize.attachToUser(this.model, {
            usernameField: 'emailAddress',
            hashField: 'passwordHash',
            saltField: 'passwordSalt'
        });
        return this.model;
    }
}

module.exports = User;
