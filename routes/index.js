'use strict';

var express = require('express');
var passport = require('passport');
var router = express.Router();
var bodyParser = require('body-parser');
var trade = require('../lib/trading');
var utils = require('../lib/utils');
var RH = require('../lib/RH');
var pkg = require('../package.json');
var _ = require('lodash');
var Subscribers = require('../lib/Subscribers');
var Logger = require('../lib/Logger');
var db = require('../lib/db');
var User = require('../models/User');
var Token = require('../models/Token');
var Strategy = require('../models/Strategy');
try {
	var userCreds = require('../credentials/robinhood');
} catch (e) {
	var userCreds;
}

let logger = Logger.getInstance();

/* MIDDLEWARE */
let bindUserSession = function(req, res, next) {
	req.user = !_.isUndefined(userCreds) ? userCreds : utils.authenticatedUser(req);
	var encodedUser = utils.encodeUser(req.user);
	let session_destroy = Promise.resolve();
	if (_.has(req.user, 'username') && _.has(req.user, 'password')) {
		logger.log('Destroy session', 'Destroying existing username and password session');
		session_destroy = req.app.locals.sessions.destroy(encodedUser);
	}
	session_destroy.then(function() {
		return req.app.locals.sessions.get(encodedUser);
	})
	.then((options) => {
		req.rh = options.rh;
		next();
	}).catch(() => {
		new RH(req.user).authenticate(req.user)
		.then((Rh) => {
			let rh = Rh.instance;
			return req.app.locals.sessions.create(encodedUser, {rh: rh});
		})
		.then((session) => {
			return session.get(encodedUser);
		})
		.then((options) => {
			req.rh = options.rh;
			next();
		});
	});
}

/* ROUTES */
/* GET investor profile */
router.get('/', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	trade.getProfile(req.rh)
	.then(function(profile) {
		utils.sendJSONResponse(200, res, profile);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* GET user profile */
router.get('/user', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	trade.getUser(req.rh)
	.then(function(user) {
		utils.sendJSONResponse(200, res, user);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

router.get('/logout', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	trade.expireUser(req.rh)
	.then(function(user) {
		req.app.locals.sessions.destroy(utils.encodeUser(user));
		utils.sendJSONResponse(200, res, user);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* GET user account */
router.get('/accounts', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	trade.getAccounts(req.rh)
	.then(function(account) {
		utils.sendJSONResponse(200, res, account);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* GET positions */
router.get('/positions', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	trade.getPositions(req.rh)
	.then(function(positions) {
		utils.sendJSONResponse(200, res, positions);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, err);
	});
});

/* GET queued orders */
router.get('/queue', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	trade.findOrdersByInstrument(req.rh, 'queued')
	.then(function(orders) {
		utils.sendJSONResponse(200, res, orders);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* GET filled orders by instrument */
router.get('/orders/:instrumentid', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	if (_.isUndefined(req.params.instrumentid)) return utils.sendJSONResponse(400, res, { error: { message: "Must supply a valid instrument id" } });
	trade.findOrdersByInstrument(req.rh, 'filled', req.params.instrumentid)
	.then((orders) => {
		utils.sendJSONResponse(200, res, orders);
	}).catch((err) => {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* GET filled recent orders by instrument */
router.get('/orders/recent/:instrumentid/:date', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	if (_.isUndefined(req.params.instrumentid)) return utils.sendJSONResponse(400, res, { error: { message: "Must supply a valid instrument id" } });
	trade.findRecentOrdersByInstrument(req.rh, 'filled', req.params.instrumentid, req.params.date)
	.then((orders) => {
		utils.sendJSONResponse(200, res, orders);
	}).catch((err) => {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* GET ticker price */
router.get('/price/:ticker', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	var ticker = req.params.ticker;
	trade.getPrice(req.rh, ticker)
 	.then(function(data) {
 		utils.sendJSONResponse(200, res, data);	
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err })
	});
});

/* GET watchlists */
router.get('/watchlist', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	trade.getWatchList(req.rh)
	.then(function(watchlist) {
		utils.sendJSONResponse(200, res, watchlist);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* POST place buy order  */
router.post('/trade', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	var reqBody = req.body;
	if (!reqBody.type) {
		logger.log('ERROR!', 'No trade type was specified');
		return utils.sendJSONResponse(400, res, { error: { message: "Must specify a trade type" } });
	} 
	if (Object.keys(reqBody).indexOf("quantity") === -1) {
		logger.log('ERROR!', 'No trade quantity was specified');
		return utils.sendJSONResponse(400, res, { error: { message: "Must specify a quantity" } });
	} 
	if (Object.keys(reqBody).indexOf("symbol") === -1 && Object.keys(reqBody).indexOf("instrumentId") === -1) {
		logger.log('ERROR!', 'No symbol or instrument ID was specified');
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
		//return utils.sendJSONResponse(400, res, { error: { message: "Sell orders must include a stop loss price" } });
		stopPrice = null;
	} else {
		stopPrice = req.body.stop_price;
	}
	var instrumentQueryMethod = instQueryType === 'symbol' ? trade.getInstrumentFromTicker : trade.getInstrumentFromUrl
	instrumentQueryMethod(req.rh, instQuery)
	.then(function(inst) {
		trade.getPrice(req.rh, inst.symbol)
		.then(function(data) {
			var options = trade.buildOrderOptions(inst, quantity, data.last_trade_price, stopPrice ? { price: stopPrice } : null);
			tradeMethod(req.rh, options)
			.then(function(buy) {
				utils.sendJSONResponse(200, res, buy);
			})
			.catch(function(err) {
				utils.sendJSONResponse(500, res, { error: err })
			});
		})
		.catch(function(err) {
			utils.sendJSONResponse(500, res, { error: err });
		});
	})
	.catch(function(err){
		utils.sendJSONResponse(500, res, { error: err });
	});
});

/* DELETE cancel queued stop sell */
router.delete('/cancel', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	var reqBody = req.body;
	if (Object.keys(reqBody).indexOf("instrumentId") === -1) {
		logger.log('ERROR!', 'An instrument ID was not found in request');
		return utils.sendJSONResponse(400, res, { error: "Error: An instrument ID was not found in request" });
	}
	if (Object.keys(reqBody).indexOf("trigger") === -1) {
		logger.log('ERROR!', 'A trigger type was not found in request');
		return utils.sendJSONResponse(400, res, { error: "Error: A trigger type was not found in request" });
	}

	var cancelMethod;

	switch (reqBody.trigger) {
		case 'immediate':
			cancelMethod = trade.cancelQueuedMarketSell.bind(trade);
			break;
		case 'stop':
			cancelMethod = trade.cancelQueuedStopSell.bind(trade);
			break;
		default:
			cancelMethod = trade.cancelQueuedMarketSell.bind(trade);
	}

	cancelMethod(req.rh, reqBody.instrumentId)
	.then(function(cancelledOrder) {
		return utils.sendJSONResponse(200, res, cancelledOrder);
	})
	.catch(function(err) {
		console.log(err);
		return utils.sendJSONResponse(500, res, { error: err });
	});
});

router.get('/auth', bindUserSession, function(req, res, next) {
	let checkUser = utils.authenticatedUser(req);
	if (checkUser) {
		utils.sendJSONResponse(200, res, checkUser);
	} else {
		utils.sendJSONResponse(400, res, { error: { message: "No authenticated user was send in the request" } });
	}
});

router.get('/queue/:trigger/:instrumentId', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	var valid_triggers = ['stop', 'immediate'];
	if (valid_triggers.indexOf(req.params.trigger) === -1) return utils.sendJSONResponse(400, res, { error: "trigger must me either stop or immediate" });
	if (!req.params.instrumentId) {
		logger.log('ERROR!', 'No instrumentId was specified');
		utils.sendJSONResponse(400, res, { error: "must supply an instrumentId" });
	}
	trade.findQueuedSellOrderByInstrument(req.rh, req.params.instrumentId, req.params.trigger)
	.then(function(stopOrder) {
		let ret = [stopOrder];
		utils.sendJSONResponse(200, res, ret);
	})
	.catch(function(err) {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

router.get('/instrument/:type/:id', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	let validTypes = ['symbol', 'instrument'];
	if (!utils.inArray(req.params.type, validTypes)) {
		return utils.sendJSONResponse(400, res, {error: "must supply a valid type"});
	}
	var instrumentMethod = req.params.type.toLowerCase() === 'symbol' ? trade.getInstrumentFromTicker : trade.getInstrumentFromUrl;
	instrumentMethod(req.rh, req.params.id)
	.then((inst) => {
		utils.sendJSONResponse(200, res, inst);
	})
	.catch((err) => {
		utils.sendJSONResponse(500, res, { error: err });
	});
});

router.get('/yahoo/:ticker', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	trade.getYahooPrice(req.params.ticker)
	.then((price) => {
		if (_.has(price, 'warning')) {
			utils.sendJSONResponse(400, res, price);
		} else {
			utils.sendJSONResponse(200, res, price);
		}
	})
	.catch((err) => {
		utils.sendJSONResponse(500, res, {error: err});
	});
});

router.get('/holidays', bindUserSession, function(req, res, next) {
	if (!utils.secure(req, res)) return;
	trade.getCalendar()
	.then((calendar) => {
		return utils.sendJSONResponse(200, res, calendar);
	}).catch((err) => { utils.sendJSONResponse(500, res, {error: err}) });
});

router.get('/version', function(req, res, next) {
	try {
		utils.sendJSONResponse(200, res, { version: pkg.version });
	} catch (error) {
		utils.sendJSONResponse(500, res, error);
	}
});

router.get('/subscribers', function(req, res, next) {
	if (!utils.secure(req, res)) return;
	let subscribers = Subscribers.getInstance();
	utils.sendJSONResponse(200, res, subscribers.all());
});

router.delete('/subscriber', function(req, res, next) {
	if (!utils.secure(req, res)) return;
	let target_id;
	if (_.has(req.body, 'id')) {
		target_id = req.body.id;
	} else {
		return utils.sendJSONResponse(400, res, {error: 'Must supply a valid subscriber id'});
	}
	let subscribers = Subscribers.getInstance();
	subscribers.trigger('boot', target_id);
	return utils.sendJSONResponse(200, res, {success: `Id ${target_id} was queued for boot out`});
});

router.post('/user/register', function(req, res, next) {
	if (!utils.secure(req, res)) return;
	if (
		!_.has(req.body, 'first') ||
		!_.has(req.body, 'last') ||
		!_.has(req.body, 'password') ||
		!_.has(req.body, 'email')
	) {
		return utils.sendJSONResponse(400, res, {error: 'Must supply all user attributes'});
	}
	let user = new User(db);
	user.register({
		firstName: req.body.first,
		lastName: req.body.last,
		emailAddress: req.body.email},
		req.body.password, function(err, user) {
		if (err) {
			logger.log('ERROR!', 'Unable to create a user with those attributes', {});
			return utils.sendJSONResponse(500, res, {error: err});				
		}
		logger.log('User', `Successfully create user: ${req.body.first} ${req.body.last}`, {});
		return utils.sendJSONResponse(200, res, user);			
	});
});

router.post('/user/login', function(req, res, next) {
	logger.log('Login', 'Login attempt with the following credential', {emailAddress: req.body.emailAddress});
	passport.authenticate('local', {}, function(err, user, info) {
		if (err) {
			logger.log('ERROR!', 'An error occured on the authenticate routine.', {error: err});
			return res.status(500).send(err);
		} else if (!user) {
			logger.log('Login', 'Login failed', info);
			return res.status(401).send(info);
		}
		req.login(user, function(err) {
			if (err) {
				logger.log('ERROR!', 'An error occured on the login routine.', err);
				return res.status(400).send(err);
			} else {
				logger.log('Login', 'Login was successful for the following user', user.dataValues);
				return res.status(200).send('OK');
			}
		})

	})(req, res, next);
});

router.get('/user/check', function(req, res, next) {
	let ret = {
		authorized: false,
		user: null,
		connected: false
	};
	const session = req.session.passport;
	let valid_session = !_.isUndefined(session);
	if (!valid_session) {
		return utils.sendJSONResponse(200, res, ret);
	}
	const TokenModel = new Token(db);
	const UserModel = new User(db);
	ret.authorized = true;
	UserModel.findOne({
		where: {
			emailAddress: session.user
		}
	}).then((user) => {
		if (user && user.id) {
			ret.user = user.emailAddress;
			return TokenModel.findOne({
				where: {
					active: true,
					userId: user.id
				}
			});
		}
		return null;
	}).catch((err) => {
		logger.log('ERROR!', 'There was an error fetching user from the db', {error: err});
	}).then((token) => {
			logger.log('Token check', 'Token lookup complete.  Value of token is:', {token: token});
			ret.connected = !_.isUndefined(token) && token !== null;
			return utils.sendJSONResponse(200, res, ret);
	}).catch((err) => {
		logger.log('ERROR!', 'There was an error fetching token from the db', {error: err});
		return utils.sendJSONResponse(500, res, {error: err});
	});
});

router.get('/user/logout', function(req, res, next) {
	if (!_.isUndefined(req.session)) {
		req.session.destroy();
	}
	utils.sendJSONResponse(200, res, {destroyed: true});
});

router.get('/user/tokenize', bindUserSession, function(req, res, next) {
	let session = utils.loggedIn(req, res);
	if (!session) return;
	let userId;
	// Connect DB models
	let UserModel = new User(db);
	let TokenModel = new Token(db);
	// 1. Find the user with session id
	UserModel.findOne({where: { emailAddress: session.user }}).then(function(user) {
		return user.id;
	}).catch(function(err) {
		logger.log('ERROR!', 'There was an error in fetching the user from db', {error: err});
		utils.sendJSONResponse(500, res, {error: err});
	}).then(function(id) {
		// 2. Find the RH user token from the creds passed in the header (through bind session)
		if (id) {
			userId = id;
			return trade.getUser(req.rh);
		}
		return null;
	}).catch(function(err) {
		logger.log('ERROR!', 'There was an error in fetching the user from Robinhood', {error: err});
		utils.sendJSONResponse(500, res, {error: err});
	}).then(function(rhuser) {
		// 3. Check to see if token exists for user
		if (rhuser && rhuser.auth_token) {
			return TokenModel.findCreateFind({
				where: {
					userId: userId
				},
				defaults: {
					authToken: rhuser.auth_token,
					active: !_.isUndefined(rhuser.auth_token)
				}
			});
		}
		return utils.sendJSONResponse(401, res, {error: 'Invalid Robinhood credentials'});
	}).catch(function(err) {
		logger.log('ERROR!', 'There was an error fetching token from db', {error: err});
		return utils.sendJSONResponse(500, res, {error: err});
	}).then(function([token, created]) {
		if (token && created !== null && !_.isUndefined(created)) {
			let prefix = created ? 'Created a new' : 'Found and updated a';
			logger.log('Token', `${prefix} RH auth token for user: ${userId}`, {token: token});
			return utils.sendJSONResponse(200, res, {token: token});
		}
		return null
	}).catch(function(err) {
		logger.log('ERROR!', 'Something went wrong.', {error: err});
	});
});

router.post('/strategy', function(req, res, next) {
	if (!utils.secure(req, res)) return;
	if (!utils.loggedIn(req, res)) return;
	if (_.isUndefined(req.body.name)) {
		logger.log('ERROR!', 'No strategy name was sent in the request.  Please try again.', {});
		return utils.sendJSONResponse(400, res, {error: 'No strategy name was sent in the request.  Please try again.'});
	}
	logger.log('Strategy create', 'About to create a new strategy', {name: req.body.name, active: true});
	let StrategyModel = new Strategy(db);
	StrategyModel.create({name: req.body.name, active: true}).then(function(strategy) {
		logger.log('Strategy create', 'Strategy successfully created', strategy);
		utils.sendJSONResponse(200, res, strategy);
	}).catch(function(err) {
		logger.log('ERROR!', 'Something failed when creating new strategy item', {error: err});
		utils.sendJSONResponse(500, res, {error: err});
	});
});

router.get('/strategy', function(req, res, next) {
	if (!utils.loggedIn(req, res)) return;
	let StrategyModel = new Strategy(db);
	StrategyModel.findAll({where: { active: true }}).then(function(strategies) {
		logger.log('Get strategies', 'Successfully fetched all active strategies', {strategies: strategies});
		utils.sendJSONResponse(200, res, strategies);
	}).catch(function(err) {
		logger.log('ERROR!', 'Something went wrong when fetching all strategies', {error: err});
		utils.sendJSONResponse(500, res, {error: err});
	});
});

module.exports = router;
