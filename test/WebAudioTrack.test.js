
import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import Nodes from '../src/modules/nodes/allNodes'

import AudioContext from './mocks/AudioContext'

import WebAudioTrack from '../src/modules/WebAudioTrack'

let options = {
    src:        'asdf',

    sourceMode: 'buffer',
  }

test('create nodes (default gain node)', t => {
  let context = new AudioContext.Unprefixed()

  let track = new WebAudioTrack(Object.assign(options, { context }))

  t.is(track.options.nodes instanceof Array, true)

  let mockSource = { connect: sinon.spy() }
  let nodes = track.createNodes( ['GainNode'], mockSource )

  t.is(track.allNodes instanceof Array, true)
  t.is(track.allNodes.length, 1)

})

test('create nodes (with parameters)', t => {
  let context = new AudioContext.Unprefixed()

  let track = new WebAudioTrack(Object.assign(options, { context }))

  t.is(track.options.nodes instanceof Array, true)

  let nodeArray = [
    'GainNode',
    { type: 'GainNode' },
    { type: 'GainNode', options: {} },
    new Nodes.GainNode({ context }),
  ]
  let mockSource = { connect: sinon.spy() }
  track.createNodes( nodeArray, mockSource )

  t.is(track.allNodes instanceof Array, true)
  t.is(track.allNodes.length, 4)

})

test('passing invalid arguments to createNodes throws errors', t => {
  let context = new AudioContext.Unprefixed()

  let track = new WebAudioTrack(Object.assign(options, { context }))

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
  let context = new AudioContext.Unprefixed()

  let track = new WebAudioTrack(Object.assign(options, { context }))

  let mockSource = { connect: sinon.spy() }
  let nodes = track.createNodes( ['GainNode'], mockSource )

  t.is(track.nodes()[0] instanceof Nodes.GainNode, true)
  t.is(track.node('GainNode') instanceof Nodes.GainNode, true)

})

// test('create nodes (pan2d)', t => {})
