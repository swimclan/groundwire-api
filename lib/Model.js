'use strict';
var Logger = require('./Logger');

const logger = Logger.getInstance();

class Model {
    constructor(sql, name) {
        this.name = name;
        this.sql = sql;
        this.model = {};
    }
    schema(schema) {
        this.model = this.sql.define(this.name, schema);
    }
    connect() {
        return new Promise((resolve, reject) => {
            this.model.sync({force: false})
            .then(() => {
                logger.log('Connection', `Connected to the ${this.name} table`, {});
                resolve(this.model)
            })
            .catch((err) => {
                logger.log('ERROR!', `Failed to connect to the ${this.name} table`, {});
                reject(err)
            });
        });
    }
}

module.exports = Model;