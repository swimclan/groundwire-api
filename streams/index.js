'use strict';
var IntrinioRealtime = require('intrinio-realtime');
var irCreds = require('../credentials/intrinio');
var utils = require('../lib/utils');

module.exports = function(server, io) {
    var socketsServer = io.listen(server);
    socketsServer.sockets.on('connection', function(socket) {
        console.log("New connection detected");
        console.log("Client id: ", socket.id);
        let ir = new IntrinioRealtime(irCreds);
        let request = socket.handshake;
        var ticker = request.query ? request.query.ticker : "NULL";
        if (utils.validAPIKey(request)) {
            socket.join(ticker);
            ir.join(ticker);
        } else {
            console.log("Error: Invalid or no api key provided");
            console.log("Disconnecting client: ", socket.id);
            socket.emit('close', 'Error: Invalid or no api key provided');
            socket.disconnect();
        }

        ir.onQuote(quote => {
            var { ticker, type, price, size, timestamp } = quote;
            console.log("STREAM QUOTE: ", ticker, type, price, size, timestamp);
            socketsServer.in(ticker).emit('quote', quote);
        });

        socket.on('disconnect', function(e) {
            console.log('Thank you for using the GroundWire stock price stream');
            console.log(socket.id, "disconnected");
            ir.leaveAll();
            ir.destroy();
        });
    });
}