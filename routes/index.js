var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var trade = require('../lib/trading');
var utils = require('../lib/utils');

/* ROUTES */
/* GET investor profile */
router.get('/', function(req, res, next) {
	utils.secure(req, res);
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
	utils.secure(req, res);
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
	utils.secure(req, res);
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
	utils.secure(req, res);
	console.log("getting positions");
	trade.getPositions()
	.then(function(positions) {
		utils.sendJSONResponse(200, res, positions);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, err);
	});
});

/* GET queued orders */
router.get('/queue', function(req, res, next) {
	utils.secure(req, res);
	console.log("Getting orders");
	trade.findQueuedOrdersByInstrument()
	.then(function(orders) {
		utils.sendJSONResponse(200, res, orders);
	})
	.catch(function(err) {
		console.log(err);
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* GET ticker price */
router.get('/price/:ticker', function(req, res, next) {
	utils.secure(req, res);
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
	utils.secure(req, res);
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
router.post('/trade', bodyParser.json(), function(req, res, next) {
	utils.secure(req, res);
	var reqBody = req.body;
	if (!reqBody.type) { 
		return utils.sendJSONResponse(400, res, { error: { message: "Must specify a trade type" } });
	} 
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
	var orderType = reqBody.type;
	var tradeMethod = orderType === "buy" ? trade.placeBuy : trade.placeSell;
	var stopPrice = null;
	if (orderType !== 'buy' && !req.body.stop_price) {
		return utils.sendJSONResponse(400, res, { error: { message: "Sell orders must include a stop loss price" } });
	} else {
		stopPrice = req.body.stop_price;
	}
	var instrumentQueryMethod = instQueryType === 'symbol' ? trade.getInstrumentFromTicker : trade.getInstrumentFromUrl
	instrumentQueryMethod(instQuery)
	.then(function(inst) {
		trade.getPrice(inst.symbol)
		.then(function(data) {
			trade.buildOrderOptions(inst.url, quantity, data.last_trade_price, stopPrice ? { price: stopPrice } : null)
			.then(function(options) {
			    tradeMethod(options)
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

/* DELETE cancel queued stop sell */
router.delete('/cancel', function(req, res, next) {
	utils.secure(req, res);
	var reqBody = req.body;
	if (Object.keys(reqBody).indexOf("instrumentId") === -1) {
		console.log("Error: An instrument ID was not found in request");
		return utils.sendJSONResponse(400, res, { error: "Error: An instrument ID was not found in request" });
	}
	trade.cancelQueuedStopSell(reqBody.instrumentId)
	.then(function(cancelledOrder) {
		return utils.sendJSONResponse(200, res, cancelledOrder);
	})
	.catch(function(err) {
		console.log(err);
		return utils.sendJSONResponse(500, res, { error: err });
	});
});

module.exports = router;
