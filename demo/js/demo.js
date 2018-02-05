const m = require('mithril')
const Stream = require('mithril/stream')

const audioMixer = require('../../audioMixer')

const CreateTrack = require('modules/createTrack')
const TrackList = require('modules/trackList')

let Interface = {
  view, oninit
}

var mix = new audioMixer.default.Mixer()

m.mount(document.querySelector('.container'), Interface)


function oninit(vnode){
  let state = this

  state.tracks = Stream([])

  state.processFile = function(src){
    console.log(src)
  }
}

function view(vnode){
  let state = this

  return [

    m('h3', [ 'Audio Mixer Demo' ]),

    m('section.create', [
      m('.row', [
        m('header', 'Create Track'),
      ]),
      m(CreateTrack, { mix })
    ]),

    // m('section.mix', [
    //   m('header', 'Mix Controls'),
    //   m(MixControls, { mix: mix })
    // ]),

    m('section.tracks', [

      m('.row', [
        m('header', 'Tracks'),
      ]),

      m(TrackList, { mix }),

    ]),
  ]

}

// var control = {
//   play:  play,
//   pause: pause,
// }

// function createTrack(src){
//   track = mix.track('test', {
//     src:      src,
//     autoplay: true,
//   })
//   track.on('canplaythrough', function(){
//     document.querySelector('.controls').classList.remove('is-disabled')
//   })
//   console.log(track)
// }

// /*

//   Control

// */

// function play(){
//   if(!track) return
//   track.play()
// }

// function pause(){
//   if(!track) return
//   track.pause()
// }


