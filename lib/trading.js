var Robinhood = require('robinhood');
var credentials = require('../credentials');
var async = require('async');
var utils = require('./utils');

'use strict';

/* EXPORTS */
module.exports.buildOrderOptions = function(instrumentUrl, quantity, price, stopOptions) {
	var self = this;
	var options = {
		type: "market",
		time_in_force: "gfd",
		bid_price: price,
		quantity: quantity,
		instrument: { url: instrumentUrl }
	};
	return new Promise(function(resolve, reject) {
		self.getInstrumentFromUrl(utils.getInstrumentIdFromUrl(instrumentUrl))
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

module.exports.getInstrumentFromUrl = function(instrumentId) {
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

module.exports.getInstrumentFromTicker = function(ticker) {
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

module.exports.placeBuy = function(options) {
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

module.exports.placeSell = function(options) {
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

module.exports.getAccounts = function() {
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

module.exports.getPositions = function() {
	var self = this;
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
			self.getAccounts()
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

module.exports.getUser = function() {
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

module.exports.getWatchList = function() {
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

module.exports.getProfile = function() {
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

module.exports.getPrice = function(ticker) {
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
		    rh.quote_data(ticker, function(error, response, body) {
		        if (error) {
		            console.error(error);
		            reject(error); 
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

module.exports.findQueuedOrdersByInstrument = function(instrumentId) {
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
						resolve({ orders: queued });
					}
				)
			});
		});
	});
}

module.exports.cancelQueuedStopSell = function(instrumentId) {
	var self = this;
	return new Promise(function(resolve, reject) {
		self.findQueuedOrdersByInstrument(instrumentId)
		.then(function(queue) {
			var targetOrders = queue.orders.filter(function(order) { 
				return order.trigger === 'stop';
			});
			if (targetOrders.length !== 1) {
				console.log("Error: Either 0 or more than one order was found");
				reject("Error: Either 0 or more than one order was found");
			} else {
				console.log(targetOrders[0]);
				var rh = Robinhood(credentials, function() {
					rh.cancel_order(targetOrders[0], function(err, response, body) {
						if (err) {
							console.log(err);
							return reject(err);
						}
						return resolve(body);
					});
				});
			}
		})
		.catch(function(err) {
			console.log(err);
			return reject(err);
		});
	});
}