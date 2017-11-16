'use strict';
var Logger = require('./Logger');

const logger = Logger.getInstance();

class Model {
  constructor(db, name) {
    this.name = name;
    this.db = db.getInstance().sql;
    this.model = {};
  }
  schema(schema) {
    this.model = this.db.define(this.name, schema);
    this.model.attributes = Object.keys(schema);
    this.model.sync({force: false});
  }
}

module.exports = Model;