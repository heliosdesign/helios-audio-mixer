/*

  Gain Node

  let g = new GainNode({
    context: context,
    gain:    1,
  })

  g.node -> the web audio node object

  g.gain(setTo)  -> getter/setter
  g.muted(setTo) -> getter/setter

  g.tweenGain(setTo, duration)

*/

import utils from '../utils.js'

export default class GainNode {
  constructor(params) {
    let state  = this
    state.ctx  = params.context
    state.node = state.ctx.createGainNode ? state.ctx.createGainNode() : state.ctx.createGain()

    state.gain( typeof params.gain === 'number' ? params.gain : 1 )
  }

  gain(setTo) {
    let state = this

    if (typeof setTo === 'number') {
      /*

        'AudioParam value setter will become equivalent to AudioParam.setValueAtTime() in (Chrome) M65'

        Apparently, it's bad form to set gain.value directly now, ie
        'this.node.gain.value = u.normalize(setTo, 0, 1)'

        Recommended behaviour now is to use setTargetAtTime.

        - https://www.chromestatus.com/features/5287995770929152
        - https://github.com/mrdoob/three.js/pull/11133

        setTargetAtTime( value, start time (clamped to current time), time constant )

      */

      state.node.gain.setTargetAtTime(utils.normalize(setTo), state.ctx.currentTime, 0)
    }
    return state.node.gain.value
  }

  /*

    tweenGain(0, 1, 'linear')
    using an exponential ramp (not linear) for a more even crossfade
    (linear creates a volume dip in the middle)

  */

  tweenGain(setTo, duration) {
    let state = this

    if (typeof state.node.gain.exponentialRampToValueAtTime === 'function') {
      setTo = utils.normalize(setTo)
      if (setTo === 0) { setTo = 0.000001 } // can't use zero for ramps

      state.node.gain.exponentialRampToValueAtTime(setTo, state.ctx.currentTime + duration)
    }
  }

  muted(setTo) {}
}
