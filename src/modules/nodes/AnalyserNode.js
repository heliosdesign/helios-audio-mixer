/*

  Analyser Node (FFT)

*/

class AnalyserNode {
  constructor(params){
    let ctx = params.context

    this.node = ctx.createAnalyser()

    analyserNode.smoothingTimeConstant = 0.2
    analyserNode.fftSize = 32

    // create a script processor with bufferSize of 2048
    this.processor = ctx.createScriptProcessor(2048, 1, 1)

    processorNode.connect(ctx.destination) // processor -> destination
    analyserNode.connect(processorNode)    // analyser  -> processor

    this.bufferLength = analyserNode.frequencyBinCount

    this.analysis = {
      raw: new Uint8Array(options.bufferLength),
      average: 0,
      low:     0,
      mid:     0,
      high:    0,
    }

  }

  connect(to){
    this.node.connect(to)
  }

  get(){

    let third = Math.round(this.bufferLength / 3)
    let scratch = 0
    let i = 0

    this.node.getByteFrequencyData(this.analysis.raw)

    // calculate average, mid, high
    scratch = 0
    for (i = 0 i < this.bufferLength i++)
      scratch += this.analysis.raw[i]

    this.analysis.average = (scratch / this.bufferLength) / 256

    // lows
    scratch = 0
    for (i=0 i < third i++)
      scratch += this.analysis.raw[i]

    this.analysis.low = scratch / third / 256

    // mids
    scratch = 0
    for (i = third i < third*2 i++)
      scratch += this.analysis.raw[i]

    this.analysis.mid = scratch / third / 256

    // highs
    scratch = 0
    for (i= third*2 i < this.bufferLength i++)
      scratch += this.analysis.raw[i]

    this.analysis.high = scratch / third / 256

    return this.analysis
  }
}

export default AnalyserNode