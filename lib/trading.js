'use strict';

var Robinhood = require('robinhood');
var async = require('async');
var utils = require('./utils');
var _ = require("lodash");
var request = require('request');
var queryString = require('query-string');
try {
	var userCreds = require('../credentials');
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

/* EXPORTS */
module.exports.buildOrderOptions = function(creds, instrumentUrl, quantity, price, stopOptions) {
	let credentials = checkCreds(creds);
	var self = this;
	var options = {
		type: "market",
		time_in_force: "gfd",
		bid_price: price,
		quantity: quantity,
		instrument: { url: instrumentUrl }
	};
	return new Promise(function(resolve, reject) {
		self.getInstrumentFromUrl(credentials, utils.getInstrumentIdFromUrl(instrumentUrl))
		.then(function(inst) {
			options.instrument.symbol = inst.symbol;
			if (!stopOptions) {
				options.trigger = "immediate";
			} else {
				options.stop_price = stopOptions.price;
				options.trigger = "stop";
			}
		    resolve(options);
		})
		.catch(function(err) {
			console.log(err);
			reject(err);
		});
	});
}

module.exports.getInstrumentFromUrl = function(creds, instrumentId) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
			var instUrl = utils.buildInstrumentUrl(instrumentId);
			console.log(`Getting instrument from ${instUrl}`);
			rh.url(instUrl, function(err, response, instrument) {
				if (err) {
					console.log(err);
					utils.sendJSONResponse(500, res, { error: err });
				}
				console.log(instrument);
				resolve(instrument);
			});
		});
	});
}

module.exports.getInstrumentFromTicker = function(creds, ticker) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
		    rh.instruments(ticker, function(err, response, instrument) {
			    if (err) {
			    	console.log(err);
			    	reject(err);
			    }
			    console.log(`Instrument for ${ticker} is`);
			    console.log(instrument);
			    var retInst = null;
			    instrument.results.forEach(function(inst) {
			    	if (inst.symbol === ticker) {
			    		retInst = inst;		
			    	}
			    });
			    resolve(retInst);
			});
		});
	});
}

module.exports.placeBuy = function(creds, options) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
			rh.place_buy_order(options, function(error, response, body) {
			    if(error) {
			        console.error(error);
			        reject(error);
			    } else {
			        resolve(body);
			    }
			});
		});
	});
}

module.exports.placeSell = function(creds, options) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
			rh.place_sell_order(options, function(error, response, body) {
				if (error) {
					console.log(error);
					reject(error);
				} else {
					resolve(body);
				}
			});
		});
	});
}

module.exports.getAccounts = function(creds) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
			rh.url('https://api.robinhood.com/accounts/', function(err, response, account) {
				if (err) {
					console.log(err);
					reject(err);
				}
				resolve(account);
			});
		});
	});
}

module.exports.getPositions = function(creds) {
	let credentials = checkCreds(creds);
	var self = this;
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
			self.getAccounts(credentials)
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
	});
}

module.exports.getUser = function(creds) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
			rh.user(function(err, response, user) {
				if (err) {
					console.log(err);
					return utils.sendJSONResponse(500, res, { error: err });
				}
				resolve(user);
			});
		});
	});
}

module.exports.getWatchList = function(creds) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
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
	});
}

module.exports.getProfile = function(creds) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
		    rh.investment_profile(function(err, response, body) {
		    	if (err) {
		    		console.log(err);
		    		reject(err);
		    	}
		    	//console.log(body);
		    	resolve(body);
		    });
		});
	});
}

module.exports.getPrice = function(creds, ticker) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
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
	});
}

module.exports.findQueuedOrdersByInstrument = function(creds, instrumentId) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
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
							ret.filter(function(order) { return order.state === 'queued' && order.instrument === utils.buildInstrumentUrl(instrumentId) }) :
							ret.filter(function(order) { return order.state === 'queued' });
						resolve(queued);
					}
				);
			});
		});
	});
}

module.exports.findQueuedStopSellOrderByInstrument = function(creds, instrumentId) {
	let credentials = checkCreds(creds);
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
			rh.orders(function(err, response, body) {
				if (err) {
					console.log(err);
					reject(err);
				}
				let orders = body.results;
				let nextCursorUrl = body.next;
				console.log(nextCursorUrl);
				var foundQueuedStop = utils.findQueuedStop(orders, instrumentId);
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
							foundQueuedStop = utils.findQueuedStop(orders, instrumentId);
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
	});
}

module.exports.cancelQueuedStopSell = function(creds, instrumentId) {
	let credentials = checkCreds(creds);
	var self = this;
	return new Promise(function(resolve, reject) {
		self.findQueuedStopSellOrderByInstrument(credentials, instrumentId)
		.then(function(order) {
			var targetOrder = order;
			var rh = Robinhood(credentials, function() {
				rh.cancel_order(targetOrder, function(err, response, body) {
					if (err) {
						console.log(err);
						return reject(err);
					}
					return resolve(body);
				});
			});

		})
		.catch(function(err) {
			console.log(err);
			return reject(err);
		});
	});
}

module.exports.getYahooPrice = function(ticker) {
	var quote_root = "http://query.yahooapis.com/v1/public/yql?"
	var yql = `select * from yahoo.finance.quotes where symbol in ('${ticker}')`;
	var quote_params = {
		"q": yql,
		"diagnostics": "true",
		"env": "store://datatables.org/alltableswithkeys",
		"format": "json"
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