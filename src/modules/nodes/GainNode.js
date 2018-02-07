/*

  Gain Node

  let g = new GainNode({
    context: context,
    gain:    1,
  })

  g.node -> the web audio node object

  g.gain(setTo) -> getter/setter
  g.muted(setTo) -> getter/setter

  g.tweenGain(setTo, duration)

*/
import u from '../utils'

class GainNode {
  constructor(params){
    this.ctx = params.context
    this.node = this.ctx.createGainNode ? this.ctx.createGainNode() : this.ctx.createGain()

    this.gain( typeof params.gain === 'number' ? params.gain : 1 )
  }

  connect(to){
    this.node.connect(to)
  }

  gain(setTo){
    if(typeof setTo === 'number'){
      /*

        'AudioParam value setter will become equivalent to AudioParam.setValueAtTime() in (Chrome) M65'

        Apparently, it's bad form to set gain.value directly now, ie
        'this.node.gain.value = u.normalize(setTo, 0, 1)'

        Recommended behaviour now is to use setTargetAtTime.

        - https://www.chromestatus.com/features/5287995770929152
        - https://github.com/mrdoob/three.js/pull/11133

      */

      // setTargetAtTime( value, start time (clamped to current time), time constant )
      this.node.gain.setTargetAtTime(u.normalize(setTo), this.ctx.currentTime, 0)

    }
    return this.node.gain.value
  }


  // tweenGain(0, 1, 'linear')
  tweenGain(setTo, duration){
    // using an exponential ramp (not linear) for a more even crossfade
    // (linear creates a volume dip in the middle)

    if(typeof this.node.gain.exponentialRampToValueAtTime === 'function'){
      setTo = u.normalize(setTo)
      if(setTo === 0) setTo = 0.000001 // can't use zero for ramps

      this.node.gain.exponentialRampToValueAtTime(setTo, this.ctx.currentTime + duration)
    }
  }

  muted(setTo){

  }
}

export default GainNode