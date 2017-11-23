/*

  base Track class, with event functionality

*/


class BaseTrack {
  constructor(options){
    this.id = options.id
    this.events = {}
  }

  on(eventName, callback){
    let track = this

    if(typeof eventName !== 'string'){
      throw new Error('Event name must be a string.')
    } else if(!callback) {
      throw new Error('Can’t register an event without a callback.')
    } else {
      if(track.events[eventName]){
        track.events[eventName].push(callback)
      } else {
        track.events[eventName] = [callback]
      }
    }

    return track
  }

  off(eventName, callback){
    let track = this

    if(callback){
      // remove specific callback
      if(track.events[eventName]){
        let index = track.events[eventName].indexOf(callback)
        track.events[eventName].splice(index,1)
      }
    } else {
      // remove all callbacks for a given event name
      if(track.events[eventName]){
        track.events[eventName] = []
      }
    }

    return track
  }

  one(eventName, callback){
    let track = this

    let wrappedCallback = function(){
      track.off(eventName, wrappedCallback)
      callback()
    }

    track.on(eventName, wrappedCallback)

    return track
  }

  trigger(eventName){
    let track = this

    if(track.events[eventName]){
      let args = Array.prototype.slice.call(arguments, 1)
      track.events[eventName].forEach(fn => fn.apply(track, args))
    }

    return track
  }

  destroy(){}
}

module.exports = BaseTrack
