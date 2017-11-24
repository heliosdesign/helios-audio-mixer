/*

  Gather all nodes in a single export.

  All nodes must implement this API:

    let n = new Node({
      lastNode: Node,
      context:  WebAudioContext,
    })
    n.connect(lastNode)


  ie

  class MyNode {
    constructor(params){
      let ctx = params.context
      this.myNode = ctx.createNodeType ? ctx.createNodeType() : ctx.createType()

      // additional setup here
    }

    connect(previousNode){
      previousNode.connect(this.myNode)
      return this.myNode
    }
  }

*/
import GainNode from './GainNode'
import PanNode2D from './PanNode2D'
import PanNode3D from './PanNode3D'

export default { GainNode, PanNode2D, PanNode3D }