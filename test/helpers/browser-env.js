let browserEnv = require('browser-env')

browserEnv()

window.fetch = (audioData) => Promise.resolve({
  arrayBuffer: () => Promise.resolve(audioData || {})
})
