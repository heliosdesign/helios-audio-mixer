let TrackList = {
  oninit: function(vnode){
    let state = this

    let mix = vnode.attrs.mix

    // DEBUG ********************************************************

    mix.tracks = function(){
      return [
        {
          options: {
            id: 'asdf'
          },
          play: function(){},
          pause: function(){},
        }
      ]
    }

    // ********************************************************

  },
  view: function(vnode){
    let state = this
    let mix = vnode.attrs.mix

    return m('.tracks', [
      m('.tracks-track', [

      ]),

      mix.tracks().length ? TrackListTracks.call(state, vnode) : TrackListEmpty()


    ])

  }
}

function TrackListTracks(vnode){
  let state = this
  return vnode.attrs.mix.tracks().map(track => {
    console.log(track)

    return m('.tracks-track', [

      m('.tracks-track-col', track.options.id),

      m('.tracks-track-col', [
        m('button', { onclick: track.pause }, '| |'),
        m('button', { onclick: track.play }, m.trust('&#9655;')),
      ]),

    ])
  })
}

function TrackListEmpty(){
  return m('.tracks-track', [
    'no tracks'
  ])
}