/*

  Interface

*/
const m = require('mithril')
const Stream = require('mithril/stream')

const CreateTrack = require('modules/createTrack')

module.exports = {
  oninit: function(vnode){
    let state = this

    state.mix = vnode.attrs.mix

    state.tracks = Stream([])

    state.processFile = function(src){
      console.log(src)
    }
  },
  view:   function(vnode){
    let state = this

    return [

      m('h3', [ 'Audio Mixer Demo' ]),

      m('section.create', [
        m('.row', [
          m('header', 'Create Track'),
        ]),
        m(CreateTrack, { mix: state.mix })
      ]),

      // m('section.mix', [
      //   m('header', 'Mix Controls'),
      //   m(MixControls, { mix: mix })
      // ]),

      m('section.tracks', [

        m('.row', [
          m('header', 'Tracks'),
        ]),

        m(TrackList, { mix: state.mix }),

      ]),
    ]

  },
}