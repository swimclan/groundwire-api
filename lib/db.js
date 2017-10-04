var Sequelize = require('sequelize');
var config = require('../config');
var _has = require('lodash').has;
var Logger = require('../lib/Logger');

let logger = Logger.getInstance();

class DB {
    constructor(options={}) {
        this.connection = new Object();
        if (
            _has(options, 'host') &&
            _has(options, 'port') &&
            _has(options, 'dbname') &&
            _has(options, 'user') &&
            _has(options, 'pass')
        ) {
            this.connection.host = options.host;
            this.connection.port = options.port;
            this.connection.dbname = options.dbname;
            this.connection.user = options.user;
            this.connection.pass = options.pass;
        } else {
            logger.log('ERROR!', 'Invalid connection params sent.  Cannot connect DB!', '');
            throw new Error('Invalid connection params sent.  Cannot connect DB!');
        }
        return this;
    }
    connect() {
        return new Promise((resolve, reject) => {
            this.sql = new Sequelize(`postgres://${this.connection.user}:${this.connection.pass}@${this.connection.host}:${this.connection.port}/${this.connection.dbname}`);
            this.sql.authenticate()
            .then(() => {
                logger.log('DB', 'DB connection successful!', {});
                resolve(this.sql);
            })
            .catch((err) => {
                logger.log('ERROR!', 'DB connection failed', {error: err});
                reject(err);
            });
        });        
    }
}

let instance;

module.exports.getInstance = function(options={}) {
    if (!instance) {
        let db = new DB(options);
        instance = db;
    }
    return instance;
}
