const m = require('mithril')
const Stream = require('mithril/stream')

const Dropzone = require('modules/dropzone')

module.exports = {

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

    state.options = Stream({})

    state.create = create
    state.reset  = reset
    state.set    = set
    state.get    = get
    state.remove = remove
    state.node   = node

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

    function remove(prop){
      let info = state.options()
      delete info[prop]
      state.options(info)
      m.redraw()
    }

    function get(prop){
      let info = state.options()
      return info[prop]
    }

    function node(type, setTo){
      let options = state.options()
      if(!options.nodes) return false

      if(type){
        if(typeof setTo === 'boolean'){
          if(options.nodes.indexOf(type) === -1){
            options.nodes.push(type)
          } else {
            options.nodes.splice(options.nodes.indexOf(type), 1)
          }
          state.options(options)
        } else {
          return options.nodes.indexOf(type) !== -1
        }
      }

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
              oninput: function(){
                let value = this.value
                console.log(value)

                state.set('type', value)
                if(value === 'Html5Track')
                  state.remove('nodes')
                else if(!state.get('nodes'))
                  state.set('nodes', [])
              },
              value: state.get('type'),
            }, [
              m('option', { value: 'Html5Track' },   m.trust('&nbsp;&nbsp;HTML5')),
              m('optgroup', { label: 'Web Audio:' }),
              m('option', { value: 'BufferSourceTrack' },  m.trust('&nbsp;&nbsp;Buffer Source')),
              m('option', { value: 'ElementSourceTrack' }, m.trust('&nbsp;&nbsp;Element Source')),
              m('option', { value: 'StreamSourceTrack', disabled: true },  m.trust('&nbsp;&nbsp;Stream Source')),
            ]),
          ]),

          checkbox.call(state, 'loop'),
          checkbox.call(state, 'autoplay'),
          checkbox.call(state, 'muted'),

          m('div', { style: { display: state.get('type') === 'Html5Track' ? 'none' : 'block' }}, [
            m('h4', 'nodes'),

            m('.input', [
              m('label', { for: 'input-node-GainNode' }, 'GainNode'),
              m('input', {
                id: 'input-node-GainNode',
                type: 'checkbox',
                checked: true,
                disabled: true,
                // onclick: m.withAttr('checked', state.node.bind(null, 'GainNode')),
                // checked: state.get(id),
              }),
            ]),

            nodeCheckbox.call(state, 'PannerNode2D')


          ]),

        ]),

        // ********************************************************

        m('.col.is-grow', [
          m('pre.options', [
            JSON.stringify(state.options(), ' ', 2),
          ]),
        ]),

        // ********************************************************

        m('.col', [
          m('header', '3. Create!'),
          m('button.mod-red',   { onclick: state.reset  }, 'Reset Options'),
          m('button.mod-green', { onclick: state.create }, 'Create Track'),
        ]),

        // ********************************************************

      ]),

    ]
  }
}

function checkbox(id){
  let state = this
  return m('.input', [
    m('label', { for: 'input-'+id }, id),
    m('input', {
      id: 'input-'+id,
      type: 'checkbox',
      onclick: m.withAttr('checked', state.set.bind(null, id)),
      checked: state.get(id),
    }),
  ]);
}

function nodeCheckbox(id){
  let state = this
  return m('.input', [
    m('label', { for: 'input-node-'+id }, id),
    m('input', {
      id: 'input-node-'+id,
      type: 'checkbox',
      onclick: m.withAttr('checked', state.node.bind(null, id)),
      checked: state.node(id),
    }),
  ])
}