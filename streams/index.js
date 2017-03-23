var trade = require('../lib/trading');

var intervals = {};

module.exports = function(server, io) {
    var socketsServer = io.listen(server);
    socketsServer.sockets.on('connection', function(socket) {
        console.log('Welcome to the GroundWire stock price stream');
        intervals.polling = setInterval(function() {
            trade.getYahooPrice('GEVO')
            .then(function(data) {
                console.log('Sending to client: $' + data.price + ' traded at ' + data.time);
                socket.emit('price', data);
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