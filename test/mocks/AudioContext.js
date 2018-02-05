/*

  Mock AudioContext

*/
import sinon from 'sinon'


class AudioParam {
  constructor(_val){
    this.value = _val

    this.exponentialRampToValueAtTime = function(){}
    this.linearRampToValueAtTime = function(){}
  }
}

let dummyNode = {
  connect: sinon.spy()
}

let gainNode = {
  gain: new AudioParam(1),
  connect: sinon.spy()
}

let mediaElementSource = { connect: sinon.spy() }


/*

  W3C Standard (Edge, Chrome, FF)

*/
class Unprefixed {
  constructor(params){
    this.currentTime = (new Date()).getTime()
    this.destination = {}
  }

  createGain(){ return gainNode }

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

  createMediaElementSource(){
    return mediaElementSource
  }
}


/*

  Prefixed (Safari, only)

*/
class Prefixed {
  constructor(params){
    this.destination = {}
  }

  createGainNode(){ return gainNode }

  createPanner(){ return dummyNode }

  createBufferSource(){
    let bufferSource = {}
    bufferSource.start = sinon.spy()
    bufferSource.connect = sinon.spy()
    bufferSource.context = { currentTime: 0 }

    return bufferSource
  }

  createBuffer(audioData){
    let decodedBuffer = { duration: 1 }
    return decodedBuffer
  }

  createMediaElementSource(){
    return mediaElementSource
  }

}

export default { Prefixed, Unprefixed }