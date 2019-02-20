/*

  Web Audio API track - to be extended

    adds node functionality to base track

*/
import BaseTrack from './BaseTrack'
import utils from './utils'

import Nodes from './nodes/allNodes'

class WebAudioTrack extends BaseTrack {
  constructor(params){
    super(params)
    let track = this

    let defaults = {
      src:      '',
      context:  false,
      nodes:    [],
    }
    track.options = Object.assign(defaults, params)

    track.data = {}

    // reference nodes by ???
    track.allNodes   = []
    track.nodeLookup = {}
  }


  /*

    input is an array

  */
  createNodes(nodes, source){
    let track = this

    if(!source){
      throw new Error('Can’t create nodes without a valid source.')
    } else if(!source.connect){
      throw new Error('Can’t create nodes without a valid source.')
    }

    // clear previous set of nodes (we recreate nodes every time we play)
    track.allNodes = []

    let previousNode = source
    nodes.forEach(n => {

      let baseParams = {
        context: track.options.context
      }

      // determine node type by duck typing
      if(typeof n === 'string'){
        // predefined node with all defaults, no options

        if(Nodes[n]){

          let newNode = new Nodes[n](baseParams)
          track.allNodes.push(newNode)
          track.nodeLookup[n] = newNode

          previousNode.connect(newNode.node)
          previousNode = newNode.node

        } else {
          throw new Error(`Node type ${n} does not exist.`)
        }

      } else if(typeof n === 'object'){
        if( n.type ){
          // create predefined node with options
          let nodeType = Nodes[n.type]

          if(nodeType){
            let newNode = new nodeType( Object.assign(baseParams, n.options) )

            track.allNodes.push(newNode)
            track.nodeLookup[n.type] = newNode

            previousNode.connect(newNode.node)
            previousNode = newNode.node

          } else {
            throw new Error(`Node type ${n.type} does not exist.`)
          }

        } else if(n.node) {
          // create custom node, this is a raw node object

          track.allNodes.push(n)

          previousNode.connect(n.node)
          previousNode = n.node

        }
      }

    })

    previousNode.connect(track.options.context.destination)

  }

  nodes(){
    return this.allNodes
  }

  node(id){
    return this.nodeLookup[id] || false
  }

}

export default WebAudioTrack
