const m = require('mithril')

const frameRunner = require('frame-runner')

/*

  Formatted Time (00:00)

*/

const formattedTime = {
  oncreate: function(vnode) {
    let state   = this
    state.track = vnode.attrs.track
    state.id    = state.track.options.id

    state.track.on('play',  () => updateTime())
    state.track.on('ended', () => m.redraw())

    state.hook = frameRunner.add(`${state.id}-formatted-time`, updateTime)

    function updateTime() {
      vnode.dom.innerText = state.track.formattedTime()
    }
  },
  onremove: function(vnode) {
    let state = this
    state.hook
  },
  view: function(vnode) {
    return m('.tracks-track-time', '00:00')
  }
}

/*

  Volume Slider

*/

const volumeControl = {
  oninit: function(vnode) {
    let state   = this
    state.track = vnode.attrs.track
    state.id    = state.track.options.id
  },
  oncreate: function(vnode) {
    let state = this

    let isMouseDown
    state.input = vnode.dom.querySelector('input')
    state.label = vnode.dom.querySelector('.mod-currentvolume')

    state.onmousedown = onmousedown
    state.onmouseup   = onmouseup

    state.hook = frameRunner.add(`${state.id}-update-volume`, updateVolume)

    function updateVolume() {
      if (isMouseDown) { return }
      state.input.value     = state.track.volume() * 100
      state.label.innerText = `${state.input.value}%`
    }

    function onmousedown() {
      isMouseDown = true
    }

    function onmouseup(e) {
      isMouseDown = false
      state.track.volume( e.target.value / 100 )
    }
  },
  onremove: function(vnode) {
    let state = this
    state.hook
  },
  view: function(vnode) {
    let state = this
    return [
      m('.tracks-track-col', [
        m('.tracks-track-col-label', 'volume'),
        m('.volumecontrol', [
          m('input[type="range"].volumecontrol-input', {
            min:           0,
            max:         100,
            onmousedown: state.onmousedown,
            onmouseup:   state.onmouseup
          }),
          m('.volumecontrol-label.mod-currentvolume', `${Math.round(state.track.volume() * 100)}%`)
        ])
      ]),

      m('.tracks-track-col', [
        m('button', { onclick: () => state.track.tweenVolume(0, 1) }, 'To 0'),
        m('button', { onclick: () => state.track.tweenVolume(1, 1) }, 'To 100')
      ])
    ]
  }
}

/*

  Time Scrubber

*/

const scrubber = {
  oninit: function(vnode) {
    let state   = this
    state.track = vnode.attrs.track
    state.id    = state.track.options.id
  },
  oncreate: function(vnode) {
    let state   = this

    let percentage, isMouseDown
    state.input = vnode.dom.querySelector('input')

    state.max = 1000

    state.onmousedown = onmousedown
    state.onmouseup   = onmouseup

    state.hook = frameRunner.add(`${state.id}-update-time`, updateTime)

    function updateTime() {
      if (isMouseDown || !state.track.duration()) { return }

      percentage = state.track.currentTime() / state.track.duration()
      state.input.value = percentage * state.max
    }

    function onmousedown() {
      isMouseDown = true
    }

    function onmouseup(e) {
      isMouseDown = false
      percentage  = e.target.value / state.max
      state.track.currentTime( percentage * state.track.duration() )
    }
  },
  onremove: function(vnode) {
    let state = this
    state.hook
  },
  view: function(vnode) {
    let state = this
    return m('.scrubber', [
      m('input[type="range"].scrubber-input', {
        min:         0,
        max:         state.max,
        value:       state.input ? state.input.value : 0,
        onmousedown: state.onmousedown,
        onmouseup:   state.onmouseup
      })
    ])
  }
}

/*

  PannerNode2D

*/

const pan2d = {
  oncreate: function(vnode) {
    let state   = this
    state.track = vnode.attrs.track
    state.id    = state.track.options.id

    let angle, isMouseDown
    state.input = vnode.dom.querySelector('input')

    state.min = -90
    state.max =  90

    // get a reference to the panner node (re-created every time we play)
    state.track.on('play', () => {
      if (state.track.node) {
        state.panNode = state.track.node('PannerNode2D')
        m.redraw()
      }
    })

    state.onmousedown = onmousedown
    state.onmouseup   = onmouseup

    state.hook = frameRunner.add(`${state.id}-update-time`, updateTime)

    function updateTime() {
      if (isMouseDown || !state.panNode) { return }

      let angle = state.panNode.pan()
      if (angle > 90) { angle = 360 - angle }

      if (state.input) { state.input.value = angle }
      else { state.input = vnode.dom.querySelector('input') }
    }

    function onmousedown() {
      isMouseDown = true
    }

    function onmouseup(e) {
      isMouseDown = false
      angle = parseInt(e.target.value)
      state.panNode.pan( angle )
    }
  },
  onremove: function(vnode) {
    let state = this
    state.hook
  },
  view: function(vnode) {
    let state = this

    return m('.tracks-track-col', [
      m('.tracks-track-col-label', 'pan (2d)'),

      m('.pan', { style: { visibility: state.panNode ? 'visible' : 'hidden' }}, [
        m('.pan-label', 'left'),
        m('input[type="range"].scrubber-input', {
          min:         state.min,
          max:         state.max,
          value:       state.panNode ? state.panNode.values.pan : 0,
          onmousedown: state.onmousedown,
          onmouseup:   state.onmouseup
        }),
        m('.pan-label', 'right')
      ])
    ])
  }
}

const analyser = {
  oncreate: function(vnode) {
    let state   = this
    state.track = vnode.attrs.track
    state.id    = state.track.options.id

    let canvas, canvasCtx

    state.track.on('play', () => {
      if (state.track.node) {
        state.analyser = state.track.node('AnalyserNode')
        m.redraw()

        if (state.analyser) {
          canvas    = document.getElementById(`${state.id}-oscilloscope`)
          canvasCtx = canvas.getContext('2d')
          draw()
        }
      }
    })

    function draw() {
      requestAnimationFrame(draw)

      const bufferLength = state.analyser.bufferLength
      const dataArray    = state.analyser.analysis.raw

      state.analyser.node.getByteTimeDomainData(dataArray)

      canvasCtx.fillStyle = 'rgb(255, 255, 255)'
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

      canvasCtx.lineWidth   = 2
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)'

      canvasCtx.beginPath()

      const sliceWidth = canvas.width  / bufferLength
      const center     = canvas.height / 2
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const y = (dataArray[i] / 128) * center

        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }
        x += sliceWidth
      }

      canvasCtx.lineTo(canvas.width, center)
      canvasCtx.stroke()
    }
  },
  view: function(vnode) {
    let state = this

    return m('.tracks-track-col', [
      m('.tracks-track-col-label', 'analyser'),
      m('canvas.analyser', { id: `${state.id}-oscilloscope`, style: {
        visibility: state.analyser ? 'visible' : 'hidden'
      }})
    ])
  }
}

/*

  ##  ## #### ###### ##    ##
  ##  ##  ##  ##     ##    ##
  ##  ##  ##  #####  ## ## ##
   ####   ##  ##     ## ## ##
    ##   #### ######  ##  ##

*/

module.exports = {
  oninit: function(vnode) {
    let state = this
    state.mix = vnode.attrs.mix
  },
  view: function(vnode) {
    let state = this
    return m('.tracks', [
      state.mix.tracks().length
        ? TrackListTracks.call(state, vnode)
        : TrackListEmpty()
    ])
  }
}

function TrackListTracks(vnode) {
  let state = this
  state.mix = vnode.attrs.mix

  return state.mix.tracks().map(track => {
    return m('.tracks-track', [

      m('.tracks-track-col.mod-id', track.options.id),

      m('.tracks-track-col', [
        m('.tracks-track-col-label', 'time'),
        m(scrubber, { track })
      ]),

      m('.tracks-track-col', [ m(formattedTime, { track }) ]),

      // track controls
      m('.tracks-track-col', [
        m('button', { style: { display: track.paused() ? 'none' : 'block' },
          onclick: () => track.pause()
        }, '| |'),

        m('button', {
          style: { display: track.paused() ? 'block' : 'none' },
          onclick: () => track.play()
        }, m.trust('&#9655;')),
      ]),

      m('.tracks-track-col', [
        m('button', { onclick: () => state.mix.remove(track)
        }, m.trust('&#10005;')),
      ]),

      m(volumeControl, { track }),
      m(analyser,      { track }),
      m(pan2d,         { track })
    ])
  })
}

function TrackListEmpty() {
  return m('.tracks-track', ['no tracks'])
}
