/*

  Pan Node (3D)

*/

export default class PanNode3D {
  constructor(params) {
    let state = this
    state.ctx = params.context

    // the name of this function is the same for
    // both prefixed and unprefixed audio contexts
    state.node = state.ctx.createPanner()

    // additional setup here
  }
}
