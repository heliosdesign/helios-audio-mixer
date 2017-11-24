/*

  Pan Node (3D)

*/

class PanNode3D {
  constructor(params){
    let ctx = params.context
    this.myNode = {} //ctx.createNodeType ? ctx.createNodeType() : ctx.createType()

    // additional setup here
  }

  connect(previousNode){
    previousNode.connect(this.myNode)
    return this.myNode
  }
}

export default PanNode3D