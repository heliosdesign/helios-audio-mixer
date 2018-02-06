const m = require('mithril')
const Stream = require('mithril/stream')

/*

  Formatted Time (00:00)

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


/*

  Volume Slider

*/
let volumeControl = {
  oninit: function(vnode){
    let state = this
    state.track = vnode.attrs.track
  },
  oncreate: function(vnode){
    let state = this

    let isMouseDown
    let input = vnode.dom.querySelector('input')
    let label = vnode.dom.querySelector('.mod-currentvolume')

    state.onmousedown = onmousedown
    state.onmouseup   = onmouseup

    updateVolume()

    function updateVolume(){
      state.hook = requestAnimationFrame(updateVolume)
      if(isMouseDown) return
      input.value = state.track.volume() * 100
      label.innerText = input.value + '%'
    }

    function onmousedown(){
      isMouseDown = true
    }

    function onmouseup(e){
      isMouseDown = false
      state.track.volume( e.target.value / 100 )
    }
  },
  onremove: function(vnode){
    let state = this
    cancelAnimationFrame(state.hook)
  },
  view: function(vnode){
    let state = this
    return [
      m('.tracks-track-col', [
        m('.volumecontrol', [

          m('.volumecontrol-label', 'Volume:'),
          m('input[type="range"].volumecontrol-input', {
            min:   0,
            max:   100,
            onmousedown: state.onmousedown,
            onmouseup:   state.onmouseup,
          }),
          m('.volumecontrol-label.mod-currentvolume', Math.round(state.track.volume() * 100) + '%'),
        ])
      ]),

      m('.tracks-track-col', [
        m('button', { onclick: () => state.track.tweenVolume(0, 1) }, 'To 0'),
        m('button', { onclick: () => state.track.tweenVolume(1, 1) }, 'To 100'),
      ]),
    ];
  }
}


/*

  Time Scrubber

*/
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






/*

  ##  ## #### ###### ##    ##
  ##  ##  ##  ##     ##    ##
  ##  ##  ##  #####  ## ## ##
   ####   ##  ##     ## ## ##
    ##   #### ######  ##  ##

*/

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

      m(volumeControl, { track }),


      // analysis.call(track)

    ])
  })
}

function TrackListEmpty(){
  return m('.tracks-track', ['no tracks'])
}



