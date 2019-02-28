/*

  Timeline Events (all tracks)

*/

import test from 'ava'
import sinon from 'sinon'

import BaseTrack from '../src/modules/BaseTrack'
import Tracks from '../src/modules/trackTypes'
import AudioContext from './mocks/AudioContext'

let trackId  = 'track'
let trackSrc = 'file.ext'

let trackTypes = {
  'BaseTrack': {
    track: BaseTrack,
    options: {
      id: trackId
    }
  },
  'Html5Track': {
    track: Tracks.Html5Track,
    options: {
      id:  trackId,
      src: trackSrc
    }
  },
  'ElementSourceTrack': {
    track: Tracks.ElementSourceTrack,
    options: {
      id:  trackId,
      src: trackSrc,
      context: new AudioContext.Unprefixed()
    }
  },
  'BufferSourceTrack': {
    track: Tracks.BufferSourceTrack,
    options: {
      id:  trackId,
      src: trackSrc,
      context: new AudioContext.Unprefixed()
    }
  }
}

Object.keys(trackTypes).forEach(trackType => {
  let Track   = trackTypes[trackType].track
  let options = trackTypes[trackType].options

  test(`${trackType}: create timeline events`, t => {

    let callback = function(){}
    let timelineEvents = [{ time: 0, callback }]
    let track = new Track(Object.assign(options, { timelineEvents }))

    t.truthy(track.timelineEvents[0])

    t.is( track.timelineEvents[0].time, 0 )
    t.is( track.timelineEvents[0].callback, callback )
  })

  test(`${trackType}: fire timeline events`, t => {

    let callback  = sinon.spy()
    let callback2 = sinon.spy()

    let timelineEvents = [
      { time: 0, callback: callback  },
      { time: 1, callback: callback2 }
    ]
    let track = new Track(Object.assign(options, { timelineEvents }))

    track.updateTimelineEvents(0)
    t.truthy(callback.called)
    t.falsy(callback2.called)

    track.updateTimelineEvents(0.5)
    t.truthy(callback.calledOnce)
    t.falsy(callback2.called)

    track.updateTimelineEvents(1.5)

    t.truthy(callback.calledOnce)
    t.truthy(callback2.called)
  })

  test(`${trackType}: timeline event callbacks receive track as this`, t => {

    let callback  = sinon.spy()

    let timelineEvents = [{ time: 0, callback: callback  }]
    let track = new Track(Object.assign(options, { timelineEvents }))

    track.updateTimelineEvents(0)
    t.truthy( callback.called )
    t.truthy( callback.calledOn(track) ) // calledOn checks this value
  })
})
