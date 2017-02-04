var express = require('express');
var router = express.Router();
var Robinhood = require('robinhood');
var credentials = require('../credentials');
var bodyParser = require('body-parser');


/* HELPERS */
var sendJSONResponse = function(status, res, body) {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).send(JSON.stringify(body));
}

var getInstrument = function(ticker) {
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

var placeBuy = function(options) {
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

getProfile = function() {
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

var getPrice = function(ticker) {
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

var validAPIKey = function(req) {
	return req.query.key === process.env.API_KEY;
}

/* ROUTES */
/* GET investor profile */
router.get('/', function(req, res, next) {
	if (!validAPIKey(req)) return sendJSONResponse(401, res, { error: "Unauthorized: Invalid or no API key provided" });
	console.log("Getting investor profile");
	getProfile()
	.then(function(profile) {
		sendJSONResponse(200, res, profile);
	})
	.catch(function(err) {
		sendJSONResponse(500, res, { error: err });
	});
});

/* GET ticker price */
router.get('/price/:ticker', function(req, res, next) {
	if (!validAPIKey(req)) return sendJSONResponse(401, res, { error: "Unauthorized: Invalid or no API key provided" });
	var ticker = req.params.ticker;
	console.log(`Getting price data for: ${ticker} `);
	getPrice(ticker)
 	.then(function(data) {
 		sendJSONResponse(200, res, data);	
	})
	.catch(function(err) {
		sendJSONResponse(500, res, { error: err })
	});
});

/* POST place buy order  */
router.post('/buy', bodyParser.json(), function(req, res, next) {
	if (!validAPIKey(req)) return sendJSONResponse(401, res, { error: "Unauthorized: Invalid or no API key provided" });
	var reqBody = req.body;
	if (Object.keys(reqBody).indexOf("quantity") == -1 || Object.keys(reqBody).indexOf("ticker") == -1) {
		return sendJSONResponse(400, res, { error: { message: "Need all valid fields for request" } });
	} else {
		var ticker = reqBody.ticker;
		var quantity = reqBody.quantity;
	}
	getInstrument(ticker)
	.then(function(inst) {
		getPrice(inst.symbol)
		.then(function(data) {
			console.log(`Price data for ${inst.symbol} is: `);
			console.log(data);
		    var options = {
		        type: 'market',
		        trigger: "immediate",
		        time_in_force: "gfd",
		        bid_price: data.last_trade_price,
		        quantity: quantity,
		        instrument: {
		            url: inst.url,
		            symbol: inst.symbol
		        }
		    }
		    placeBuy(options)
		    .then(function(buy) {
		    	sendJSONResponse(200, res, buy);
		    })
		    .catch(function(err) {
		    	console.log(err);
		    	sendJSONResponse(500, res, { error: err })
		    });
		})
		.catch(function(err) {
			console.log(err);
			sendJSONResponse(500, res, { error: err });
		});
	})
	.catch(function(err){
		console.log(err);
		sendJSONResponse(500, res, { error: err });
	});

	// var rh = Robinhood(credentials, function() {
	//     rh.instruments('GEVO', function(err, response, instrument) {
	// 	    if (err) {
	// 	    	console.log(err);
	// 	    	process.exit(1);
	// 	    }
	// 	    console.log(instrument.results[0].url);
	// 	    var options = {
	// 	        type: 'limit',
	// 	        quantity: 20,
	// 	        bid_price: 3.00,
	// 	        instrument: {
	// 	            url: instrument.results[0].url,
	// 	            symbol: instrument.results[0].symbol
	// 	        }
	// 	    }
	// 		rh.place_buy_order(options, function(error, response, body) {
	// 		    if(error){
	// 		        console.error(error);
	// 		    } else{
	// 		        console.log(body);
	// 		    }
	// 		});
	//     });
	// });
});

module.exports = router;
