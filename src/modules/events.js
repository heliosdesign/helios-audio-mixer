/*

  Simple event system

*/
var Events = function(){

  var events = {};

  return {
    on:      on,
    one:     one,
    off:     off,
    trigger: trigger
  }

  function on(type, callback) {
    events[type] = events[type] || [];
    events[type].push({
      id: (new Date).getTime(),
      cb: callback
    });

    return this
  }

  // todo: make this not wipe out other events of its type
  function one(type, callback) {
    var _this = this
    events[type] = events[type] || [];

    var id = (new Date).getTime();
    var cb = function(){
      _this.off(type, id);
      callback(_this);
    };

    events[type].push({ id: id, cb: cb });

    return this
  }

  function off(type, id) {
    if(type === '*'){
      events = {};
    } else if( !!(type) && typeof id !== 'undefined' ){
      for (var i = events[type].length - 1; i >= 0; i--) {
        if( events[type][i].id === id ){
          events[type].splice(i,1);
        }
      };
    } else {
      events[type] = [];
    }

    return this
  }

  function trigger(type) {
    if(!events[type]) return;
    var _this = this

    var args = Array.prototype.slice.call(arguments, 1);

    if(events[type].length)
      events[type].forEach(function(f){
        f.cb.apply(_this, args);
      })
  }
}

module.exports = Events;