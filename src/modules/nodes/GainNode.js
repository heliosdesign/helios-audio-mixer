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


  // tweenGain(0, 1, 'linear')
  tweenGain(setTo, duration, rampType){
    // rampType should default to exponential, not linear, for more
    // even sounding crossfading (no volume dip in the middle)
  }

  muted(setTo){

  }
}

export default GainNode