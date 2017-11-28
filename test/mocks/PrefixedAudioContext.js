/*

  Mock Webkit Prefixed Audio Context
    safari (only)

*/
import sinon from 'sinon'

let dummyNode = { connect: sinon.spy() }

class PrefixedAudioContent {
  constructor(params){
    this.destination = {}
  }

  createGainNode(){ return dummyNode }

  createPanner(){ return dummyNode }

  createBufferSource(){
    let bufferSource = {}
    bufferSource.start = sinon.spy()
    bufferSource.connect = sinon.spy()
    bufferSource.context = { currentTime: 0 }

    return bufferSource
  }

  createBuffer(audioData, ){
    let decodedBuffer = { duration: 1 }
    return decodedBuffer
  }

}

export default PrefixedAudioContent