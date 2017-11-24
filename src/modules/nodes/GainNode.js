/*

  Gain Node

  let g = new GainNode({
    context: context,
    gain:    1,
  })

  g.connect(previousNode)

  g.gain(setTo) -> getter/setter
  g.muted(setTo) -> getter/setter

  g.tweenGain(setTo, duration)

*/
import u from '../utils'

class GainNode {
  constructor(params){
    let ctx = params.context
    this.gainNode = ctx.createGainNode ? ctx.createGainNode() : ctx.createGain()

    this.gainValue = 1
    this.gain( typeof params.gain === 'number' ? params.gain : 1 )

  }

  connect(previousNode){
    previousNode.connect(this.gainNode)
    return this.gainNode
  }

  gain(setTo){
    if(typeof setTo === 'number'){
      setTo = u.normalize(setTo, 0, 1)
    }

    return this.gain
  }

  tweenGain(setTo, duration){

  }

  muted(setTo){

  }
}

export default GainNode