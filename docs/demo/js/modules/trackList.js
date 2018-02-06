const m = require('mithril')
const Stream = require('mithril/stream')

/*

  Sub-components

*/

let formattedTime = {
  oncreate: function(vnode){
    let state = this
    let track = vnode.attrs.track

    track.on('play', () => updateTime())
    track.on('pause', () => cancelAnimationFrame(state.hook))
    track.on('ended', () => m.redraw())

    function updateTime(){
      state.hook = requestAnimationFrame(updateTime)
      vnode.dom.innerText = track.formattedTime()
    }
  },
  onremove: function(vnode){
    let state = this
    cancelAnimationFrame(state.hook)
  },
  view: function(vnode){
    return m('.tracks-track-time', '00:00')
  }
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
    m('.volumecontrol-label', Math.round(track.volume() * 100) + '%'),
  ])
}


let scrubber = {
  oncreate: function(vnode){
    let state = this
    var track = vnode.attrs.track
    let percentage, isMouseDown

    let input = vnode.dom.querySelector('input')

    state.max = 1000

    state.onmousedown = onmousedown
    state.onmouseup   = onmouseup

    track.on('play', () => updateTime())
    track.on('pause', () => cancelAnimationFrame(state.hook))

    function updateTime(){
      state.hook = requestAnimationFrame(updateTime)
      if(isMouseDown) return

      percentage = track.currentTime() / track.duration()
      input.value = percentage * state.max
    }

    function onmousedown(){
      isMouseDown = true
    }
    function onmouseup(e){
      isMouseDown = false
      percentage = e.target.value / state.max
      track.currentTime( percentage * track.duration() )
    }

  },
  onremove: function(vnode){
    let state = this
    cancelAnimationFrame(state.hook)
  },
  view: function(vnode){
    let state = this
    return m('.scrubber', [
      m('input[type="range"].scrubber-input', {
        value: 0,
        min:   0,
        max:   state.max,

        onmousedown: state.onmousedown,
        onmouseup:   state.onmouseup,
        // onchange:    state.currentTime,
      }),
    ]);
  }
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
        m(scrubber, { track })
      ]),

      m('.tracks-track-col', [
        m(formattedTime, { track })
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



