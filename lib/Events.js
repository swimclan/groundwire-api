var ee = require('event-emitter');

var Emitter = function () { /* .. */ };

ee(Emitter.prototype);

let instance;

module.exports.getInstance = function() {
  if (!instance) {
    instance = new Emitter();
  }
  return instance;
}

