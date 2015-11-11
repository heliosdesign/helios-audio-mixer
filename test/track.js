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
      track = mixer.createTrack('test', { source: 'asdf' })
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
      track = mixer.createTrack('test', { source: 'asdf', autoplay: false })
    })

    it('gain should be chainable', function(){
      var chain = track.gain(1)
      expect( chain ).to.be.a('object')
    })

    it('pan should be chainable', function(){
      var chain = track.pan(1)
      expect( chain ).to.be.a('object')
    })

    it('play should be chainable', function(){
      var chain = track.play()
      expect( chain ).to.be.a('object')
    })

    it('pause should be chainable', function(){
      var chain = track.pause()
      expect( chain ).to.be.a('object')
    })

    after(function(){
      mixer.removeTrack('test')
    })

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