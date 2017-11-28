/*

  Web Audio API: Buffer Source track

*/
import WebAudioTrack from './WebAudioTrack'
import utils from './utils'

import nodes from './nodes/allNodes'

class BufferSourceTrack extends WebAudioTrack {
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
      autoload: true,
      context:  false,
      nodes:    [],
    }

    track.options = Object.assign(defaults, params)

    track.status = {
      ready: false,
      shouldPlayOnLoad: false,

      playing:  false,
    }

    // internal flags and data
    track.data = {

      // manual time tracking
      cachedTime: 0,
      startTime:  0,
    }

    if(!track.options.context){
      throw new Error('Can’t create a WebAudioTrack without Web Audio API support')
    }

    if(!track.options.src){
      throw new Error('Can’t create a WebAudioTrack without a src parameter')
    }

    // limited subset of events available because they're all simulated
    let eventNames = [
      'loadstart', 'loadedmetadata',
      'canplay', 'canplaythrough',
      'play', 'pause',
      'ended',
      'error',
    ]

    // load the source the right away, even if autoplay isn't set.
    if(track.options.autoload){
      track.load()
    }

  }

  /*

    Playback needs to wait for the track to be loaded.
    After this, it's a synchronous function.

    You can listen for the 'canplaythrough' event to ensure
    synchronous playback of multiple buffer tracks.

  */
  play(){
    let track = this

    // this logic accomodates calling play() multiple times
    // while waiting for the track to be set up

    if(track.status.playing)
      return track

    if(!track.status.ready){
      console.log('should play on load')
      track.status.shouldPlayOnLoad = true
      return track
    }

    /*

      if we got this far we're actually ready to play, let's go!

    */

    let ctx    = track.options.context
    let source = track.data.source

    // the buffer needs to be re-created every time we play()
    source  = ctx.createBufferSource()
    source.buffer = track.data.decodedBuffer

    // source.loop = (track.options.loop) ? true : false;

    // as do the nodes
    let nodes = ['GainNode'].concat(track.options.nodes || [])
    super.createNodes(nodes, source)

    // set up timers, for the ended event
    track.data.startTime = source.context.currentTime - track.data.cachedTime
    var startFrom = track.data.cachedTime || 0

    // prefer start() but fall back to older, deprecated noteOn()
    if(typeof source.start === 'function'){
      source.start(0, startFrom)
    } else {
      source.noteOn(startFrom)
    }

    track.setEndTimer()

    track.status.playing = true
    super.trigger('play', track)

  }

  /*

    Buffer source mode requires the source file to be fully loaded
    and decoded before it can be play, so here we fetch it.

    Web Audio API has the same browser support as fetch (no IE,
    not even 11), so we can use this delightful method.

  */
  load(){
    let track = this
    let ctx = track.options.context

    super.trigger('loadstart')

    return window.fetch(track.options.src)
      .then(audioData => {
        track.data.audioData = audioData

        // Decode audio data
        if(typeof ctx.createGain === 'function') {

          // W3C standard implementation - async (Firefox, recent Chrome)
          return new Promise(function(resolve, reject){
            ctx.decodeAudioData(audioData, function(decodedBuffer){
              track.data.decodedBuffer = decodedBuffer
              resolve()
            })
          })

        } else if(typeof ctx.createGainNode === 'function') {

          // Non-standard Webkit implementation (Safari, old Chrome)
          // not async but we fake it for consistency
          let decodedBuffer = ctx.createBuffer(audioData, true)
          track.data.decodedBuffer = decodedBuffer
          return Promise.resolve()
        }

      })

      .then(() => {

        track.status.ready = true

        // now that the source is decoded, we know its duration
        super.trigger('loadedmetadata')
        super.trigger('canplay')
        super.trigger('canplaythrough')

        if(track.options.autoplay || track.status.shouldPlayOnLoad){
          track.play()
        }

      })
  }



  /*

    Buffer tracks don't have an ended event so we simulate it using setTimeout

  */

  setEndTimer(){
    let track = this
    let startFrom = track.data.cachedTime || 0;
    let timerDuration = (track.data.source.buffer.duration - startFrom);

    if(track.data.onendtimer){
      clearTimeout(track.data.onendtimer);
    }

    track.data.onendtimer = setTimeout(track.ended, timerDuration * 1000);
  }

  ended() {
    let track = this
    if(track.options.loop){
      super.trigger('loop', track)
      track.pause(0)
      track.play()
    } else {
      super.trigger('ended', track)
    }
  }



  // end of play functions
  // ********************************************************






  pause(){
    // disable autoplay, if we've paused the track before it's had a chance to load
    if(!track.status.playing && track.status.shouldPlayOnLoad){
      track.status.shouldPlayOnLoad = false
    }

  }


  stop(){

  }

  currentTime(){

  }

  formattedTime(){

  }

  duration(){

  }

  volume(){

  }

  tweenVolume(){

  }

  muted(){

  }

}

module.exports = BufferSourceTrack
