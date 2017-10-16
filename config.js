'use strict';
var utils = require('./lib/utils');

let config = {
    requestOrigin: {
        production: {
            subhost: '',
            domain: '127.0.0.1',
            port: 8080
        },
        development: {
            subhost: '',
            domain: '127.0.0.1',
            port: 8080
        }
    },
    session: {
        cookie: {
            expires: 3600000,
            secure: false,
        }
    },
    db: {
        production: {
            host: 'db.groundwire.co',
            port: 5432,
            dbname: 'Groundwire',
        },
        development: {
            host: 'localhost',
            port: 5432,
            dbname: 'Groundwire',
        }
    },
    simulate: {
        tickrate: 2000,
        volatility: 3.5,
        spread: {
            mean: 0.02,
            jitter: 0.0075
        },
        last: {
            probability: 0.1
        },
        direction: 0.45
    },
    yahoo: {
        url: {
            root: "https://query2.finance.yahoo.com/v7/finance/quote?",
            formatted: true,
            lang: 'en-US',
            region: 'US'
        }
    },
    tradingEconomics: {
        url: {
            root: "https://tradingeconomics.com/united-states/holidays"
        }
    }
}

module.exports.get = function(path) {
    let params = path.indexOf(',') !== -1 ? path.split(',') : [path];
    var ret = utils.parseObjectPath(params[0], config);
    if (params.length > 1) {
        var searchRx;
        for (var i=1; i<params.length; i++) {
            searchRx = new RegExp('(\\$t)(' + i + ')');
            ret = ret.replace(searchRx, params[i]);
        }
    }
    return ret;
}