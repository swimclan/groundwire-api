var trade = require('../lib/trading');

module.exports = function(server, io) {
    io.listen(server).sockets.on('connection', function(socket) {
        console.log('Welcome to the GroundWire stock price stream');
        setInterval(function() {
            trade.getYahooPrice('GEVO')
            .then(function(data) {
               socket.emit('price', { price: data }) 
            })
            .catch(function(err){
                console.log(error);
            });
        }, 3000);
    });
}