const m = require('mithril')
const Stream = require('mithril/stream')

const style = require('../style.sass')

const audioMixer = require('../../audioMixer')

const CreateTrack = require('modules/createTrack')
const TrackList = require('modules/trackList')

let Interface = {
  view, oninit
}

var mix = new audioMixer.default.Mixer()
window.mix = mix

// dummyTracks()

// DUMMY
function dummyTracks(){
  mix.tracks = function(){
    return [
      {
        options: { id: 'test a' },
        paused: () => true,
        play: () => true,
        on: () => true,
        gain: () => 1,
      },
      {
        options: { id: 'test b' },
        paused: () => true,
        play: () => true,
        on: () => true,
        gain: () => 1,
      }
    ]
  }
}


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