'use strict';
var IntrinioRealtime = require('intrinio-realtime');
var irCreds = require('../credentials/intrinio');
var utils = require('../lib/utils');
var jStat = require('jStat').jStat;
var _has = require('lodash');
var EventEmitter = require('events');
var config = require('../config');
var trade = require('../lib/trading');
var moment = require('moment');
//interval iterator and clear for simulation mode
var iterator;
let setIterator = function(callback, interval) {
    return iterator = setInterval(callback, interval);
}
let killIterator = function() {
    return clearInterval(iterator);
}
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
            simulateStream(socketsServer, e.price, config.get('simulate.volatility'), ticker);
        });

        socket.on('disconnect', function(e) {
            console.log('Thank you for using the GroundWire stock price stream');
            console.log(socket.id, "disconnected");
            socketEmitter.removeAllListeners();
            killIterator();
            ir.leaveAll();
            ir.destroy();
        });
    });
}

var simulateStream = function(socket, price, volatility, ticker) {
    var prev = price;
    var type = ['ask', 'bid', 'last'];
    var typeOrd;
    var spread, currentPrice, seed, lastProb, spreadMean;
    lastProb = config.get('simulate.last.probability');
    spreadMean = config.get('simulate.spread.mean');
    console.log('-------------------------------------------------');
    console.log('spread mean', config.get('simulate.spread.mean'));
    console.log('last probability', config.get('simulate.last.probability'));
    console.log('bid probability', (1-((1-lastProb)/2)) - lastProb);
    console.log('volatility', config.get('simulate.volatility'));
    console.log('-------------------------------------------------');
    setIterator(() => {
        spread = (Math.random() * spreadMean) + (spreadMean/2);
        seed = Math.random();
        if (seed < lastProb) {
            typeOrd = 2;
        } else if (seed < (1-((1-lastProb)/2))) {
            typeOrd = 1;
        } else {
            typeOrd = 0;
        }
        switch (type[typeOrd]) {
            case 'ask':
                currentPrice = prev * (1 + jStat.normal.sample( spread , 0.025 ));
                break;
            case 'bid':
                currentPrice = prev / (1 + jStat.normal.sample( spread , 0.025 ));
                break;
            default:
                currentPrice = prev;
        }
        socket.in(ticker).emit('quote', { 
            type: type[typeOrd],
            timestamp: Date.now(),
            ticker: ticker,
            size: 100,
            price: utils.moneyify(currentPrice) }
        );
        prev = jStat.normal.inv( Math.random(), prev, volatility );
    }, config.get('simulate.tickrate'));
}
