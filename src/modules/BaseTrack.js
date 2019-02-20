/*

  base Track class, with event and timeline functionality

*/


class BaseTrack {
  constructor(params){
    this.id = params.id
    this.events = {}
    this.timelineEvents = params.timelineEvents ? [...params.timelineEvents] : []
  }

  destroy(){}

  /*

    Events

  */
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


  /*

    Timeline

      check if any events need to be triggered

      this is called by the mixer using requestAnimationFrame

  */

  updateTimelineEvents(time){
    let track = this
    let e
    for (var i = 0; i < track.timelineEvents.length; i++) {
      e = track.timelineEvents[i]
      if(time >= e.time && !e.triggered){
        e.triggered = true
        if(e.callback)
          e.callback.call(track)
      }
    }

  }

}

export default BaseTrack
