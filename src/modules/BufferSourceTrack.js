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
      context:  false,
      nodes:    [],
    }

    track.options = Object.assign(defaults, params)

    track.status = {
      loading: false,
      loaded:  false,

      creating: false,
      created:  false,

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

    if(track.options.autoplay){
      track.play()
    }
  }

  /*

    Playing a track is a three step process:

    1. Buffer source mode requires the source file to be fully loaded,
       so here we fetch it. Web Audio API has the same browser support
       as fetch (no IE, not even 11).

  */
  load(){
    let track = this
    if(track.status.loading) return
    track.status.loading = true
    track.trigger('loadstart')

    return window.fetch(track.options.src)
      .then(res => {
        track.data.audioData = res

        track.trigger('loadedmetadata')
        track.trigger('canplay')
        track.trigger('canplaythrough')

        if(track.shouldPlayOnLoad || track.options.autoplay){
          track.status.loading = false
          track.status.loaded = true
          track.play()
        }

      })
      .catch(e => track.trigger('error', e))
  }

  /*

    2. The BufferSource must be re-created every time we begin play

  */

  create(){
    let track = this

    if(track.status.creating) return
    track.status.creating = true

    return new Promise(function(resolve, reject){
      track.data.source = null

      let ctx = track.options.context

      // W3C standard implementation (Firefox, recent Chrome)
      if(typeof ctx.createGain === 'function') {

        ctx.decodeAudioData(track.data.audioData, function(decodedBuffer){
          if(!track.status.creating) return;

          track.data.source  = ctx.createBufferSource();
          track.data.source.buffer = decodedBuffer;

          track.status.creating = false
          track.status.created = true
          resolve()
        })
      }

      // Non-standard Webkit implementation (Safari, old Chrome)
      else if(typeof ctx.createGainNode === 'function') {

        track.data.source = ctx.createBufferSource();
        track.data.source.buffer = ctx.createBuffer(track.data.audioData, true);

        track.status.creating = false
        track.status.created = true
        resolve()
      }

    })
  }
  /*

    4. Play!

  */
  play(){
    let track = this

    // these ifs accomodate calling play() multiple times
    // while waiting for the track to be set up

    if(!track.status.loaded){
      track.shouldPlayOnLoad = true
      track.load()
      return
    }

    if(track.status.playing){
      return track
    }

    track.shouldPlayOnLoad = false

    if(!track.status.created && !track.status.creating){
      track.create()
        .then(() => {

          // build nodes
          let nodes = ['GainNode'].concat(track.options.nodes || [])
          super.createNodes(nodes)

          let source = track.data.source

          // Apply Options
          source.loop = (track.options.loop) ? true : false;

          // set up timers

          track.data.startTime = source.context.currentTime - track.data.cachedTime;
          var startFrom = track.data.cachedTime || 0;

          // prefer start() but fall back to deprecated noteOn()
          if(typeof source.start === 'function'){
            source.start(0, startFrom);
          } else {
            source.noteOn(startFrom);
          }

          track.setEndTimer();

          track.status.playing = true
          super.trigger('play', track);

        })
    }

  }

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



  pause(){
    // disable autoplay, if we've paused the track before it's had a chance to load
    // if(track.data.)

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
