'use strict';
var Robinhood = require('robinhood');

class RH {
    constructor() {
        this.instance;
    }
    authenticate(creds) {
        return new Promise((resolve, reject) => {
            let rh = Robinhood(creds, () => {
                this.instance = rh;
                resolve(this);
            });
        });
    }
}

module.exports = RH;