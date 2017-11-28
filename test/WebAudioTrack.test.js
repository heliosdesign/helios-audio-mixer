
import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import Nodes from '../src/modules/nodes/allNodes'

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

  let mockSource = { connect: sinon.spy() }
  let nodes = track.createNodes( ['GainNode'], mockSource )

  t.is(track.allNodes instanceof Array, true)
  t.is(track.allNodes.length, 1)

})

test('create nodes (with parameters)', t => {
  let ctx = new MockUnprefixedAudioContext()

  let track = new WebAudioTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
  })

  t.is(track.options.nodes instanceof Array, true)

  let nodeArray = [
    'GainNode',
    { type: 'GainNode' },
    { type: 'GainNode', options: {} },
    new Nodes.GainNode({ context: ctx }),
  ]
  let mockSource = { connect: sinon.spy() }
  track.createNodes( nodeArray, mockSource )

  t.is(track.allNodes instanceof Array, true)
  t.is(track.allNodes.length, 4)

})

test('passing invalid arguments to createNodes throws errors', t => {
  let ctx = new MockUnprefixedAudioContext()

  let track = new WebAudioTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
  })

  // no source
  t.throws(() => {
    track.createNodes( ['GainNode'] )
  })

  // invalid node type
  let mockSource = { connect: sinon.spy() }
  t.throws(() => {
    track.createNodes( ['invalidNode'], mockSource )
  })

})

test('retrieve nodes', t => {
  let ctx = new MockUnprefixedAudioContext()

  let track = new WebAudioTrack({
    src:        'asdf',
    context:     ctx,
    sourceMode: 'buffer',
  })

  let mockSource = { connect: sinon.spy() }
  let nodes = track.createNodes( ['GainNode'], mockSource )

  t.is(track.nodes()[0] instanceof Nodes.GainNode, true)
  t.is(track.node('GainNode') instanceof Nodes.GainNode, true)

})

// test('create nodes (pan2d)', t => {})
