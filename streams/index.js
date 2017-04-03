var trade = require('../lib/trading');

var intervals = {};

module.exports = function(server, io) {
    var socketsServer = io.listen(server);
    socketsServer.sockets.on('connection', function(socket) {
        var ticker = socket.handshake.query ? socket.handshake.query.ticker : "NULL";
        socket.join(ticker);
        intervals.polling = setInterval(function() {
            trade.getYahooPrice(ticker)
            .then(function(data) {
                console.log('Sending to client: $' + data.price + ' traded at ' + data.time);
                socketsServer.in(ticker).emit('price', data);
            })
            .catch(function(err){
                console.log(error);
            });
        }, 3000);
        socket.on('disconnect', function() {
            clearInterval(intervals.polling);
            console.log('Thank you for using the GroundWire stock price stream');
        });
    });
}