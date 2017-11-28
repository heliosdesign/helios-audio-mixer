/*

  Additional tests for Buffer Source Track

*/
import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import MockUnprefixedAudioContext from './mocks/UnprefixedAudioContext'
import MockPrefixedAudioContext from './mocks/PrefixedAudioContext'

import BufferSourceTrack from '../src/modules/BufferSourceTrack'



test('instantiate', t => {

  // without a context
  t.throws(() => {
    let errorTrack = new BufferSourceTrack({ src: 'asdf' })
  })

  let ctx = new MockUnprefixedAudioContext()

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
  let ctx = new MockUnprefixedAudioContext()

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

      t.is(track.play.called, false)

      t.is(track.status.ready, true)

      eventSpies.forEach((spy, index) => {
        t.is(spy.called, true, events[index])
      })

      t.end()

    })

})

// test.cb('autoplay triggers play() call', t => {
//   let ctx = new MockUnprefixedAudioContext()

//   window.fetch = sinon.stub().returns(Promise.resolve())

//   let decodePromise = Promise.resolve()
//   ctx.decodeAudioData = sinon.stub().returns(decodePromise)

//   let track = new BufferSourceTrack({
//     src:        'asdf',
//     context:     ctx,
//     sourceMode: 'buffer',
//     autoplay:    true,
//   })
//   sinon.spy(track, 'play')

//   track.on('canplaythrough', () => {
//     t.is(track.play.called, true)
//     t.end()
//   })

// })

// test.cb('create (unprefixed)', t => {
//   let ctx = new MockUnprefixedAudioContext()

//   let track = new BufferSourceTrack({
//     src:        'asdf',
//     context:     ctx,
//     sourceMode: 'buffer',
//   })

//   sinon.spy(ctx, 'createBufferSource')

//   track.create()
//     .then(() => {
//       t.is(ctx.createBufferSource.called, true)
//       t.truthy(track.data.source)
//       t.truthy(track.data.source.buffer)
//       t.end()
//     })

// })

// test.cb('create (prefixed)', t => {
//   let ctx = new MockPrefixedAudioContext()

//   let track = new BufferSourceTrack({
//     src:        'asdf',
//     context:     ctx,
//     sourceMode: 'buffer',
//   })

//   sinon.spy(ctx, 'createBufferSource')

//   track.create()
//     .then(() => {
//       t.is(ctx.createBufferSource.called, true)
//       t.truthy(track.data.source)
//       t.truthy(track.data.source.buffer)
//       t.end()
//     })

// })

// test.cb('play (entire flow', t => {})

// test('pause', t => {})

// test('stop', t => {})













/*

  Audio Element Source

*/

// test('load an element source', async t => {

//   let src = 'path/to/audio/file'

//   let ctx = new MockUnprefixedAudioContext()

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
//   let ctx = new MockUnprefixedAudioContext()

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


