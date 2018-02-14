

import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import BaseTrack from '../src/modules/BaseTrack'

test('create timeline events', t => {

  let callback = function(){}

  let track = new BaseTrack({
    id: 'asdf',
    timelineEvents: [
      { time: 0, callback }
    ]
  })

  t.truthy(track.timelineEvents[0])

  t.is( track.timelineEvents[0].time, 0 )
  t.is( track.timelineEvents[0].callback, callback )

})

test('fire timeline events', t => {

  let callback  = sinon.spy()
  let callback2 = sinon.spy()

  let track = new BaseTrack({
    id: 'asdf',
    timelineEvents: [
      { time: 0, callback: callback  },
      { time: 1, callback: callback2 },
    ]
  })

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

test('timeline event callbacks receive track as this', t => {

  let callback  = sinon.spy()

  let track = new BaseTrack({
    id: 'asdf',
    timelineEvents: [
      { time: 0, callback: callback  },
    ]
  })

  track.updateTimelineEvents(0)
  t.truthy( callback.called )
  t.truthy( callback.calledOn(track) ) // calledOn checks this value

})
