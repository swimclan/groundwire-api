'use strict';

module.exports.sendJSONResponse = function(status, res, body) {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).send(JSON.stringify(body));
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
  let currentAPIKeys = JSON.parse(process.env.API_KEYS);
  return currentAPIKeys.indexOf(req.query.key) !== -1
}

module.exports.secure = function(req, res) {
  if (!this.validAPIKey(req)) return this.sendJSONResponse(401, res, { error: "Unauthorized: Invalid or no API key provided" });
}