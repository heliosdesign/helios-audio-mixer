
import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import MockUnprefixedAudioContext from './mocks/UnprefixedAudioContext'
import MockPrefixedAudioContext from './mocks/PrefixedAudioContext'

import WebAudioTrack from '../src/modules/WebAudioTrack'



test('create nodes (default gain node)', t => {
  let ctx = new MockUnprefixedAudioContext()

  let track = new WebAudioTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
  })

  t.is(track.options.nodes instanceof Array, true)


  let nodes = track.createNodes( ['GainNode'] )


})

// test('create nodes (pan2d)', t => {})
