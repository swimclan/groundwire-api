'use strict';
var Model = require('../lib/Model');
var Logger = require('../lib/Logger');
var Sequelize = require('sequelize');

const logger = Logger.getInstance();

class Token extends Model {
  constructor(db, name='token') {
    super(db, name);
    this.schema({
      authToken: {
        type: Sequelize.STRING
      },
      active: {
        type: Sequelize.BOOLEAN
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
          deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        }
      }
    });
    return this.model;
  }
}

module.exports = Token;
