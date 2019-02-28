/*

  Analyser Node (FFT)

*/

export default class AnalyserNode {
  constructor(params) {
    let state  = this
    state.ctx  = params.context
    state.node = state.ctx.createAnalyser()

    state.node.smoothingTimeConstant = 0.2
    state.node.fftSize = 2048

    // create a script processor with bufferSize of 2048
    state.processor = state.ctx.createScriptProcessor(2048, 1, 1)

    state.processor.connect(state.ctx.destination) // processor -> destination
    state.node.connect(state.processor)            // analyser  -> processor

    state.bufferLength = state.node.frequencyBinCount

    state.analysis = {
      raw: new Uint8Array(state.bufferLength),
      average: 0,
      low:     0,
      mid:     0,
      high:    0
    }
  }

  connect(to) {
    let state = this
    state.node.connect(to)
  }

  get() {
    let state   = this
    const third = Math.round(state.bufferLength / 3)
    let scratch = 0
    let i = 0

    state.node.getByteFrequencyData(state.analysis.raw)

    // calculate average
    scratch = 0
    for (i = 0; i < state.bufferLength; i++) {
      scratch += state.analysis.raw[i]
    }
    state.analysis.average = (scratch / state.bufferLength) / 256

    // lows
    scratch = 0
    for (i = 0; i < third; i++) {
      scratch += state.analysis.raw[i]
    }
    state.analysis.low = (scratch / third) / 256

    // mids
    scratch = 0
    for (i = third; i < (third * 2); i++) {
      scratch += state.analysis.raw[i]
    }
    state.analysis.mid = (scratch / third) / 256

    // highs
    scratch = 0
    for (i = (third * 2); i < state.bufferLength; i++) {
      scratch += state.analysis.raw[i]
    }
    state.analysis.high = (scratch / third) / 256

    return state.analysis
  }
}
