let CreateTrack = {

  oninit: function(vnode){
    let state = this

    let mix = vnode.attrs.mix

    let defaults = {
      id:   '',
      src:  '',
      type: 'Html5Track',
      loop:     false,
      autoplay: false,
      muted:    false,
      // timeline: [],
    }

    state.options = m.stream({})

    state.create = create
    state.reset  = reset
    state.set    = set
    state.get    = get

    setup()

    // ********************************************************

    function setup(){
      reset()
    }

    function create(){
      let options = state.options()
      console.log(options)
      mix.track(options.id, options)
      reset()
    }

    function reset(){
      state.options( Object.assign({}, defaults) )
      m.redraw()
    }

    function set(prop, val){
      let info = state.options()
      info[prop] = val
      state.options(info)
      m.redraw()
    }

    function get(prop){
      let info = state.options()
      return info[prop]
    }

  },

  view: function(vnode){
    let state = this
    return [

      m('.row', [

        // ********************************************************

        m('.col', [
          m('header', '1. Source file'),
          m(Dropzone, { hook: state.set.bind(null, 'src') }),

        ]),

        // ********************************************************

        m('.col', [
          m('header', '2. Options'),

          m('.input', [
            m('label', { for: 'input-name' }, 'Id'),
            m('input', {
              id: 'input-name',
              value:   state.get('id'),
              oninput: m.withAttr('value', state.set.bind(null, 'id')),
            }),
          ]),

          m('.input', [
            m('label', { for: 'input-type' }, 'Type'),
            m('select', {
              id: 'input-type',
              oninput: m.withAttr('value', state.set.bind(null,'type'))
            }, [
              m('option', { value: 'Html5Track' },   m.trust('&nbsp;&nbsp;HTML5')),
              m('optgroup', { label: 'Web Audio:' }),
              m('option', { value: 'BufferSourceTrack', disabled: true },  m.trust('&nbsp;&nbsp;Buffer Source')),
              m('option', { value: 'ElementSourceTrack', disabled: true }, m.trust('&nbsp;&nbsp;Element Source')),
              m('option', { value: 'StreamSourceTrack', disabled: true },  m.trust('&nbsp;&nbsp;Stream Source')),
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

        // ********************************************************

        m('.col.is-grow', [
          m('header', ''),
          m('pre', [
            JSON.stringify(state.options(), ' ', 2),
          ]),
        ]),

        // ********************************************************

        m('.col', [
          m('header', '3. Create!'),
          m('button.mod-red',   { onclick: state.reset  }, 'Reset Track'),
          m('button.mod-green', { onclick: state.create }, 'Create Track'),
        ]),

        // ********************************************************

      ]),

    ]
  }
}