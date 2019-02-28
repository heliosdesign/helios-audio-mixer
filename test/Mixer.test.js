import test from 'ava'
import sinon from 'sinon'

import AudioMixer from '../src/modules/Mixer'
import BaseTrack from '../src/modules/BaseTrack'

test('Mixer can be initialized', t => {
  let mix = new AudioMixer()
  t.truthy(mix)

  t.truthy(mix instanceof AudioMixer)

  t.is(typeof mix.track,  'function')
  t.is(typeof mix.tracks, 'function')
  t.is(typeof mix.remove, 'function')
  t.is(typeof mix.volume, 'function')
})

test('Create a track', t => {
  let mix = new AudioMixer()

  let id = 'test'
  t.truthy( mix.track(id, { type: BaseTrack }) )
})

test('Create a track with a custom Track type', t => {
  let mix = new AudioMixer()

  // dummy track type for this test
  let TestTrackType = function(){}

  let testTrack = mix.track('test', { type: TestTrackType })

  t.truthy(testTrack instanceof TestTrackType)
})

test('Create a track with arguments', t => {
  let mix = new AudioMixer()

  let ArgumentativeTrack = function(_args){
    this.test = 'test'
    this.args = _args
  }

  let track = mix.track('test', { type: ArgumentativeTrack, source: 'source.file' })

  t.truthy(track instanceof ArgumentativeTrack)

  t.is(track.test, 'test')
  t.is(track.args.source, 'source.file')
})

test('Don’t overwrite when creating a second track with the same name', t => {
  let mix = new AudioMixer()
  let TestTrack = function(){}

  let id = 'test'
  let testTrack = mix.track(id, { type: TestTrack })

  let secondTrack = mix.track(id, { type: TestTrack })

  t.is(testTrack, secondTrack)
})

test('Create a track that throws an error', t => {
  let mix = new AudioMixer()

  let ErrorTrack = function(args){
    if(!args.src){
      throw new Error('nope nope nope')
    }
  }

  t.throws(() => {
    mix.track('error', { type: ErrorTrack })
  })
})


test('Retrieve a created track by track id', t => {
  let mix = new AudioMixer()

  let id = 'test'
  let createdTrack = mix.track(id, { type: BaseTrack })

  let retrievedTrack = mix.track(id)

  t.is(createdTrack, retrievedTrack)
})

test('Remove a track by id', t => {
  let mix = new AudioMixer()
  let TestTrack = function(options){ this.id = options.id }

  let track = mix.track('hi', { type: TestTrack })
  t.is( mix.track('hi'), track )
  t.is( track.id, 'hi' )

  mix.remove('hi')

  t.falsy( mix.track('hi') )
})

test('Remove a track by track object', t => {
  let mix = new AudioMixer()
  let TestTrack = function(options){ this.id = options.id }

  let track = mix.track('hi', { type: TestTrack })
  t.is( mix.track('hi'), track )
  t.is( track.id, 'hi' )

  mix.remove(track)

  t.falsy( mix.track('hi') )
})

test('Remove one track but not another', t => {
  let mix = new AudioMixer()
  let TestTrack = function(options){ this.id = options.id }

  let track1 = mix.track('t1', { type: TestTrack })
  let track2 = mix.track('t2', { type: TestTrack })

  mix.remove(track1)

  t.is( mix.track('t2'), track2 )
  t.falsy( mix.track('t1'))
})

test('Set volume for the entire mixer', t => {
  let mix = new AudioMixer()
  mix.volume(0)
  t.is( mix.volume(), 0 )
})

test('Calling volume() with invalid arguments does nothing', t => {
  let mix = new AudioMixer()
  mix.volume(0)
  mix.volume('hello')
  mix.volume.call('hello', 'hi')
  mix.volume([])
  mix.volume({})
  t.is( mix.volume(), 0 )
})

test('Setting the volume for the mixer also sets calls volume() for all tracks', t => {
  let mix = new AudioMixer()
  let TestTrack = function(options){
    this.id = options.id
    this.volume = sinon.stub().returns(1)
  }

  let track1 = mix.track('t1', { type: TestTrack })
  let track2 = mix.track('t2', { type: TestTrack })

  mix.volume(0.5)

  t.is( mix.volume(), 0.5 )
  t.is(track1.volume.calledWith(1), true)
  t.is(track2.volume.calledWith(1), true)
})

test('tracks() returns all tracks as an array', t => {
  let mix = new AudioMixer()
  let TestTrack = function(options){
    this.id = options.id
    this.arbitraryFunction = sinon.spy()
  }

  let track1 = mix.track('t1', { type: TestTrack })
  let track2 = mix.track('t2', { type: TestTrack })
  let track3 = mix.track('t3', { type: TestTrack })

  let tracks = mix.tracks()

  tracks.forEach(track => track.arbitraryFunction())
  tracks.forEach(track => t.is(track.arbitraryFunction.called, true))
})
