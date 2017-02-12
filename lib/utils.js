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