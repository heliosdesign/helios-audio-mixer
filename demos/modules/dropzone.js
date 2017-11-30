let Dropzone = {

  oncreate: function(vnode){
    let state = this

    vnode.dom.addEventListener('drop', drop)
    vnode.dom.addEventListener('dragover', dragover)
    vnode.dom.addEventListener('dragend', dragend)

    function dragover(e){
      e.preventDefault()
      this.classList.add('is-over')
    }
    function dragend(e){
      e.preventDefault()
      this.classList.remove('is-over')
    }

    function drop(e){
      e.preventDefault()
      this.classList.remove('is-over')
      if(e.dataTransfer.items){

        for (var i = 0; i < e.dataTransfer.items.length; i++) {
          var item = e.dataTransfer.items[i]
          if (item.kind == "file") {
            processFile(item.getAsFile())
          }
        }

      } else {
        for (var i = 0; i < e.dataTransfer.files.length; i++) {
          processFile( e.dataTransfer.files[i] )
        }

      }
    }

    function processFile(file){
      vnode.attrs.hook( URL.createObjectURL(file) )
    }
  },

  view: function(vnode){
    let state = this
    return m('.dropzone', [
      m('.dropzone-inner', [
        'Drop an audio file here'
      ]),
    ])
  }
}