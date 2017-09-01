var config = require('../config');
var jStat = require('jStat').jStat;
var utils = require('../lib/utils');

module.exports = function(socket, price, volatility, ticker, iterator) {
    let currentPrice = price;
    let spreadMean = config.get('simulate.spread.mean');
    let determinant, seed, interval, prevPrice, ask, bid, tick, type, now;

    console.log('-------------------------------------------------');
    console.log('S I M U L A T I O N');
    console.log('-------------------------------------------------');
    console.log('spread mean:', spreadMean);
    console.log('volatility:', volatility);
    console.log('-------------------------------------------------');

    iterator.setIterator(() => {
        now = Date.now()
        seed = Math.random();
        determinant = seed <= config.get('simulate.direction') ? 1 : -1;
        interval = ((Math.random() * volatility) * 0.01) * determinant;
        currentPrice = currentPrice + interval;
        
        tick = {
            ask: currentPrice * (1+(0.5 * spreadMean)),
            bid: currentPrice / (1+(0.5 * spreadMean)),
            last: currentPrice
        }

        type = ["ask", "bid", "last"][Math.floor(Math.random() * 3)];

        socket.in(ticker).emit('quote', {
            type: type,
            timestamp: now,
            ticker: ticker,
            size: 100,
            price: utils.moneyify(tick[type]) }
        );
        console.log("STREAM QUOTE: ", ticker, type, utils.moneyify(tick[type]), 100, now);
    }, config.get('simulate.tickrate'));
}
