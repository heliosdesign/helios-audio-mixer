/*

  Web Audio API track

  three valid source types:
    - buffer  (BufferSource)
    - element (MediaElementSource)
    - stream  (MediaStreamSource)

*/
import BaseTrack from './BaseTrack'
import utils from './utils'

class WebAudioTrack extends BaseTrack {
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
      sourceMode: 'element', // 'buffer', 'stream'
      context: false,
    }

    track.options = Object.assign(defaults, params)

    // internal flags and data
    track.data = {}

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

  // ********************************************************

  load(){
    let track = this

    if(track.data.loaded) return
    track.data.loaded = true

    if(track.options.sourceMode === 'buffer'){

      track.loadBufferSource()

    } else if(track.options.sourceMode === 'element'){

      track.loadElementSource()

    } else if(track.options.sourceMode === 'stream'){

      track.loadMediaStreamSource()

    } else {

      throw new Error('Can’t create a WebAudioTrack with an invalid source mode. Valid source modes: buffer, element, stream.')

    }
  }


  play(){
    let track = this

    if(!track.data.loaded){
      track.shouldPlayOnLoad = true
      track.load()
      return
    }

    if(track.data.status = 'playing')
      return track

    track.shouldPlayOnLoad = false

    if(options.sourceMode === 'buffer'){
      track.data.status = 'constructing'
        createBufferSource()
          .then(() => {
            playBufferSource()
          })
    } else if(options.sourceMode === 'element'){
      playElementSource();
    } else if( options.sourceMode === 'mediaStream'){
      playMediaStreamSource();
    }


  }

  pause(){

  }




  /*

    ###### ##    ###### ###  ### ###### ###  ## ######
    ##     ##    ##     ######## ##     #### ##   ##
    #####  ##    #####  ## ## ## #####  ## ####   ##
    ##     ##    ##     ##    ## ##     ##  ###   ##
    ###### ##### ###### ##    ## ###### ##   ##   ##

  */

  /*

    Load Element Source

  */
  loadElementSource(){
    let track = this

    track.el = document.createElement('audio')

    track.el.volume   = track.options.volume
    track.el.loop     = track.options.loop
    track.el.autoplay = track.options.autoplay

    let eventNames = [
      'loadstart', 'loadedmetadata',
      'canplay', 'canplaythrough',
      'play', 'pause',
      'ended', 'timeupdate',
      'seeking', 'seeked',
      'error',
    ];
    eventNames.forEach(eventName => {
      track.el.addEventListener(eventName, track.trigger.bind(track, eventName, false))
    })

    track.data.source = track.options.context.createMediaElementSource(track.el)

    track.el.addEventListener('canplaythrough', ready, false)

    track.el.src = track.options.src

    function ready(){
      track.el.removeEventListener('canplaythrough', ready, false)
      if(track.shouldPlayOnLoad || track.options.autoplay){
        track.play()
      }
    }

  }

  /*

     #### ###### #####  ######  #####  ###  ###
    ##      ##   ##  ## ##     ##   ## ########
     ####   ##   #####  #####  ####### ## ## ##
        ##  ##   ##  ## ##     ##   ## ##    ##
    #####   ##   ##  ## ###### ##   ## ##    ##

  */

  /*

    Load MediaStream Source

  */
  loadMediaStreamSource(){
    let track = this

    track.data.source = track.options.context.createMediaStreamSource(track.options.src)

    track.trigger('canplay')
    track.trigger('canplaythrough')

    if(track.shouldPlayOnLoad || track.options.autoplay){
      track.play()
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

  mute(){

  }

  unmute(){

  }
}

module.exports = WebAudioTrack