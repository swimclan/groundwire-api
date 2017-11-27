'use strict';
var Model = require('../lib/Model');
var Logger = require('../lib/Logger');
var Sequelize = require('sequelize');

const logger = Logger.getInstance();

class Preference extends Model {
  constructor(db, name='preference') {
    super(db, name);
    this.schema({
      c: {
        type: Sequelize.FLOAT
      },
      stopMargin: {
        type: Sequelize.FLOAT
      },
      minStop: {
        type: Sequelize.FLOAT
      },
      maxSpread: {
        type: Sequelize.FLOAT
      },
      strategy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'strategies',
          key: 'id',
          deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        }
      },
      profitLockEnabled: {
        type: Sequelize.BOOLEAN
      },
      profitLock: {
        type: Sequelize.FLOAT
      },
      exclusions: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      screenerMax: {
        type: Sequelize.INTEGER
      },
      screenerRanges: {
        type: Sequelize.STRING
      },
      screenerFilters: {
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

module.exports = Preference;