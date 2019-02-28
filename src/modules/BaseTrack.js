/*

  base Track class, with event and timeline functionality

*/

export default class BaseTrack {
  constructor(params) {
    let track = this

    track.id     = params.id
    track.events = {}
    track.timelineEvents = params.timelineEvents ? [...params.timelineEvents ] : []
  }

  destroy() {}

  /*

    Events

  */

  on(eventName, callback) {
    let track = this

    if (typeof eventName !== 'string') {
      throw new Error('Event name must be a string.')
    }

    if (!callback) {
      throw new Error('Can’t register an event without a callback.')
    }

    track.events[eventName] ? track.events[eventName].push(callback) : track.events[eventName] = [callback]

    return track
  }

  off(eventName, callback) {
    let track = this

    if (track.events[eventName]) {
      if (callback) { // remove specific callback
        const index = track.events[eventName].indexOf(callback)
        track.events[eventName].splice(index,1)
      } else {        // remove all callbacks for a given event name
        track.events[eventName] = []
      }
    }

    return track
  }

  one(eventName, callback) {
    let track = this

    const wrappedCallback = function() {
      track.off(eventName, wrappedCallback)
      callback()
    }

    track.on(eventName, wrappedCallback)

    return track
  }

  trigger(eventName) {
    let track = this

    if (track.events[eventName]) {
      const args = Array.prototype.slice.call(arguments, 1)
      track.events[eventName].forEach(fn => fn.apply(track, args))
    }

    return track
  }

  /*

    Timeline

      check if any events need to be triggered
      this is called by the mixer using requestAnimationFrame

  */

  updateTimelineEvents(time) {
    let track = this
    let e

    for (let i = 0; i < track.timelineEvents.length; i++) {
      e = track.timelineEvents[i]
      if (time >= e.time && !e.triggered) {
        e.triggered = true
        if (e.callback) { e.callback.call(track) }
      }
    }
  }
}
