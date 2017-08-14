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
var Logger = require('./Logger');

try {
	var userCreds = require('../credentials/robinhood');
} catch (e) {
	var userCreds;
}

let logger = Logger.getInstance({enabled: process.env.LOGGER == 1});

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
		logger.log('Instrument fetch', 'Getting instrument from url:', {url: instUrl});
		rh.url(instUrl, function(err, response, instrument) {
			if (err) {
				logger.log('ERROR!', 'Error fetching instrument from URL', {error: err});
				reject(err);
			}
			logger.log('Instrument fetch', 'Successfully fetched instrument from URL', instrument);
			resolve(instrument);
		});
	});
}

module.exports.getInstrumentFromTicker = function(rh, ticker) {
	return new Promise(function(resolve, reject) {
		logger.log('Instrument fetch', 'Getting instrument from ticker:', {ticker: ticker});
		rh.instruments(ticker, function(err, response, instrument) {
			if (err) {
				logger.log('ERROR!', 'Error fetching instrument from ticker', {error: err});
				reject(err);
			}
			var retInst = null;
			instrument.results.forEach(function(inst) {
				if (inst.symbol === ticker) {
					retInst = inst;		
				}
			});
			logger.log('Instrument fetch', 'Successfully fetched instrument from ticker', retInst);
			resolve(retInst);
		});
	});
}

module.exports.placeBuy = function(rh, options) {
	logger.log('Trade', 'About to place buy order with options:', options);
	return new Promise(function(resolve, reject) {
		rh.place_buy_order(options, function(error, response, body) {
			if (error) {
				logger.log('ERROR!', 'Error placing buy order', {error: error});
				reject(error);
			} else {
				logger.log('Trade', 'Successfully executed buy order placement', body);
				resolve(body);
			}
		});
	});
}

module.exports.placeSell = function(rh, options) {
	logger.log('Trade', 'About to place sell order with options:', options);
	return new Promise(function(resolve, reject) {
		rh.place_sell_order(options, function(error, response, body) {
			if (error) {
				logger.log('ERROR!', 'Error placing sell order', {error: error});
				reject(error);
			} else {
				logger.log('Trade', 'Successfully executed sell order placement', body);
				resolve(body);
			}
		});
	});
}

module.exports.getAccounts = function(rh) {
	return new Promise(function(resolve, reject) {
		logger.log('Accounts', 'About to fetch account information');	
		rh.url('https://api.robinhood.com/accounts/', function(err, response, account) {
			if (err) {
				logger.log('ERROR!', 'Error fetching account information', {error: err});
				reject(err);
			}
			logger.log('Accounts', 'Successfully retrieved log information:', account);
			resolve(account);
		});
	});
}

module.exports.getPositions = function(rh) {
	var self = this;
	logger.log('Positions', 'About to retrieve positions');
	return new Promise(function(resolve, reject) {
		self.getAccounts(rh)
		.then(function(accounts) {
			var result = accounts.results[0];
			var positionsUrl = result.positions;
			var retPositions = [];
			rh.url(positionsUrl, function(err, response, positions) {
				if (err) {
					logger.log('ERROR!', 'Failed to fetch positions with error:', {error: err});
				}
				let retPositions = positions.results.filter(function(position) {
					return position.quantity > 0;
				});
				logger.log('Positions', `Successfully retrieved ${retPositions.length} positions:`, retPositions);
				resolve(retPositions);
			});
		})
		.catch(function(err) {
			logger.log('ERROR!', 'Failed to fetch positions with error:', {error: err});
			reject(err);
		});
	});
}

module.exports.getUser = function(rh) {
	logger.log('User info', 'About to fetch user info for current user');
	return new Promise(function(resolve, reject) {
		rh.user(function(err, response, user) {
			if (err) {
				logger.log('ERROR!', 'Failed to fetch user info with error:', {error: err});
				reject(err);
			}
			user.auth_token = rh.auth_token();
			logger.log('User info', 'Successfully fetched user info for:', user);
			resolve(user);
		});
	});
}

module.exports.getWatchList = function(rh) {
	logger.log('Watchlist', 'About to fetch user watchlist');
	return new Promise(function(resolve, reject) {
		rh.watchlists(function(err, response, body) {
			if (err) {
				logger.log('ERROR!', 'Failed to fetch watchlist with error:', {error: err});
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
					logger.log('ERROR!', 'Failed to fetch watchlist with error:', {error: err});
					reject(err);
				}
				logger.log('Watchlist', 'Successfully fetched watchlist:', body);
				resolve(body);
			});
		});
	});
}

module.exports.getProfile = function(rh) {
	logger.log('Investor profile', 'About to fetch investor profile');
	return new Promise(function(resolve, reject) {
		rh.investment_profile(function(err, response, body) {
			if (err) {
				logger.log('ERROR!', 'Failed to fetch investor profile with error:', {error: err});
				reject(err);
			}
			resolve(body);
			logger.log('Investor profile','Successfully fetched investor profile:', body);
		});
	});
}

module.exports.getPrice = function(rh, ticker) {
	logger.log('Price', 'About to fetch price for ticker:', {ticker: ticker});
	return new Promise(function(resolve, reject) {
		rh.quote_data(ticker, function(error, response, body) {
			if (error || !body) {
				logger.log('ERROR!', 'Failed to get price with error:', {error: error});
				return reject(error ? error : { message: "No instrument found" }); 
			}
			var priceResults = body.results;
			var retPrice = null;
			priceResults.forEach(function(result) {
				if (result.symbol === ticker) {
					retPrice = result;
				}
			});
			logger.log('Price', 'Successfully fetched price data:', retPrice);
			resolve(retPrice);
		});
	});
}

module.exports.findOrdersByInstrument = function(rh, state, instrumentId) {
	logger.log('Orders', `Attempting to fetch ${state} orders for ${instrumentId ? instrumentId : 'All instruments'}`);
	return new Promise(function(resolve, reject) {
		rh.orders(function(err, response, body) {
			if (err) {
				logger.log('ERROR!', 'Failed to fetch orders with error:', {error: err});
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
						logger.log('ERROR!', 'Failed to fetch orders with error:', {error: err});
						reject(err);
					}
					var instUrl = utils.buildInstrumentUrl(instrumentId);
					var queued;
					if (ret) {
						queued = instrumentId ? 
						ret.filter(function(order) { return order.state === state && order.instrument === instUrl }) :
						ret.filter(function(order) { return order.state === state });
						logger.log('Orders', `Successfully fetched ${queued.length} orders`, queued);
					} else {
						logger.log('WARNING!', 'No orders were found or something failed on fetch and got undefined/empty set');
						queued = [];
					}
					resolve(queued);
				}
			);
		});
	});
}

module.exports.findQueuedSellOrderByInstrument = function(rh, instrumentId, trigger) {
	logger.log('Sell Orders', `About to fetch ${trigger} sell orders with instrument id: ${instrumentId}`);
	return new Promise(function(resolve, reject) {
		rh.orders(function(err, response, body) {
			if (err) {
				logger.log('ERROR!', 'Failed to fetch sell orders', {error: err});
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
							logger.log('ERROR!', 'Failed to fetch sell orders', {error: err});
							return callback(err);
						}
						orders = page.results;
						nextCursorUrl = page.next;
						foundQueuedStop = utils.findQueuedSell(orders, instrumentId, trigger);
						callback();
					});
				},
				function(err) {
					if (err) {
						logger.log('ERROR!', 'Failed to fetch sell orders', {error: err});
						reject(err);
					}
					logger.log('Sell Orders', 'Successfully fetched queued sell order:', foundQueuedStop ? foundQueuedStop : {});
					resolve(foundQueuedStop ? foundQueuedStop : {});
				}
			);
		});
	});
}

module.exports.cancelQueuedStopSell = function(rh, instrumentId) {
	logger.log('Cancel', 'About to cancel queued stop sell orders for instrument id:', {instrument: instrumentId});
	var self = this;
	return new Promise(function(resolve, reject) {
		self.findQueuedSellOrderByInstrument(rh, instrumentId, 'stop')
		.then(function(order) {
			var targetOrder = order;
			rh.cancel_order(targetOrder, function(err, response, body) {
				if (err) {
					logger.log('ERROR!', 'Failed to cancel queued stop sell orders with error:', {error: err});
					return reject(err);
				}
				logger.log('Cancel', 'Successfully cancelled stop sell orders: ', body);
				return resolve(body);
			});
		})
		.catch(function(err) {
			logger.log('ERROR!', 'Failed to cancel queued stop sell orders with error:', {error: err});
			return reject(err);
		});
	});
}

module.exports.cancelQueuedMarketSell = function(rh, instrumentId) {
	logger.log('Cancel', 'About to cancel queued market sell orders for instrument id:', {instrument: instrumentId});
	var self = this;
	return new Promise(function(resolve, reject) {
		self.findQueuedSellOrderByInstrument(rh, instrumentId, 'immediate')
		.then(function(order) {
			var targetOrder = order;
			rh.cancel_order(targetOrder, function(err, response, body) {
				if (err) {
					logger.log('ERROR!', 'Failed to cancel queued market sell orders with error:', {error: err});
					return reject(err);
				}
				logger.log('Cancel', 'Successfully cancelled market sell orders: ', body);
				return resolve(body);
			});
		})
		.catch(function(err) {
			logger.log('ERROR!', 'Failed to cancel queued market sell orders with error:', {error: err});
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
