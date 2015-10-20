/*

  Debug

*/

var u = require('./utils')

var debug = {};
module.exports = debug;

// 0 no logging, 1 minimal, 2 all (spammy)
debug.level = 1;

// u.log(1, arg, arg, arg) -> console.log('[Mixer] arg arg arg')
debug.log = function(lvl) {
  if(lvl <= debug.level) {
    var str = '[Mixer] '
    for (var i = 1; i < arguments.length; i++)
      str += arguments[i] + ' '
    console.log(str)
  }
}

debug.setLogLvl = function(lvl) {
  this.debug = u.constrain(lvl, 0, 2);
  debug.log(0, 'Set log level:', lvl)
}