let browserEnv = require('browser-env')
let sinon = require('sinon')
import createMockRaf from 'mock-raf'

browserEnv()

window.fetch = sinon.stub().returns( Promise.resolve() )

let mockRaf = createMockRaf()
window.requestAnimationFrame = mockRaf.raf
