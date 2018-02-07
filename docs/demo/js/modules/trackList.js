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
        m('.tracks-track-col-label', 'volume'),

        m('.volumecontrol', [
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
        min:   0,
        max:   state.max,

        onmousedown: state.onmousedown,
        onmouseup:   state.onmouseup,
      }),
    ]);
  }
}



/*

  PannerNode2D

*/

let pan2d = {
  oncreate: function(vnode){
    let state = this
    var track = vnode.attrs.track

    let angle, isMouseDown

    let input = vnode.dom.querySelector('input')

    state.min = -90
    state.max = 90

    // get a reference to the panner node (re-created every time we play)
    track.on('play', () => {
      if(track.node){
        state.panNode = track.node('PannerNode2D')
        m.redraw()
      }
    })

    state.onmousedown = onmousedown
    state.onmouseup   = onmouseup

    updateTime()

    function updateTime(){
      state.hook = requestAnimationFrame(updateTime)
      if(isMouseDown) return
      if(!state.panNode) return

      let angle = state.panNode.pan()
      if(angle > 90) angle = 360 - angle

      if(!input) input = vnode.dom.querySelector('input')
      if(input) input.value = angle
    }

    function onmousedown(){
      isMouseDown = true
    }
    function onmouseup(e){
      isMouseDown = false

      angle = parseInt(e.target.value)

      let panNode = track.node('PannerNode2D')
      panNode.pan( angle )
    }

  },
  onremove: function(vnode){
    let state = this
    cancelAnimationFrame(state.hook)
  },
  view: function(vnode){
    let state = this

    if(state.panNode){
      return m('.tracks-track-col', [
        m('.tracks-track-col-label', 'pan (2d)'),

        m('.pan', [
          m('.pan-label', 'left'),
          m('input[type="range"].scrubber-input', {
            min:   state.min,
            max:   state.max,

            onmousedown: state.onmousedown,
            onmouseup:   state.onmouseup,
          }),
          m('.pan-label', 'right'),
        ]),

      ]);
    } else {
      return m('')
    }


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
        m('.tracks-track-col-label', 'time'),
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
        m('button', { onclick: () => vnode.attrs.mix.remove(track) }, m.trust('&#10005;')),
      ]),

      m(volumeControl, { track }),


      m(pan2d, { track }),

    ])
  })
}

function TrackListEmpty(){
  return m('.tracks-track', ['no tracks'])
}



