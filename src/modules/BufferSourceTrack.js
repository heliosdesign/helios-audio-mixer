/*

  Web Audio API: Buffer Source track

*/
import BaseTrack from './BaseTrack'
import utils from './utils'

import nodes from './nodes/allNodes'

class BufferSourceTrack extends BaseTrack {
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
    }

    track.options = Object.assign(defaults, params)

    // internal flags and data
    track.data = {
      cachedTime: 0,
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
      track.load()
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
    if(track.data.loading) return
    track.data.loading = true
    track.trigger('loadstart')

    return window.fetch(track.options.src)
      .then(res => {
        track.data.audioData = res

        track.trigger('loadedmetadata')
        track.trigger('canplay')
        track.trigger('canplaythrough')

        if(track.shouldPlayOnLoad || track.options.autoplay){
          track.play()
          track.data.loading = false
          track.data.loaded = true
        }

      })
      .catch(e => track.trigger('error', e))
  }

  /*

    2. The BufferSource must be re-created every time we begin play

  */

  create(){
    return new Promise(function(resolve, reject){
      track.data.source = null

      let ctx = track.options.context

      // W3C standard implementation (Firefox, recent Chrome)
      if(typeof ctx.createGain === 'function') {

        ctx.decodeAudioData(track.data.audioData, function(decodedBuffer){
          if(status.ready) return;

          source           = ctx.createBufferSource();
          var sourceBuffer = decodedBuffer;
          source.buffer    = sourceBuffer;

          resolve()
        });
      }

      // Non-standard Webkit implementation (Safari, old Chrome)
      else if(typeof ctx.createGainNode === 'function') {

        source = ctx.createBufferSource();
        var sourceBuffer  = ctx.createBuffer(track.data.audioData, true);
        source.buffer = sourceBuffer;

        resolve()
      }

    })
  }

  createNodes(){

  }

  /*

    4. Play!

  */
  play(){
    let track = this

    // these ifs accomodate calling play() multiple times
    // while waiting for the track to be set up

    if(!track.data.loaded){
      track.shouldPlayOnLoad = true
      track.load()
      return
    }

    if(track.data.status = 'playing')
      return track

    track.shouldPlayOnLoad = false

    if(!track.data.creating){
      track.data.creating = true
      track.create()
        .then(() => {

          createNodes();

          let source = track.data.source

          // Apply Options
          source.loop = (track.options.loop) ? true : false;
          // gain(track.options.volume);
          // pan(track.options.pan);

          // Play
          // ~~~~

          startTime = source.context.currentTime - track.data.cachedTime;
          var startFrom = track.data.cachedTime || 0;

          // prefer start() but fall back to deprecated noteOn()
          if(typeof source.start === 'function'){
            source.start(0, startFrom);
          } else {
            source.noteOn(startFrom);
          }

          // setEndTimer();

          track.data.creating = false
          track.data.playing = true

          events.trigger('play', track);

        })
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
