describe('Track', function(){

  var mixer, frameRunner;
  window.mixer = mixer

  before(function(){
    mixer = new heliosAudioMixer()

    frameRunner = new heliosFrameRunner()
    frameRunner.add({id:'tween', type: 'everyFrame', f: mixer.updateTween});

  })

  describe('basics', function(){

    var track;

    before(function(){
      track = mixer.createTrack('test', { source: './audio/silence_9s' })
    })

    it('should exist', function(){
      expect(track).to.have.property('play')
      expect(track).to.have.property('pause')
    })

    after(function(){
      mixer.removeTrack('test')
    })
  })

  describe('chaining', function(){

    var track;

    before(function(){
      track = mixer.createTrack('test', { source: './audio/silence_9s', autoplay: false })
    })

    it('play() should be chainable', function(){
      var chain = track.play()
      console.log(chain);
      expect( chain ).to.have.property('play')
    })

    it('pause() should be chainable', function(){
      var chain = track.pause()
      expect( chain ).to.have.property('play')
    })

    it('stop() should be chainable', function(){
      var chain = track.stop()
      expect( chain ).to.have.property('play')
    })

    it('gain() should be chainable', function(){
      var chain = track.gain(1)
      expect( chain ).to.have.property('play')
    })

    it('pan() should be chainable', function(){
      var chain = track.pan(1)
      expect( chain ).to.have.property('play')
    })

    after(function(){
      mixer.removeTrack('test')
    })

  })

  describe('pan', function(){
    // pan modes: 2d, 360, 3d
  })


  // source types (string, media element, blob) -> proper media source loading
  describe('sources', function(){

  })

  describe('events', function(){

  })

  after(function(){
    frameRunner.remove({id: 'tween'});
    frameRunner = null;
  })
})