/*

  Standard track methods: all track types that play audio
  should pass these tests.

*/
import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import Html5Track from '../src/modules/Html5Track'




let trackId  = 'track'
let trackSrc = 'file.ext'

let trackTypes = {
  'Html5Track': {
    track: Html5Track,
    params: {
      id:  trackId,
      src: trackSrc,
    }
  },
}

Object.keys(trackTypes).forEach(trackType => {
  let Track = trackTypes[trackType].track
  let params = trackTypes[trackType].params

  test(trackType + ': Initialize track', t => {
    let track = new Track(params)
    t.is(track instanceof Track, true)
  })

  let methods = ['play', 'pause']
  methods.forEach(method => {
    test(trackType + ': ' + method + ' a track', t => {
      let track = new Track(params)

      let el = track.el
      el[method] = sinon.stub(el, method)

      track[method]()

      t.is(track.el[method].called, true)
    })
  })


  test(trackType + ': trigger arbitrary event', t => {
    let track = new Track({
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

  test(trackType + ': set the volume', t => {
    let track = new Track({
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

  test(trackType + ': set the current time', t => {
    let track = new Track({
      id:  'track',
      src: 'file.ext',
    })

    let time = 1.3

    t.is(track.currentTime(), 0)

    track.currentTime(time)
    t.is(track.currentTime(), time)
    t.is(track.el.currentTime, time)
  })

  test(trackType + ': get a formatted time', t => {
    let track = new Track({
      id:  'track',
      src: 'file.ext',
    })

    let stub = sinon.stub(track, 'duration').returns(180)

    let time = 90
    track.currentTime(time)

    t.is(track.formattedTime(), '01:30')
    t.is(track.formattedTime(true), '01:30/03:00')

  })

  test.cb(trackType + ': tween volume', t => {
    let mockRaf = createMockRaf()
    window.requestAnimationFrame = mockRaf.raf

    let track = new Track({
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

  test.cb(trackType + ': overwrite a volume tween', t => {
    let mockRaf = createMockRaf()
    window.requestAnimationFrame = mockRaf.raf
    window.cancelAnimationFrame = mockRaf.cancel

    let track = new Track({
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

  test(trackType + ': mute and unmute', t => {
    let track = new Track({
      id: 'track',
      src: 'file.ext',
      muted: true
    })

    t.is(track.muted(), true)

    track.muted(false)

    t.is(track.muted(), false)

  })


  test(trackType + ': start at a specific time', t => t.todo)

  test(trackType + ': chain all non-getter function calls', t => t.todo)

})

