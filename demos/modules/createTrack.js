let CreateTrack = {

  oninit: function(vnode){
    let state = this

    let defaults = {
      id:   '',
      src:  '',
      type: 'HTML5Track',
      loop:     false,
      autoplay: false,
      muted:    false,
      // timeline: [],
    }

    state.info = m.stream({})

    state.reset   = reset
    state.set     = set

    setup()

    // ********************************************************

    function setup(){
      reset()
    }

    function reset(){
      state.info( Object.assign(defaults, {}) )
    }

    function set(prop, val){
      let info = state.info()
      info[prop] = val
      state.info(info)
      m.redraw()
    }

  },

  view: function(vnode){
    let state = this
    return [
      m('.row', [
        m('header', 'Create Track'),
      ]),

      m('.row', [
        m('.col', [
          m(Dropzone, { hook: state.set.bind(null, 'src') }),

        ]),
        m('.col', [

          m('.input', [
            m('label', { for: 'input-name' }, 'Id'),
            m('input', {
              id: 'input-name',
              oninput: m.withAttr('value', state.set.bind(null,'id'))
            }),
          ]),

          m('.input', [
            m('label', { for: 'input-type' }, 'Type'),
            m('select', {
              id: 'input-type',
              oninput: m.withAttr('value', state.set.bind(null,'type'))
            }, [
              m('option', { value: 'HTML5Track' },   m.trust('&nbsp;&nbsp;HTML5')),
              m('optgroup', { label: 'Web Audio:' }),
              m('option', { value: 'BufferSourceTrack' },  m.trust('&nbsp;&nbsp;Buffer Source')),
              m('option', { value: 'ElementSourceTrack' }, m.trust('&nbsp;&nbsp;Element Source')),
              m('option', { value: 'StreamSourceTrack' },  m.trust('&nbsp;&nbsp;Stream Source')),
            ]),
          ]),

          m('.input', [
            m('label', { for: 'input-loop' }, 'Loop'),
            m('input', {
              id: 'input-loop',
              type: 'checkbox',
              onclick: m.withAttr('checked', state.set.bind(null, 'loop'))
            }),
          ]),

          m('.input', [
            m('label', { for: 'input-autoplay' }, 'Autoplay'),
            m('input', {
              id: 'input-autoplay',
              type: 'checkbox',
              onclick: m.withAttr('checked', state.set.bind(null, 'autoplay'))
            }),
          ]),
          m('.input', [
            m('label', { for: 'input-muted' }, 'Muted'),
            m('input', {
              id: 'input-muted',
              type: 'checkbox',
              onclick: m.withAttr('checked', state.set.bind(null, 'muted'))
            }),
          ]),

        ]),


        m('.col', [
          'Track options:',
          m('pre', [
            JSON.stringify(state.info(), ' ', 2),
          ]),
        ]),
      ]),

      m('.row', [
        m('button.mod-red', 'Reset Track'),
        m('button.mod-green', 'Create Track'),
      ]),
    ]
  }
}