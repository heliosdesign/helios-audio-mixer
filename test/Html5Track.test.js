import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import BaseTrack from '../src/modules/BaseTrack'
import Html5Track from '../src/modules/Html5Track'

test('baseTrack', t => {
  let track = new BaseTrack({ id: 'fuck' })
  t.is(track instanceof BaseTrack, true)
})

test('Initialize a track', t => {
  sinon.spy(document, 'createElement')

  let track = new Html5Track({
    id:  'track',
    src: 'file.ext',
  })

  t.is(track instanceof Html5Track, true)
  t.is(document.createElement.called, true)
  t.is(document.createElement.calledWith('audio'), true)
})

let methods = ['play', 'pause']
methods.forEach(method => {
  test(method + ' a track', t => {
    let track = new Html5Track({
      id:  'track',
      src: 'file.ext',
    })

    let el = track.el
    el[method] = sinon.stub(el, method)

    track[method]()

    t.is(track.el[method].called, true)
  })
})


test('trigger arbitrary event', t => {
  let track = new Html5Track({
    id:  'track',
    src: 'file.ext',
  })
  let eventName = 'asdfjkl'
  let callback = sinon.spy()
  let eventData = {}

  track.on(eventName, callback)

  track.trigger(eventName, eventData)

  t.is(callback.calledOn(track), true)
  t.is(callback.calledWith(eventData), true)
})

test('set the volume', t => {
  let track = new Html5Track({
    id:  'track',
    src: 'file.ext',
  })

  let volumeLevel = 0.5

  t.is(track.volume(), 1)

  track.volume(volumeLevel)
  t.is(track.volume(), volumeLevel)
  t.is(track.el.volume, volumeLevel)

  let negativeVolumeLevel = -1
  track.volume(negativeVolumeLevel)
  t.is(track.volume(), 0)

  let excessiveVolumeLevel = 11
  track.volume(excessiveVolumeLevel)
  t.is(track.volume(), 1)

})

test('set the current time', t => {
  let track = new Html5Track({
    id:  'track',
    src: 'file.ext',
  })

  let time = 1.3

  t.is(track.currentTime(), 0)

  track.currentTime(time)
  t.is(track.currentTime(), time)
  t.is(track.el.currentTime, time)
})

test('get a formatted time', t => {
  let track = new Html5Track({
    id:  'track',
    src: 'file.ext',
  })

  let stub = sinon.stub(track, 'duration').returns(180)

  let time = 90
  track.currentTime(time)

  t.is(track.formattedTime(), '01:30')
  t.is(track.formattedTime(true), '01:30/03:00')

})

test.cb('tween volume', t => {
  let mockRaf = createMockRaf()
  window.requestAnimationFrame = mockRaf.raf

  let track = new Html5Track({
    id:  'track',
    src: 'file.ext',
  })

  track.tweenVolume(0, 1)
    .then(() => {
      t.is( track.el.volume, 0 )
      t.end()
    })

  mockRaf.step({ count: 60 })
})

test.cb('overwrite a volume tween', t => {
  let mockRaf = createMockRaf()
  window.requestAnimationFrame = mockRaf.raf
  window.cancelAnimationFrame = mockRaf.cancel

  let track = new Html5Track({
    id:  'track',
    src: 'file.ext',
  })

  track.tweenVolume(0.5, 1)

  track.tweenVolume(0, 1)
    .then(() => {
      t.is( track.el.volume, 0 )
      t.end()
    })

  mockRaf.step({ count: 60 })
})

// test('chain function calls', t => t.todo)


