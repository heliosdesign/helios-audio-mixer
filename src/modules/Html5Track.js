/*

  HTML5 <audio> element track

*/
import BaseTrack from './BaseTrack'
import utils from './utils'

class Html5Track extends BaseTrack {

  constructor(params){
    // call the parent class’s constructor
    super(params)
    let track = this

    let defaults = {
      id:       '',
      src:      '',
      volume:   1,
      muted:    false,
      start:    0,
      loop:     false,
      autoplay: false,
    }

    track.options = Object.assign(defaults, params)

    // set up our HTML5 <audio> element
    if(!track.options.src){
      throw new Error('Can’t create an Html5Track without a src parameter')
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


  }

  // ********************************************************

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
    let track = this
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
    if(typeof setTo === 'number'){
      track.el.volume = utils.normalize(setTo)
      return track
    } else {
      return track.el.volume
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

  paused(){
    let track = this
    return track.el.paused
  }

  destroy(){
    let track = this
    track.pause()
  }


}

module.exports = Html5Track
