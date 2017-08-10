var _ = require('lodash');

class Sessions {
    constructor() {
        this.active = {};
    }
    get(sessionid) {
        return new Promise((resolve, reject) => {
            if (_.has(this.active, sessionid)) {
                resolve(this.active[sessionid]);
            } else {
                reject()
            }
        });
    }

    create(sessionid, options) {
        return new Promise((resolve, reject) => {
            this.active[sessionid] = options;
            resolve(this);
        });
    }

    destroy(sessionid) {
        return new Promise((resolve, reject) => {
            _.unset(this.active, sessionid);
            resolve(this);
        });
    }

    set(sessionid, options) {
        return new Promise((resolve, reject) => {
            _.merge(this.active[sessionid], options);
            resolve(this);
        });
    }

    all() {
        return this.active;
    }
}

module.exports = Sessions;