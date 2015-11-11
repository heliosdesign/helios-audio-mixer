var Events = function(that){

  var events = [];

  return {
    on:      on,
    one:     one,
    off:     off,
    trigger: trigger
  }

  function on(type, callback) {
    events[type] = events[type] || [];
    events[type].push(callback);

    return that
  }

  function one(type, callback) {
    var _this = this
    events[type] = events[type] || [];
    events[type].push(function(){
      _this.off(type)
      callback()
    });

    return that
  }

  function off(type) {
    if(type === '*') events = {};
    else             events[type] = [];

    return that
  }

  function trigger(type) {

    if(!events[type]) return;

    var args = Array.prototype.slice.call(arguments, 1);

    if(events[type].length)
      events[type].forEach(function(f){
        f.apply(this, args);
      })

  }
}

module.exports = Events

