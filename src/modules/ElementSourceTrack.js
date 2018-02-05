/*

  Web Audio API: Element Source track

*/
import WebAudioTrack from './WebAudioTrack'
import utils from './utils'

import nodes from './nodes/allNodes'

class ElementSourceTrack extends WebAudioTrack {
  constructor(params){
    super(params)
    let track = this

    let defaults = {
      id:       '',
      src:      '',
      volume:   1,
      start:    0,
      loop:     false,
      autoplay: false,
      context:  false,
      mix:      false,
      nodes:    [],
    }

    track.options = Object.assign(defaults, params)

    if(!track.options.context){
      throw new Error('Can’t create an ElementSourceTrack without Web Audio API support')
    }

    // set up our HTML5 <audio> element
    if(!track.options.src){
      throw new Error('Can’t create an ElementSourceTrack without a src parameter')
    }

    track.el = document.createElement('audio')

    track.el.volume   = track.options.volume
    track.el.muted    = track.options.muted
    track.el.loop     = track.options.loop
    track.el.autoplay = track.options.autoplay

    track.el.src = track.options.src

    let eventNames = [
      'loadstart', 'loadedmetadata',
      'canplay', 'canplaythrough',
      'play', 'pause',
      'ended', 'timeupdate',
      'seeking', 'seeked',
      'error',
    ];

    eventNames.forEach(eventName => {
      track.el.addEventListener(eventName, super.trigger.bind(track, eventName, false))
    })

    // web audio API setup (only needs to happen once)
    track.data.source = track.options.context.createMediaElementSource(track.el)

    let gainNode = { type: 'GainNode', options: { gain: track.data.gain } }
    super.createNodes([gainNode, ...track.options.nodes], track.data.source)

  }

  play(){
    this.el.play()
    return this
  }

  pause(){
    this.el.pause()
    return this
  }

  stop(){
    this.el.pause()
    this.el.currentTime = 0
    return this
  }

  currentTime(setTo){
    let track = this
    if(typeof setTo === 'number'){
      track.el.currentTime = setTo
      return track
    } else {
      return track.el.currentTime
    }
  }

  duration(){
    return track.el.duration
  }

  formattedTime(includeDuration){
    let track = this
    if(includeDuration)
      return utils.timeFormat(track.currentTime()) + '/' + utils.timeFormat(track.duration());
    else
      return utils.timeFormat(track.currentTime());
  }

  volume(setTo){
    let track = this
    let gainNode = track.node('GainNode')

    if(typeof setTo === 'number') {
      setTo = utils.normalize(setTo)
      setTo = track.options.mix ? setTo * track.options.mix.volume() : setTo

      // we don't need to set both the gain node and element volume,
      // just the gain node will work, but element volume is a useful place
      // to store the current volume value

      if(gainNode) gainNode.gain(setTo)
      track.el.volume = setTo

      return track
    } else {
      return track.el.volume;
    }

  }

  tweenVolume(setTo, duration){
    let track = this

    // replace existing volume tween
    if(track.volumeTween){
      window.cancelAnimationFrame(track.volumeTween)
    }

    return new Promise(function(resolve, reject){

      let fps = 60 // requestAnimationFrame
      let durationInFrames = Math.round(duration * fps)
      let frameCount       = Math.round(duration * fps)
      let startVolume      = track.volume()
      let endVolume        = utils.normalize(setTo)

      tick()

      function tick(){
        if(frameCount <= 0){
          track.volume(endVolume)
          resolve(track)
        } else {
          track.volumeTween = window.requestAnimationFrame(tick)
        }

        frameCount -= 1
        let progress = (1 - (frameCount / durationInFrames))
        let v = utils.lerp(startVolume, endVolume, progress)
        track.volume( v )
      }

    })
  }

  muted(setTo){
    let track = this
    if(typeof setTo === 'boolean'){
      track.el.muted = setTo
    }
    return track.el.muted
  }

  destroy(){
    let track = this
    track.pause()
  }

  paused(){
    let track = this
    return track.el.paused
  }

}

export default ElementSourceTrack