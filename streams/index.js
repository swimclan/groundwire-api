'use strict';
var IntrinioRealtime = require('intrinio-realtime');
var irCreds = require('../credentials/intrinio');
var utils = require('../lib/utils');
var _has = require('lodash');
var EventEmitter = require('events');
var config = require('../config');
var trade = require('../lib/trading');
var moment = require('moment');
var Iterator = require('../lib/Iterator');
var simulator = require('../lib/simulator');

class SocketEvents extends EventEmitter {}
var socketEmitter = new SocketEvents();

module.exports = function(server, io) {
    var socketsServer = io.listen(server);
    socketsServer.sockets.on('connection', function(socket) {
        console.log("New connection detected");
        console.log("Client id: ", socket.id);
        let ir = new IntrinioRealtime(irCreds);
        let request = socket.handshake;
        var ticker = _has(request.query, 'ticker') ? request.query.ticker : "NULL";
        var simulate = _has(request.query, 'simulate') && parseInt(request.query.simulate) === 1;
        var lastPrice;
        var iterator = new Iterator();

        // Check API KEY and simulation mode to connect sockets
        if (utils.validAPIKey(request)) {
            socket.join(ticker);
            simulate ? null : ir.join(ticker);
        } else {
            console.log("Error: Invalid or no api key provided");
            console.log("Disconnecting client: ", socket.id);
            socket.emit('close', 'Error: Invalid or no api key provided');
            socket.disconnect();
        }

        // Start either simulation mode or live mode
        if (simulate) {
            console.log('Enabling simulation mode');
            console.log('Retrieving Yahoo quote for ' + ticker);
            trade.getYahooPrice(ticker)
            .then((quote) => {
                socketEmitter.emit('simulate', {price: quote.price});
            })
            .catch((err) => {
                console.log(err);
                socket.emit('close', 'Simulator could not retrieve current quote from Yahoo.  Disconnecting...');
                socket.disconnect();
            });
        } else {
            // Listen for Intrinio price frames
            ir.onQuote(quote => {
                var { ticker, type, price, size, timestamp } = quote;
                console.log("STREAM QUOTE: ", ticker, type, price, size, timestamp);
                socketsServer.in(ticker).emit('quote', quote);
            });
        }

        socketEmitter.on('simulate', (e) => {
            simulator(socketsServer, e.price, config.get('simulate.volatility'), ticker, iterator);
        });

        socket.on('disconnect', function(e) {
            console.log('Thank you for using the GroundWire stock price stream');
            console.log(socket.id, "disconnected");
            socketEmitter.removeAllListeners();
            iterator.killIterator();
            ir.leaveAll();
            ir.destroy();
        });
    });
}
