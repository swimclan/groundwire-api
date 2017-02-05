var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var trade = require('../lib/trading');
var utils = require('../lib/utils');

/* ROUTES */
/* GET investor profile */
router.get('/', function(req, res, next) {
	if (!trade.validAPIKey(req)) return utils.sendJSONResponse(401, res, { error: "Unauthorized: Invalid or no API key provided" });
	console.log("Getting investor profile");
	trade.getProfile()
	.then(function(profile) {
		utils.sendJSONResponse(200, res, profile);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* GET user profile */
router.get('/user', function(req, res, next) {
	console.log("Getting user profile");
	trade.getUser()
	.then(function(user) {
		utils.sendJSONResponse(200, res, user);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* GET user account */
router.get('/accounts', function(req, res, next) {
	console.log("Getting user account");
	trade.getAccounts()
	.then(function(account) {
		utils.sendJSONResponse(200, res, account);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* GET positions */
router.get('/positions', function(req, res, next) {
	console.log("getting positions");
	trade.getPositions()
	.then(function(positions) {
		utils.sendJSONResponse(200, res, positions);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, err);
	});
});

/* GET ticker price */
router.get('/price/:ticker', function(req, res, next) {
	if (!trade.validAPIKey(req)) return utils.sendJSONResponse(401, res, { error: "Unauthorized: Invalid or no API key provided" });
	var ticker = req.params.ticker;
	console.log(`Getting price data for: ${ticker} `);
	trade.getPrice(ticker)
 	.then(function(data) {
 		utils.sendJSONResponse(200, res, data);	
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err })
	});
});

/* GET watchlists */
router.get('/watchlist', function(req, res, next) {
	trade.getWatchList()
	.then(function(watchlist) {
		console.log(watchlist);
		utils.sendJSONResponse(200, res, watchlist);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* POST place buy order  */
router.post('/buy', bodyParser.json(), function(req, res, next) {
	if (!trade.validAPIKey(req)) return utils.sendJSONResponse(401, res, { error: "Unauthorized: Invalid or no API key provided" });
	var reqBody = req.body;
	if (Object.keys(reqBody).indexOf("quantity") === -1) {
		return utils.sendJSONResponse(400, res, { error: { message: "Must specify a quantity" } });
	} 
	if (Object.keys(reqBody).indexOf("symbol") === -1 && Object.keys(reqBody).indexOf("instrumentId") === -1) {
		return utils.sendJSONResponse(400, res, { error: { message: "Must specify either a symbol or an instrument ID" } });	
	}
	if (Object.keys(reqBody).indexOf("symbol") !== -1) {
		var instQueryType = 'symbol';
		var instQuery = reqBody.symbol;
		var quantity = reqBody.quantity;
	} else {
		var instQueryType = 'instrument';
		var instQuery = reqBody.instrumentId;
		var quantity = reqBody.quantity;
	}
	var instrumentQueryMethod = instQueryType === 'symbol' ? trade.getInstrumentFromTicker : trade.getInstrumentFromUrl
	instrumentQueryMethod(instQuery)
	.then(function(inst) {
		trade.getPrice(inst.symbol)
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
		    trade.placeBuy(options)
		    .then(function(buy) {
		    	utils.sendJSONResponse(200, res, buy);
		    })
		    .catch(function(err) {
		    	console.log(err);
		    	utils.sendJSONResponse(500, res, { error: err })
		    });
		})
		.catch(function(err) {
			console.log(err);
			utils.sendJSONResponse(500, res, { error: err });
		});
	})
	.catch(function(err){
		console.log(err);
		utils.sendJSONResponse(500, res, { error: err });
	});
});

module.exports = router;
