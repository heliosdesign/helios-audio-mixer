/*

  Additional tests for Buffer Source Track

*/
import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import AudioContext from './mocks/AudioContext'

import BufferSourceTrack from '../src/modules/BufferSourceTrack'
import allNodes from '../src/modules/nodes/allNodes'



test('instantiate', t => {

  // without a context
  t.throws(() => {
    let errorTrack = new BufferSourceTrack({ src: 'asdf' })
  })

  let ctx = new AudioContext.Unprefixed()

  // without a source
  t.throws(() => {
    let errorTrack = new BufferSourceTrack({ ctx: ctx })
  })

  // invalid source mode
  t.throws(() => {
    let errorTrack = new BufferSourceTrack({
      source: 'source.src',
      ctx: ctx,
      sourceMode: 'asdfjkl',
    })
  })

  // valid
  let track = new BufferSourceTrack({
    src:     'asdf',
    context:  ctx
  })
  t.truthy(track)
})



test.cb('load', t => {
  let ctx = new AudioContext.Unprefixed()

  // manually stub async functions so we can await them
  let audioData = {}
  window.fetch = sinon.stub().returns( Promise.resolve(audioData) )

  let track = new BufferSourceTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
    autoplay:    false,
    autoload:    false,
  })

  track.play = sinon.spy()

  // ensure all relevant events are triggered
  let events = ['loadstart', 'loadedmetadata', 'canplay', 'canplaythrough']
  let eventSpies = events.map(eventName => {
    let spy = sinon.spy()
    track.on(eventName, spy)
    return spy
  })

  track.load()
    .then(() => {

      t.is(window.fetch.called, true)
      t.is(track.data.audioData, audioData)

      // track shouldn't autoplay
      t.is(track.play.called, false)

      t.is(track.status.ready, true)

      eventSpies.forEach((spy, index) => {
        t.is(spy.called, true, events[index])
      })

      t.end()

    })

})

test('play', t => {
  let ctx = new AudioContext.Unprefixed()

  let track = new BufferSourceTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
    autoplay:    false,
    autoload:    false,
  })

  track.load = sinon.spy()

  track.play()

  t.is(track.load.called, true)
  t.is(track.status.shouldPlayOnLoad, true)

  // ********************************************************

  track.status.ready = true
  track.data.decodedBuffer = { duration: 1 }

  let playSpy = sinon.spy()
  track.on('play', playSpy)

  track.play()

  t.is(track.status.playing, true)
  t.is(playSpy.called, true)

})

test.cb('ended event', t => {
  let ctx = new AudioContext.Unprefixed()

  let track = new BufferSourceTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
    autoplay:    false,
    autoload:    false,
  })

  // fake load
  track.status.ready = true
  track.data.decodedBuffer = { duration: 0.1 }

  track.play()

  t.truthy(track.data.onendtimer)
  t.is(track.data.timerDuration, 0.1)

  track.on('ended', function(){
    t.end()
  })

})


test.cb('pause', t => {
  let ctx = new AudioContext.Unprefixed()

  let track = new BufferSourceTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
    autoplay:    false,
    autoload:    false,
  })

  track.load = sinon.spy()

  // test shouldPlayOnLoad
  track.play()
  t.is(track.load.called, true)
  t.is(track.status.shouldPlayOnLoad, true)

  track.pause()
  t.is(track.status.shouldPlayOnLoad, false)

  // fake load, then pause for real
  track.status.ready = true
  track.data.decodedBuffer = { duration: 1 }

  track.play()

  let pauseSpy = sinon.spy()
  track.on('pause', pauseSpy)

  sinon.spy(window, 'clearTimeout')

  setTimeout(() => {

    track.data.source.context.currentTime = 0.1

    track.pause()

    t.is(window.clearTimeout.called, true)
    t.is(track.status.playing, false)
    t.is(pauseSpy.called, true)
    t.is(track.data.cachedTime, 0.1)

    t.end()

  }, 100)

})

test('pause and restart at the right time', t => {
  let ctx = new AudioContext.Unprefixed()

  let track = new BufferSourceTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
    autoplay:    false,
    autoload:    false,
  })

  track.status.ready = true
  track.data.decodedBuffer = { duration: 1 }

  track.play()

  track.data.source.context.currentTime = 0.1
  track.pause()

  t.is(track.status.playing, false)
  t.is(track.data.cachedTime, 0.1)

})


test('volume', t => {
  let ctx = new AudioContext.Unprefixed()
  let mixVolume = 1
  let mix = { volume: function(){ return mixVolume } }

  let track = new BufferSourceTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
    autoplay:    false,
    autoload:    false,
    mix:         mix,
  })

  // set volume before track is ready
  track.volume(0.5)
  t.is(track.data.gain, 0.5)

  // fake create track
  track.status.ready = true
  track.data.decodedBuffer = { duration: 100 }

  track.play()

  let gainNode = track.node('GainNode')
  t.is(gainNode instanceof allNodes.GainNode, true)
  t.is(gainNode.gain(), 0.5)

  // set the gain while playing -> direct to the gain node
  track.volume(0.25)
  t.is(gainNode.gain(), 0.25)

  // mute and unmute - should remember previous gain level
  track.muted(true)
  t.is(gainNode.gain(), 0)
  t.is(track.status.muted, true)
  t.is(track.muted(), true)

  track.muted(false)
  t.is(gainNode.gain(), 0.25)
  t.is(track.status.muted, false)
  t.is(track.muted(), false)

})











/*

  Audio Element Source

*/

// test('load an element source', async t => {

//   let src = 'path/to/audio/file'

//   let ctx = new AudioContext.Unprefixed()

//   let eventListenerFunction
//   let element = {
//     addEventListener: function(e, fn){ eventListenerFunction = fn },
//     removeEventListener: sinon.spy(),
//   }
//   document.createElement = sinon.stub().returns(element)

//   ctx.createMediaElementSource = sinon.spy()

//   let track = new BufferSourceTrack({
//     src:         src,
//     context:     ctx,
//     sourceMode: 'element'
//   })

//   track.play()

//   t.is(document.createElement.calledWith('audio'), true)
//   t.is(ctx.createMediaElementSource.calledWith(element), true)

//   track.play = sinon.spy()
//   eventListenerFunction()

//   t.is(track.play.called, true)

// })

/*

  Media Stream Source

*/

// test('load a media stream source', t => {
//   let mediaStream = {}
//   let ctx = new AudioContext.Unprefixed()

//   let track = new BufferSourceTrack({
//     src:         mediaStream,
//     context:     ctx,
//     sourceMode: 'stream'
//   })

//   let mediaStreamSource = {}
//   ctx.createMediaStreamSource = sinon.stub().returns(mediaStreamSource)

//   track.play()

//   t.is(ctx.createMediaStreamSource.calledWith(mediaStream), true)
//   t.is(track.data.source, mediaStreamSource)

// })


