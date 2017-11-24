/*

  Tests for functionality specific to HTML5Track

*/
import test from 'ava'
import sinon from 'sinon'
import createMockRaf from 'mock-raf'

import Html5Track from '../src/modules/Html5Track'

test('Initialize track', t => {
  sinon.spy(document, 'createElement')

  let track = new Html5Track({
    id:  'id',
    src: 'file.ext',
  })

  t.is(track instanceof Html5Track, true)
  t.is(document.createElement.called, true)
  t.is(document.createElement.calledWith('audio'), true)
})