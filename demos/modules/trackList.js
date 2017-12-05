let formattedTime = {
  oncreate: function(vnode){
    let track = vnode.attrs.track

    let hook
    track.on('play', () => updateTime())
    track.on('pause', () => cancelAnimationFrame(hook))

    function updateTime(){
      hook = requestAnimationFrame(updateTime)
      vnode.dom.innerText = track.formattedTime()
    }
  },
  view: function(vnode){
    return m('.tracks-track-time', '00:00')
  }
}


// ********************************************************

let TrackList = {
  oninit: function(vnode){
    let state = this
    let mix = vnode.attrs.mix

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

    return m('.tracks-track', [

      m('.tracks-track-col.mod-id', track.options.id),

      m('.tracks-track-col', [
        m('button', { onclick: () => track.pause() }, '| |'),
        m('button', { onclick: () => track.play() }, m.trust('&#9655;')),
      ]),

      m('.tracks-track-col', [
        m(formattedTime, { track: track })
      ]),

      // m('.tracks-track-col', [

      //   m('.volumecontrol', [
      //     m('.volumecontrol-label', '0'),
      //     m('input[type="range"].volumecontrol-input', {
      //       value: 100,
      //       min:   0,
      //       max:   100,
      //     }, [

      //     ]),
      //     m('.volumecontrol-label', '1'),
      //   ]),

      // ]),

      m('.tracks-track-col', [
        m('button', { onclick: () => { vnode.attrs.mix.remove(track) } }, m.trust('&#10005;')),
      ]),

    ])
  })
}

function TrackListEmpty(){
  return m('.tracks-track', [
    'no tracks'
  ])
}





