module.exports = function(io) {
    io.sockets.on('connection', function(socket) {
        console.log('Welcome to the GroundWire stock price stream');
    });
}