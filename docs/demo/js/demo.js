/*

  Audio Mixer Demo Page

*/

const m = require('mithril')
const audioMixer = require('../../../audioMixer')
const style = require('../style.sass')
const CreateTrack = require('modules/createTrack')
const TrackList = require('modules/trackList')

const mix = new audioMixer.default.Mixer()
window.mix = mix

// dummyTracks() // <-- uncomment to pre-populate track list with dummy tracks

const Interface = { view }
m.mount(document.querySelector('.container'), Interface)

// ********************************************************

const dummyTrack = function() {
  return {
    options: { id: 'test a' },
    paused:  () => true,
    play:    () => true,
    on:      () => true,
    volume:  () => 1
  }
}
function dummyTracks() {
  mix.tracks = function() {
    return [ dummyTrack(), dummyTrack() ]
  }
}

// ********************************************************

function view(vnode) {
  let state = this

  return [
    m('h3', [ 'Audio Mixer Demo' ]),

    m('h4', [
      m('a', { href: 'https://github.com/heliosdesign/helios-audio-mixer' }, [
        'https://github.com/heliosdesign/helios-audio-mixer'
      ])
    ]),

    m('section.create', [
      m('.row', [ m('header', 'Create Track') ]),
      m(CreateTrack, { mix })
    ]),

    m('section.tracks', [
      m('.row', [ m('header', 'Tracks') ]),
      m(TrackList, { mix })
    ])
  ]
}
