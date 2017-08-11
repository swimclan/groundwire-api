'use strict';
var _ = require('lodash');


class Subscribers {
    constructor(options={}) {
        this.active = [];
    }
    add(subscriber) {
        return this.active.push(subscriber);
    }
    remove(id) {
        return this.active =  _.reject(this.active, {id: id});
    }
    all() {
        return this.active;
    }
    get(id) {
        return _.filter(this.active, {id: id});
    }
}

let instance;

module.exports = {
    getInstance(options) {
        if (!instance) {
            instance = new Subscribers(options);
        }
        return instance;
    }
}
