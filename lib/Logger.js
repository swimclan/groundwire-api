'use strict';
var _ = require('lodash');

class Logger {
    constructor(options={}) {
        this.enabled = _.has(options, 'enabled') ? options.enabled : true;
    }

    log(title, message, data) {
        if (this.enabled) {
            console.log('-------------------------------------------------------------------------------------------------------');
            console.log(`[LOG]: ${title} - ${message}`);
            console.log(`[TIMESTAMP]: ${new Date().toISOString()}`);
            if (data && typeof data === 'object') {
                console.log('[DATA]');
                console.log(data);
            }
        }
        return true;
    }
}

let instance;

module.exports = {
    getInstance(options) {
        if (!instance) {
            instance = new Logger(options);
        }
        return instance;
    }
}