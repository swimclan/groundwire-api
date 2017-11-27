'use strict';
var Model = require('../lib/Model');
var Logger = require('../lib/Logger');
var Sequelize = require('sequelize');

const logger = Logger.getInstance();

class Strategy extends Model {
  constructor(db, name='strategy') {
    super(db, name);
    this.schema({
      name: {
        type: Sequelize.STRING
      },
      title: {
        type: Sequelize.STRING
      },
      active: {
        type: Sequelize.BOOLEAN
      }
    });
    return this.model;
  }
}

module.exports = Strategy;