/*

  Utils

*/

var u = {};
module.exports = u;


u.extend = function() {
  var output = {}
  var args = arguments
  var l = args.length

  for (var i = 0; i < l; i++)
    for (var key in args[i])
      if(args[i].hasOwnProperty(key))
        output[key] = args[i][key];
  return output;
}

u.constrain = function(val, min, max) {
  if(val < min) return min;
  if(val > max) return max;
  return val;
}


/*

  Events

*/
u.events = {};
u.events.on = function(type, callback) {
  this.events[type] = this.events[type] || [];
  this.events[type].push(callback);

  return this
}

u.events.one = function(type, callback) {
  var _this = this
  this.events[type] = this.events[type] || [];
  this.events[type].push(function(){
    _this.off(type)
    callback()
  });

  return this
}

u.events.off = function(type) {
  if(type === '*')
    this.events = {};
  else
    this.events[type] = [];

  return this
}

u.events.trigger = function(type) {

  if(!this.events[type]) return;

  var args = Array.prototype.slice.call(arguments, 1);

  for (var i = 0, l = this.events[type].length; i < l; i++)
      if(typeof this.events[type][i] === 'function')
        this.events[type][i].apply(this, args);

}

