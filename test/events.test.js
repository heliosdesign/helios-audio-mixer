/*

  Test event functionality, inherited from BaseTrack.
  All track types should pass these tests.

*/
import test from 'ava'
import sinon from 'sinon'

// track types to test
import BaseTrack from '../src/modules/BaseTrack'
import Html5Track from '../src/modules/Html5Track'
import BufferSourceTrack from '../src/modules/BufferSourceTrack'

// some track types require more params to initialize
let trackTypes = {
  'BaseTrack': {
    track: BaseTrack,
    params: {
      id: 'id'
    },
  },
  'Html5Track': {
    track: Html5Track,
    params: {
      id: 'hi',
      src: 'hi',
    },
  },
  'BufferSourceTrack': {
    track: BufferSourceTrack,
    params: {
      id: 'hi',
      src: 'hi',
      context: {}, // dummy web audio context
    },
  },
}

Object.keys(trackTypes).forEach(trackType => {
  let Track = trackTypes[trackType].track
  let params = trackTypes[trackType].params

  test(trackType + ': register an event', t => {
    let track = new Track(params)
    let eventName = 'eeeeee'
    let callback = sinon.spy()
    track.on(eventName, callback)

    t.is(track.events[eventName][0], callback)
  })

  test(trackType + ': don’t register invalid events', t => {
    let track = new Track(params)

    t.throws(() => track.on(12345, function(){}))
    t.throws(() => track.on('validEventName'))
  })

  test(trackType + ': trigger an event', t => {
    let track = new Track(params)
    let eventName = 'eeeeee'
    let callback = sinon.spy()
    let eventData = {}

    track.on(eventName, callback)

    track.trigger(eventName, eventData)

    t.is(callback.calledOn(track), true)
    t.is(callback.calledWith(eventData), true)
  })

  test(trackType + ': remove an event', t => {
    let track = new Track(params)
    let eventName = 'asdfjkl'
    let callback = sinon.spy()
    let callback2 = sinon.spy()
    let eventData1 = {}
    let eventData2 = {}

    track.on(eventName, callback)
    track.on(eventName, callback2)

    track.off(eventName, callback)

    track.trigger(eventName, eventData1, eventData2)

    t.is(callback.called, false)
    t.is(callback2.calledWith(eventData1, eventData2), true)
  })

  test(trackType + ': remove all events for a given event type', t => {
    let track = new Track(params)
    let eventName = 'fffff'
    let callback = sinon.spy()
    let callback2 = sinon.spy()
    let eventData = {}

    track.on(eventName, callback)
    track.on(eventName, callback2)

    track.off(eventName)

    track.trigger(eventName, eventData)

    t.is(callback.called, false)
    t.is(callback2.called, false)
  })

  test(trackType + ': register a one-time event', t => {
    let track = new Track(params)
    let eventName = 'fffff'
    let callback = sinon.spy()

    track.one(eventName, callback)
    track.trigger(eventName)
    track.trigger(eventName)

    t.is(callback.called, true)

    track.trigger(eventName)

    t.is(callback.calledTwice, false)

  })

})

