/*

  Standard Node Methods
  (all nodes should pass this test)

*/
import test from 'ava'
import sinon from 'sinon'

import MockUnprefixedAudioContext from './mocks/UnprefixedAudioContext'
import MockPrefixedAudioContext from './mocks/PrefixedAudioContext'

import nodes from '../src/modules/nodes/allNodes'


/*

  Environments

*/
let environments = [
  {
    name:   'unprefixed',
    context: MockUnprefixedAudioContext,
  },
  {
    name:   'prefixed',
    context: MockPrefixedAudioContext,
  },
]



/*

  Tests

*/
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
      let previousNode = { connect: sinon.spy() }

      let n = node.connect(previousNode)

      t.is(previousNode.connect.called, true)
    })

  })

})