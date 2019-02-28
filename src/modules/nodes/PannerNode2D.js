/*

  Pan Node (2D - left/right)

*/

export default class PannerNode2D {
  constructor(params) {
    let state = this
    state.ctx = params.context

    // the name of this function is the same for
    // both prefixed and unprefixed audio contexts
    state.node = state.ctx.createPanner()

    state.values = {
      pan:  0,
      panX: 0,
      panY: 0,
      panZ: 0
    }

    // additional setup here
  }

  pan(angle) {
    let state = this

    if (typeof angle === 'string') {
      if (angle === 'front') { angle =   0 }
      if (angle === 'back' ) { angle = 180 }
      if (angle === 'left' ) { angle = 270 }
      if (angle === 'right') { angle =  90 }
    }

    if (typeof angle === 'number') {
      state.values.pan = angle % 360

      const angleRad = (-angle + 90) * 0.017453292519943295 // * PI/180

      let x = state.values.panX = Math.cos(angleRad)
      let y = state.values.panY = Math.sin(angleRad)
      let z = state.values.panZ = -0.5

      state.node.setPosition(x, y, z)
    }

    return state.values.pan
  }

  tweenPan(angle, duration) {}
}
