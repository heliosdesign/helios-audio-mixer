const m = require('mithril')
const Stream = require('mithril/stream')

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

module.exports = {
  oninit: function(vnode){
    let state = this
    let mix = vnode.attrs.mix

  },
  view: function(vnode){
    let state = this
    let mix = vnode.attrs.mix

    return m('.tracks', [
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
        m(formattedTime, { track: track })
      ]),

      // track controls
      m('.tracks-track-col', [
        m('button', {
          style: { display: track.paused() ? 'none' : 'block' },
          onclick: () => track.pause()
        }, '| |'),

        m('button', {
          style: { display: track.paused() ? 'block' : 'none' },
          onclick: () => track.play()
        }, m.trust('&#9655;')),
      ]),


      m('.tracks-track-col', [
        m('button', { onclick: () => {
          console.log('remove', track.options.id)
          vnode.attrs.mix.remove(track)
        } }, m.trust('&#10005;')),
      ]),

      m('.tracks-track-col', [

        volumeControl.call(track)

      ]),

      // analysis.call(track)

    ])
  })
}

function TrackListEmpty(){
  return m('.tracks-track', ['no tracks'])
}



function volumeControl(){
  let track = this
  return m('.volumecontrol', [
    m('.volumecontrol-label', 'Volume:'),
    m('input[type="range"].volumecontrol-input', {
      value: track.volume() * 100,
      min:   0,
      max:   100,
      onchange: (e) => track.volume( e.target.value / 100 )
    }),
    m('.volumecontrol-label', track.volume() * 100 + '%'),
  ])
}


// ********************************************************

// TO DO

// ********************************************************

function analysis(){
  let track = this
  return m('.tracks-track-col', [
    'analysis'
  ])
}



