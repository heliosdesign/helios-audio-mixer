/*

  file drop or getusermedia

*/

const m = require('mithril')

module.exports = {
  oncreate: function(vnode) {
    let state = this

    vnode.dom.addEventListener('drop', drop)
    vnode.dom.addEventListener('dragover', dragover)
    vnode.dom.addEventListener('dragend', dragend)

    function dragover(e) {
      let state = this

      e.preventDefault()
      state.classList.add('is-over')
    }

    function dragend(e) {
      let state = this

      e.preventDefault()
      state.classList.remove('is-over')
    }

    function drop(e) {
      let state = this

      e.preventDefault()
      state.classList.remove('is-over')

      if (e.dataTransfer.items) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          const item = e.dataTransfer.items[i]
          if (item.kind == 'file') {
            processFile(item.getAsFile())
          }
        }
      } else {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          processFile(e.dataTransfer.files[i])
        }
      }
    }

    function processFile(file) {
      vnode.attrs.hook(URL.createObjectURL(file))
    }
  },

  view: function(vnode) {
    let state = this
    return m('.dropzone', [m('.dropzone-inner', ['Drop an audio file here'])])
  }
}
