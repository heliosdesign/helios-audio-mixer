/*

  Standard Node Methods
  (all nodes should pass this test)

*/
import test from 'ava'
import sinon from 'sinon'

import nodes from '../src/modules/nodes/allNodes'

/*

  Mocks

*/

let mockGainNode = {}

// Edge, Chrome, FF
class mockUnprefixedAudioContext {
  constructor(params){}

  createGainNode(){}
}

// safari
class mockPrefixedAudioContent {
  constructor(params){}

  createGain(){}
}


/*

  Environments

*/
let environments = [
  {
    name:   'unprefixed',
    context: mockUnprefixedAudioContext,
  },
  {
    name:   'prefixed',
    context: mockPrefixedAudioContent,
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