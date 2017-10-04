'use strict';

var DB = require('./db');

var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = process.env.TOKEN_SALT;

var _ = require('lodash');

let encrypt = function (text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
let decrypt = function (text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

let unBase64 = function(text) {
  return new Buffer(text, 'base64').toString('ascii');
}

let base64 = function(text) {
  return new Buffer(text).toString('base64');
}

let serializeUser = function(userStr) {
  let userSplit = userStr.split(':');
  return { username: userSplit[0], password: userSplit[1] };
}

let tokenizeUser = function(token) {
  return {token: token};
}

module.exports.inArray = function(item, arr) {
  return _.indexOf(arr, item, 0) !== -1;
}

module.exports.sendJSONResponse = function(status, res, body) {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).send(JSON.stringify(body));
}

module.exports.moneyify = function(n) {
  return (Math.floor(n*100)/100);
}

module.exports.buildInstrumentUrl = function(instrumentId) {
	var rootUrl = "https://api.robinhood.com/instruments/";
	return rootUrl + instrumentId + '/';
}

module.exports.getInstrumentIdFromUrl = function(url) {
  var splitUrl = url.split('/');
  var idIndex = splitUrl.indexOf('instruments') + 1;
  return splitUrl[idIndex];
}

module.exports.validAPIKey = function(req) {
  let currentAPIKeys = process.env.API_KEYS;
  return currentAPIKeys.split(',').indexOf(req.query.key) !== -1;
}

module.exports.encodeUser = function(user) {
  let authString;
  if (_.has(user, 'token')) authString = user.token;
  if (_.has(user, 'username') && _.has(user, 'password')) authString = `${user.username}:${user.password}`;
  return base64(authString);
}

module.exports.decodeUser = function(authstring) {
  return unBase64(authstring);
}

module.exports.authenticatedUser = function(req) {
  if (!_.isUndefined(req.headers.authorization)) {
    let authSplit = req.headers.authorization.split(' ');
    let authorization = {};
    authorization.type = authSplit[0];
    authorization.data = authSplit[1];
    if (authorization.type === 'Basic') {
      let userString = unBase64(authorization.data);
      return serializeUser(userString);
    } else if (authorization.type === 'Bearer') {
      return tokenizeUser(authorization.data);
    }
  } else return null;
}

module.exports.secure = function(req, res) {
  if (!this.validAPIKey(req)) return this.sendJSONResponse(401, res, { error: "Unauthorized: Invalid or no API key provided" });
}

module.exports.findQueuedSell = function(orders, inst, trigger) {
  var self = this;
  for (var i=0; i<orders.length; i++) {
    if ((orders[i].state === 'queued' || orders[i].state === 'placed') && (orders[i].trigger === trigger) && (orders[i].instrument === self.buildInstrumentUrl(inst))) {
      return orders[i];
    }
  };
  return false;
}

module.exports.parseObjectPath = function(path, obj) {
    let params = path.split('.');
    var value = obj;
    for (var i in params) {
        if (Object.keys(value).indexOf(params[i]) !== -1) {
            value = value[params[i]];
        } else {
            return null;
        }
    }
    return value;
}

module.exports.wait = function(sec) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, sec * 1000);
  });
}

module.exports.roundUp = function(num, factor) {
  return num - (num % factor) + factor;
}

module.exports.roundDown = function(num, factor) {
  return num - (num % factor);
}

module.exports.filterOrdersByState = function(orders, state) {
  return orders.filter(function(order) { return order.state === state });
}
