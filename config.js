'use strict';
var utils = require('./lib/utils');

let config = {
    simulate: {
        tickrate: 2000,
        volatility: 0.015,
        spread: {
            mean: 0.02,
            jitter: 0.0075
        },
        last: {
            probability: 0.1
        },
    },
    yahoo: {
        url: {
            root: "http://query.yahooapis.com/v1/public/yql?",
            query: "select * from yahoo.finance.quotes where symbol in ('$t1')",
		    diagnostics: "true",
		    env: "store://datatables.org/alltableswithkeys",
		    format: "json"
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