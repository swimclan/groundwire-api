'use strict';

var Robinhood = require('robinhood');
var async = require('async');
var utils = require('./utils');
var _ = require("lodash");
var request = require('request');
var queryString = require('query-string');
var config = require('../config');
var cheerio = require('cheerio');
var parser = require('xml2json');
var moment = require('moment');

try {
	var userCreds = require('../credentials/robinhood');
} catch (e) {
	var userCreds;
}

/* HELPERS */
let checkCreds = function(creds) {
	if (!_.isUndefined(userCreds)) {
		return userCreds;
	} else {
		return creds;
	}
}

let serializeCalendar = function(calObj) {
	var ret = [], datestamp, holiday;
	calObj.forEach((item) => {
		datestamp = item.td[0].$t;
		holiday = item.td[3];
		ret.push({date: moment(datestamp, "MMM/D").utc(), holiday: holiday});
	});
	return ret;
}

/* EXPORTS */
module.exports.buildOrderOptions = function(instrument, quantity, price, stopOptions) {
	var self = this;
	var options = {
		type: "market",
		time_in_force: "gfd",
		bid_price: instrument.min_tick_size ? utils.moneyify(utils.roundDown(price, parseFloat(instrument.min_tick_size))) : utils.moneyify(price),
		quantity: quantity,
		instrument: { url: instrument.url }
	};
	options.instrument.symbol = instrument.symbol;
	if (!stopOptions) {
		options.trigger = "immediate";
	} else {
		options.stop_price = stopOptions.price;
		options.trigger = "stop";
	}
	return options
}

module.exports.getInstrumentFromUrl = function(rh, instrumentId) {
	return new Promise(function(resolve, reject) {
		var instUrl = utils.buildInstrumentUrl(instrumentId);
		console.log(`Getting instrument from ${instUrl}`);
		rh.url(instUrl, function(err, response, instrument) {
			if (err) {
				console.log(err);
				reject(err);
			}
			resolve(instrument);
		});
	});
}

module.exports.getInstrumentFromTicker = function(rh, ticker) {
	return new Promise(function(resolve, reject) {
		rh.instruments(ticker, function(err, response, instrument) {
			if (err) {
				console.log(err);
				reject(err);
			}
			var retInst = null;
			instrument.results.forEach(function(inst) {
				if (inst.symbol === ticker) {
					retInst = inst;		
				}
			});
			resolve(retInst);
		});
	});
}

module.exports.placeBuy = function(rh, options) {
	return new Promise(function(resolve, reject) {
		rh.place_buy_order(options, function(error, response, body) {
			if (error) {
				console.error(error);
				reject(error);
			} else {
				resolve(body);
			}
		});
	});
}

module.exports.placeSell = function(rh, options) {
	return new Promise(function(resolve, reject) {
		rh.place_sell_order(options, function(error, response, body) {
			if (error) {
				console.log(error);
				reject(error);
			} else {
				resolve(body);
			}
		});
	});
}

module.exports.getAccounts = function(rh) {
	return new Promise(function(resolve, reject) {		
		rh.url('https://api.robinhood.com/accounts/', function(err, response, account) {
			if (err) {
				console.log(err);
				reject(err);
			}
			resolve(account);
		});
	});
}

module.exports.getPositions = function(rh) {
	var self = this;
	return new Promise(function(resolve, reject) {
		self.getAccounts(rh)
		.then(function(accounts) {
			var result = accounts.results[0];
			var positionsUrl = result.positions;
			var retPositions = [];
			rh.url(positionsUrl, function(err, response, positions) {
				resolve(positions.results.filter(function(position) {
					return position.quantity > 0;
				}));
			});
		})
		.catch(function(err) {
			console.log(err);
			reject(err);
		});
	});
}

module.exports.getUser = function(rh) {
	return new Promise(function(resolve, reject) {
		rh.user(function(err, response, user) {
			if (err) {
				console.log(err);
				reject(err);
			}
			user.auth_token = rh.auth_token();
			resolve(user);
		});
	});
}

module.exports.getWatchList = function(rh) {
	return new Promise(function(resolve, reject) {
		rh.watchlists(function(err, response, body) {
			if (err) {
				console.log(err);
				return reject(err);
			}
			var results = body.results;
			var listUrl = null;
			results.forEach(function(result) {
				if (result.name === "Default") {
					listUrl = result.url;
				}
			});
			rh.url(listUrl, function(err, response, body) {
				if (err) {
					console.log(err);
					reject(err);
				}
				resolve(body);
			});
		});
	});
}

module.exports.getProfile = function(rh) {
	return new Promise(function(resolve, reject) {
		rh.investment_profile(function(err, response, body) {
			if (err) {
				console.log(err);
				reject(err);
			}
			resolve(body);
		});
	});
}

module.exports.getPrice = function(rh, ticker) {
	return new Promise(function(resolve, reject) {
		rh.quote_data(ticker, function(error, response, body) {
			if (error || !body) {
				console.error(error ? error : "No instrument found");
				return reject(error ? error : { message: "No instrument found" }); 
			}
			var priceResults = body.results;
			var retPrice = null;
			priceResults.forEach(function(result) {
				if (result.symbol === ticker) {
					retPrice = result;
				}
			});
			resolve(retPrice);
		});
	});
}

module.exports.findOrdersByInstrument = function(rh, state, instrumentId) {
	return new Promise(function(resolve, reject) {
		rh.orders(function(err, response, body) {
			if (err) {
				console.log(err);
				reject(err);
			}
			var retOrders = body.results;
			var nextCursorUrl = body.next;
			async.whilst(
				function() { return nextCursorUrl !== null },
				function(callback) {
					rh.url(nextCursorUrl, function(err, response, orders) {
						if (err) {
							callback(err, null);
						}
						retOrders = retOrders.concat(orders.results);
						nextCursorUrl = orders.next;
						callback(null, retOrders);
					});
				},
				function(err, ret) {
					if (err) {
						console.log(err);
						reject(err);
					}
					var instUrl = utils.buildInstrumentUrl(instrumentId);
					var queued = instrumentId ? 
						ret.filter(function(order) { return order.state === state && order.instrument === utils.buildInstrumentUrl(instrumentId) }) :
						ret.filter(function(order) { return order.state === state });
					resolve(queued);
				}
			);
		});
	});
}

module.exports.findQueuedSellOrderByInstrument = function(rh, instrumentId, trigger) {
	return new Promise(function(resolve, reject) {
		rh.orders(function(err, response, body) {
			if (err) {
				console.log(err);
				reject(err);
			}
			let orders = body.results;
			let nextCursorUrl = body.next;
			var foundQueuedStop = utils.findQueuedSell(orders, instrumentId, trigger);
			if (foundQueuedStop) return resolve(foundQueuedStop);
			async.whilst(
				function() { return !foundQueuedStop && nextCursorUrl !== null  },
				function(callback) {
					rh.url(nextCursorUrl, function(err, response, page) {
						if (err) {
							return callback(err);
						}
						orders = page.results;
						nextCursorUrl = page.next;
						console.log(nextCursorUrl);
						foundQueuedStop = utils.findQueuedSell(orders, instrumentId, trigger);
						callback();
					});
				},
				function(err) {
					if (err) {
						console.log(err);
						reject(err);
					}
					resolve(foundQueuedStop ? foundQueuedStop : {});
				}
			);
		});
	});
}

module.exports.cancelQueuedStopSell = function(rh, instrumentId) {
	var self = this;
	return new Promise(function(resolve, reject) {
		self.findQueuedSellOrderByInstrument(rh, instrumentId, 'stop')
		.then(function(order) {
			var targetOrder = order;
			rh.cancel_order(targetOrder, function(err, response, body) {
				if (err) {
					console.log(err);
					return reject(err);
				}
				return resolve(body);
			});
		})
		.catch(function(err) {
			console.log(err);
			return reject(err);
		});
	});
}

module.exports.cancelQueuedMarketSell = function(rh, instrumentId) {
	var self = this;
	return new Promise(function(resolve, reject) {
		self.findQueuedSellOrderByInstrument(rh, instrumentId, 'immediate')
		.then(function(order) {
			var targetOrder = order;
			rh.cancel_order(targetOrder, function(err, response, body) {
				if (err) {
					console.log(err);
					return reject(err);
				}
				return resolve(body);
			});
		})
		.catch(function(err) {
			console.log(err);
			return reject(err);
		});
	});
}

module.exports.getYahooPrice = function(ticker) {
	var quote_root = config.get('yahoo.url.root');
	var yql = config.get(`yahoo.url.query,${ticker}`);
	var quote_params = {
		q: yql,
		diagnostics: config.get('yahoo.url.diagnostics'),
		env: config.get('yahoo.url.env'),
		format: config.get('yahoo.url.format')
	};
	var url = quote_root + queryString.stringify(quote_params);
	return new Promise(function(resolve, reject) {
		request({url: url}, function(err, response, body) {
			if (err) {
				reject(err);
			}
			try {
				var tradeTimeAndPrice = JSON.parse(body).query.results.quote.LastTradeWithTime;
				var price = tradeTimeAndPrice.match(/\<.\>(\d+\.\d+)\<\S*$/);
				var time = tradeTimeAndPrice.match(/(^\d*\:\d*[pa]m)/);
				resolve({price: parseFloat(price[1]), time: time[1]});
			} catch (e) {
				reject(e);
			}
		});
	});
}

module.exports.getTECalendarPage = function() {
	var calendarUrl = config.get('tradingEconomics.url.root');
	return new Promise((resolve, reject) => {
		request.get({ url: calendarUrl }, function(err, response, page) {
			if (err) return reject(err);
			let $ = cheerio.load(page);
			return resolve($);
		});
	});
}

module.exports.parseCalendar = function() {
	let self = this;
	return new Promise((resolve, reject) => {
		self.getTECalendarPage()
		.then(($) => {
			resolve($('#calendar'));
		}).catch((err) => { reject(err) });
	});
}

module.exports.getCalendar = function() {
	let self = this;
	return new Promise((resolve, reject) => {
		self.parseCalendar()
		.then(($calendar) => {
			let calHtml = $calendar.html();
			let calJson = parser.toJson(calHtml);
			let cal = JSON.parse(calJson);
			resolve(serializeCalendar(cal.tbody.tr));
		}).catch((err) => { reject(err) });
	});
}
