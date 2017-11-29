/*

  Standard Node Methods
  (all nodes should pass this test)

  - instantiate
  - connect

  that's it!

*/
import test from 'ava'
import sinon from 'sinon'

import AudioContext from './mocks/AudioContext'

import nodes from '../src/modules/nodes/allNodes'


// Test environments
let environments = [
  { name:   'unprefixed',
    context: AudioContext.Unprefixed,
  },
  { name:   'prefixed',
    context: AudioContext.Prefixed,
  },
]

environments.forEach(env => {

  Object.keys(nodes).forEach(key => {
    let Node = nodes[key]

    let context = new env.context()
    let params  = { context }

    test(`${key} (${env.name}): instantiate`, t => {
      let node = new Node(params)
      t.is(node instanceof Node, true)
    })

    test(`${key} (${env.name}): connect to previous node`, t => {
      let node = new Node(params)
      t.is(typeof node.connect === 'function', true)
      node.connect({})
    })

  })

})