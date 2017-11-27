/*

  Additional tests for Buffer Source Track

*/
import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import MockUnprefixedAudioContext from './mocks/UnprefixedAudioContext'

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



test('load', async t => {
  let ctx = new MockUnprefixedAudioContext()

  let audioData = {}
  let promise = Promise.resolve(audioData)
  window.fetch = sinon.stub().returns(promise)

  let track = new BufferSourceTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
  })

  // ensure all relevant events are triggered
  let events = ['loadstart', 'loadedmetadata', 'canplay', 'canplaythrough']
  let eventSpies = events.map(eventName => {
    let spy = sinon.spy()
    track.on(eventName, spy)
    return spy
  })

  track.play()
  track.play()
  track.play()
  track.play()
  track.play()

  t.is(window.fetch.called, true)

  track.play()
  track.play()
  track.play()

  await promise

  track.play()
  track.play()
  track.play()

  eventSpies.forEach((spy, index) => {
    t.is(spy.called, true, events[index])
  })

})

test('autoplay triggers play() call', async t => {
  let ctx = new MockUnprefixedAudioContext()
  let promise = Promise.resolve({})
  window.fetch = sinon.stub().returns(promise)
  let track = new BufferSourceTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
    autoplay:    true,
  })
  track.play = sinon.spy()

  await promise

  t.is(track.play.called, true)
})

test.cb('create', t => {
  let ctx = new MockUnprefixedAudioContext()

  let track = new BufferSourceTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
  })

  track.status.loaded = true
  sinon.spy(track, 'create')
  sinon.spy(track, 'createNodes')
  sinon.spy(ctx, 'createBufferSource')

  // play

  track.play()

  t.is(track.create.called, true)
  t.is(ctx.createBufferSource.called, true)

  track.on('play', function(){ t.end() })
})



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


