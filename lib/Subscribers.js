'use strict';
var _ = require('lodash');
var Events = require('./Events');

let emitter = Events.getInstance();

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
    set(id, prop, val) {
        for (var i in this.active) {
            if (this.active[i].id === id) {
                this.active[i][prop] = val;
            }
        }
    }
    on(event, handler) {
        emitter.on(event, handler);
    }
    trigger(event, data) {
        emitter.emit(event, data);
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
