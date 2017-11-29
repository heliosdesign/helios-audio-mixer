let MixControls = {

  oncreate: function(vnode){
    let state = this
    state.mix = vnode.attrs.mix
  },

  view: function(vnode){
    let state = this
    return m('.mixcontrols', [
      // m('button.mixcontrols-control', { onclick: state.mix.pause }, 'Volume'),

      m('.mixcontrols-volume', [
        m('.mixcontrols-volume-label', '0'),
        m('input[type="range"].mixcontrols-volume-input', {
          value: 1000,
          min:   0,
          max:   1,
        }, [

        ]),
        m('.mixcontrols-volume-label', '1'),
      ]),

    ])
  }
}