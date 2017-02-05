module.exports.sendJSONResponse = function(status, res, body) {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).send(JSON.stringify(body));
}