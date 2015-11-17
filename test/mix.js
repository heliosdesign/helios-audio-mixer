describe('Mix', function(){

  var mixer, frameRunner

  before(function(){
    mixer = new HeliosAudioMixer()

    frameRunner = new heliosFrameRunner()
    frameRunner.add({id:'tween', type: 'everyFrame', f: mixer.update});
  })

  describe('Setup', function(){

    it('should exist', function(){
      expect( mixer ).to.exist
    })

  })

  describe('Throw expected errors',function(){

    it('shouldn’t allow a track with no name', function(){
      expect( mixer.createTrack.bind() ).to.throw( Error )
    })

    it('shouldn’t allow duplicate tracks', function(){
      var create = mixer.createTrack.bind(mixer, 'test', { source: './audio/silence_9s' })
      create();
      var result = create();
      expect( result ).to.equal( false )
    })

    it('shouldn’t allow invalid node types', function(){
      var invalid = mixer.createTrack.bind(mixer, 'nodes', { source: './audio/silence_9s', nodes: ['invalid'] })
      expect( invalid ).to.throw( Error )
    })

    after(function(){
      mixer.removeTrack('test')
    })
  })

  describe('Track Management', function(){

    it('should create a track', function(){
      var track = mixer.createTrack('test', { source: './audio/silence_9s' })
      expect( track ).to.exist
    })

    it('shouldn’t allow tracks without sources', function(){
      var create = mixer.createTrack.bind(mixer, 'test', { source: null })
      expect( create ).to.throw( Error )
    })

    it('should create a track with a valid source', function(){
      var track = mixer.createTrack( 'test', {source: './audio/silence_9s'} )
    })

    afterEach(function(){
      mixer.removeTrack('test')
    })



  })

  describe('TWEEN.js',function(){

  })

  after(function(){
    frameRunner.remove({id: 'tween'});
    frameRunner = null;
    mixer = null;
  })

})