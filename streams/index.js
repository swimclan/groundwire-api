'use strict';
var IntrinioRealtime = require('intrinio-realtime');
var irCreds = require('../credentials/intrinio');
var utils = require('../lib/utils');
var jStat = require('jStat').jStat;
var _has = require('lodash');
var EventEmitter = require('events');

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
            if (!simulate) {
                socketsServer.in(ticker).emit('quote', quote);
            } else if (!lastPrice && quote.type === 'last') {
                lastPrice = quote.price;
                socketEmitter.emit('simulate', {price: lastPrice});
            }
        });

        socketEmitter.on('simulate', (e) => {
            simulateStream(socketsServer, e.price, 0.02, ticker);
        });

        socket.on('disconnect', function(e) {
            console.log('Thank you for using the GroundWire stock price stream');
            console.log(socket.id, "disconnected");
            ir.leaveAll();
            ir.destroy();
        });
    });
}

var simulateStream = function(socket, price, volatility, ticker) {
    var prev = price;
    var type = ['ask', 'bid', 'last'];
    var typeOrd;
    var spread, currentPrice, seed;
    setInterval(() => {
        spread = (Math.random() * 0.4) + 0.05;
        seed = Math.random();
        if (seed < 0.1) {
            typeOrd = 2;
        } else if (seed < 0.55) {
            typeOrd = 1;
        } else {
            typeOrd = 0;
        }
        switch (type[typeOrd]) {
            case 'ask':
                currentPrice = prev * (1 + spread);
                break;
            case 'bid':
                currentPrice = prev / (1 + spread);
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
    }, 2500);
}
