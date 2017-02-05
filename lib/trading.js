var Robinhood = require('robinhood');
var credentials = require('../credentials');

/* HELPERS */
var buildInstrumentUrl = function(instrumentId) {
	var rootUrl = "https://api.robinhood.com/instruments/";
	return rootUrl + instrumentId;
}

/* EXPORTS */
module.exports.buildOrderOptions = function(instrumentUrl, quantity, price) {
	return new Promise(function(resolve, reject) {
		getInstrumentFromUrl(instrumentUrl)
		.then(function(inst) {
			console.log(inst);
		    var options = {
		        type: 'market',
		        trigger: "immediate",
		        time_in_force: "gfd",
		        bid_price: price,
		        quantity: quantity,
		        instrument: {
		            url: instrumentUrl,
		            symbol: inst.symbol
		        }
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
			var instUrl = buildInstrumentUrl(instrumentId);
			console.log(instUrl);
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
	return new Promise(function(resolve, reject) {
		var rh = Robinhood(credentials, function() {
			getAccounts()
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

module.exports.validAPIKey = function(req) {
	return req.query.key === process.env.API_KEY;
}