/*

  Mock W3C Standard Audio Context
    (Edge, Chrome, FF)

    for use with Sinon

*/
import sinon from 'sinon'

let dummyNode = { connect: sinon.spy() }

class UnprefixedAudioContext {
  constructor(params){
    this.currentTime = (new Date()).getTime()
    this.destination = {}
  }

  createGain(){ return dummyNode }

  createPanner(){ return dummyNode }

  createBufferSource(){
    let bufferSource = {}

    bufferSource.start = sinon.spy()
    bufferSource.connect = sinon.spy()
    bufferSource.context = { currentTime: 0 }

    return bufferSource
  }

  decodeAudioData(audioData, callback){
    let decodedBuffer = { duration: 1 }
    callback(decodedBuffer)
  }
}

export default UnprefixedAudioContext