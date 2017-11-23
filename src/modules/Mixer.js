/*

  Audio Mixer

*/
import Html5Track from './Html5Track'
import utils from './utils'

class Mixer {
  constructor(){
    let mix = this

    mix.allTracks = [] // tracks as numbered array
    mix.lookup    = {} // tracks as mix.lookup table: mix.lookup['trackname']

    mix.currentVolume = 1

    // web audio context

    if(window.AudioContext){
      this.context = (typeof window.AudioContext === 'function' ? new window.AudioContext() : new window.webkitAudioContext() )
    }
  }


  /*

    Create a new track, or return an existing track

  */
  track(id, params){
    let mix = this

    if(!id){
      throw new Error('Can’t create a track without a name')
      return
    }

    // track already exists, return it
    if(mix.lookup[id]){

      // TODO: apply params to an existing track???
      return mix.lookup[id]

    } else if(params){

      // if params are passed, create a track
      let defaults = {
        id:       id,
        timeline: [],
        context:  mix.context,
        type:     Html5Track, // default to standard track type
      }
      let options = Object.assign(defaults, params)

      let track = new options.type(options)

      mix.allTracks.push(track);
      mix.lookup[id] = track;

      return track

    } else {
      // this track doesn't exist, no params received
      return false
    }

  }

  tracks(){
    let mix = this
    return mix.allTracks
  }

  /*

    Remove an existing track. Can receive an ID or a track object.

  */
  remove(input){
    let mix = this

    // input can be either a string or a track object,
    // but the track object needs to have an id property
    let trackId
    if(typeof input === 'string')
      trackId = input
    else if(typeof input === 'object' && input.id)
      trackId = input.id

    let track = mix.lookup[trackId];

    for (var i = mix.allTracks.length - 1; i >= 0; i--) {
      if(mix.allTracks[i] === track){
        mix.allTracks.splice(i, 1)
      }
    }

    if(track.destroy) track.destroy()
    track = null
    delete mix.lookup[trackId]

  }


  /*

    Set the master volume for the entire audio mixer.

  */
  volume(setTo){
    let mix = this
    if(typeof setTo === 'number'){
      mix.currentVolume = utils.normalize(setTo)

      // tracks multiply their volume by the mix’s volume, so
      // whenever we change the master volume we need to call
      // track.volume() once to get the intended result
      mix.allTracks.forEach(track => track.volume ? track.volume(track.volume()) : '' )
    }
    return mix.currentVolume
  }

}

module.exports = Mixer
