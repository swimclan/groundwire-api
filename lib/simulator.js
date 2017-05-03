var config = require('../config');
var jStat = require('jStat').jStat;
var utils = require('../lib/utils');

module.exports = function(socket, price, volatility, ticker, iterator) {
    var prev = price;
    var type = ['ask', 'bid', 'last'];
    var typeOrd;
    var currentPrice, seed, lastProb, spreadMean, jitter, now;
    var spread = new Object;
    lastProb = config.get('simulate.last.probability');
    spreadMean = config.get('simulate.spread.mean');
    jitter = config.get('simulate.spread.jitter');
    console.log('-------------------------------------------------');
    console.log('S I M U L A T I O N');
    console.log('-------------------------------------------------');
    console.log('spread mean:', spreadMean);
    console.log('spread mean jitter:', jitter);
    console.log('last probability:', lastProb);
    console.log('bid probability:', (1-((1-lastProb)/2)) - lastProb);
    console.log('volatility:', volatility);
    console.log('-------------------------------------------------');

    // send the first 'last' price
    socket.in(ticker).emit('quote', { 
        type: 'last',
        timestamp: Date.now(),
        ticker: ticker,
        size: 100,
        price: utils.moneyify(prev) }
    );

    iterator.setIterator(() => {
        now = Date.now();
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
                currentPrice = prev * (1 + jStat.normal.sample( spreadMean , jitter ));
                spread.ask = currentPrice;
                break;
            case 'bid':
                currentPrice = prev / (1 + jStat.normal.sample( spreadMean , jitter ));
                spread.bid = currentPrice;
                break;
            case 'last':
                currentPrice = utils.moneyify((spread.ask + spread.bid) / 2);
        }
        console.log("STREAM QUOTE: ", ticker, type[typeOrd], utils.moneyify(currentPrice), 100, now);
        socket.in(ticker).emit('quote', {
            type: type[typeOrd],
            timestamp: now,
            ticker: ticker,
            size: 100,
            price: utils.moneyify(currentPrice) }
        );
        prev = jStat.normal.inv( Math.random(), prev, volatility );
    }, config.get('simulate.tickrate'));
}