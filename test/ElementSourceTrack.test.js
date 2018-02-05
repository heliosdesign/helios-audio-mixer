/*

  Additional tests for Buffer Source Track

*/
import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import AudioContext from './mocks/AudioContext'

import ElementSourceTrack from '../src/modules/ElementSourceTrack'
import allNodes from '../src/modules/nodes/allNodes'

test('instantiate', t => {

  // without a context
  t.throws(() => {
    let errorTrack = new ElementSourceTrack({ src: 'asdf' })
  })

  let ctx = new AudioContext.Unprefixed()

  // without a source
  t.throws(() => {
    let errorTrack = new ElementSourceTrack({ ctx: ctx })
  })

  // invalid source mode
  t.throws(() => {
    let errorTrack = new ElementSourceTrack({
      source: 'source.src',
      ctx: ctx,
      sourceMode: 'asdfjkl',
    })
  })

  // valid
  let track = new ElementSourceTrack({
    src:     'asdf',
    context:  ctx
  })
  t.truthy(track)
})


