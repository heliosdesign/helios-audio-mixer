/*

  Tests for functionality specific to HTML5Track

*/
import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import Html5Track from '../src/modules/Html5Track'

let options = {
  id:  'id',
  src: 'file.ext',
}

test('Initialize track', t => {
  sinon.spy(document, 'createElement')

  let track = new Html5Track(options)

  t.is(track instanceof Html5Track, true)
  t.is(document.createElement.called, true)
  t.is(document.createElement.calledWith('audio'), true)
})

let methods = ['play', 'pause']
methods.forEach(method => {
  test(`track wraps native HTML5 ${method} method`, t => {
    let track = new Html5Track(options)

    let el = track.el
    el[method] = sinon.stub(el, method)

    track[method]()

    t.is(track.el[method].called, true)
  })
})