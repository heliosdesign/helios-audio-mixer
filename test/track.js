describe('Track', function(){

  var mixer, frameRunner;

  var silence9s = './audio/silence_9s';

  before(function(){
    mixer = new HeliosAudioMixer()

    mixer.setLogLvl(1);

    frameRunner = new heliosFrameRunner()
    frameRunner.add({id:'tween', type: 'everyFrame', f: mixer.update});

  })


  /*

    Loading

      todo: source types (string, media element, blob) -> proper media source loading

  */

  describe('loading', function(){

    var bufferTrack, elementTrack, failTrack;

    it('should throw a loadError when a track fails to load', function(done){
      failTrack = mixer.createTrack('shouldfail', { source: 'nonexistent' })
      failTrack.on('loadError', function(track, error){
        expect(error).to.have.property('status')
        done();
      })
    })

    it('should create a track with a buffer source', function(){
      bufferTrack = mixer.createTrack('buffer', { source: silence9s, sourceMode: 'buffer' })
      expect( bufferTrack ).to.have.property('play');
    })

    it('should play a track with a buffer source', function(done){
      bufferTrack.play(0);
      bufferTrack.one('play', function(){
        expect( bufferTrack.status.playing ).to.equal( true );
        setTimeout(function(){
          expect( bufferTrack.currentTime() ).to.be.at.least(0.1);
          bufferTrack.stop();
          done();
        }, 150);
      })
    })

    it('should create a track with an element source', function(){
      elementTrack = mixer.createTrack('element', { source: silence9s, sourceMode: 'element' })
      expect( elementTrack ).to.have.property('play');
    })

    it('should play a track with an element source', function(done){
      elementTrack.play(0);
      elementTrack.one('play', function(){
        expect( elementTrack.status.playing ).to.equal( true );
        setTimeout(function(){
          expect( elementTrack.currentTime() ).to.be.at.least(0.1);
          elementTrack.stop();
          done();
        }, 150);
      })
    })


    after(function(){
      mixer.removeTrack(bufferTrack)
      mixer.removeTrack(elementTrack)
      mixer.removeTrack(failTrack)
    })
  })

  /*

    Events

  */
  describe('events', function(){

    var track;
    var duration;

    before(function(){
      track = mixer.createTrack('events', { source: silence9s, autoplay: false })
    })

    it('should trigger a load event', function(done){
      track.one('load', function(t){
        expect(t).to.have.property('play');
        done();
      });
    })

    it('should trigger a play event', function(done){
      track.one('play', function(t){
        expect(t).to.have.property('play');
        duration = track.duration();
        done();
      });
      track.play();
    });

    it('should trigger a pause event', function(done){
      track.one('pause', function(t){
        expect(t).to.have.property('play');
        done();
      })
      track.pause();
    })

    it('should trigger a stop event', function(done){
      track.play();
      track.one('stop', function(t){
        expect(t).to.have.property('play');
        done();
      })
      track.one('play', track.stop)
    })

    it('should trigger an ended event', function(done){
      track.on('ended', function(t){
        expect(t).to.have.property('play');
        done();
      })

      track.currentTime( duration - 0.10 );
      track.play();
    })

    after(function(){
      mixer.removeTrack(track);
    })

  })


  /*

    Timeline Events

  */

  describe('timeline events', function(){

    var track;

    before(function(){
      track = mixer.createTrack('timeline', { source: silence9s, autoplay: true });
    })

    it('should trigger an onstart event', function(done){
      track.addEvent({
        start: 0.1,
        onstart: function(){ done(); }
      });
    })

    it('should trigger an onend event', function(done){
      track.addEvent({
        end: 0.2,
        onend: function(){ done(); }
      })
    })

    after(function(){
      mixer.removeTrack(track)
    })

  })



  /*

    Chaining

  */

  describe('chaining', function(){

    var track;

    before(function(){
      track = mixer.createTrack('test', { source: silence9s, autoplay: false })
    })

    it('play() should be chainable', function(){
      var chain = track.play()
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

    it('addEvent() should be chainable', function(){
      var chain = track.addEvent({})
      expect( chain ).to.have.property('play')
    })

    after(function(){
      mixer.removeTrack('test')
    })

  })


  /*

    Pan

  */
  describe('pan', function(){
    // pan modes: 2d, 360, 3d
  })


  /*

    Gain

  */

  describe('gain', function(){

    it('should create an element track with 0 gain', function(done){

      var track = mixer.createTrack('gain', {
        source: silence9s,
        sourceMode: 'element',
        gain: 0,
        autoplay: true
      })

      track.on('play', function(){
        expect(track.element.volume).to.equal(0)
        mixer.removeTrack(track)
        done()
      })

    })

    it('should fail silently when calling tweenGain at the wrong time', function(){
      var track = mixer.createTrack('fail', { source: 'nonexistent' })
      track.tweenGain(0,1)
      mixer.removeTrack(track)
    })

    it('should tween gain (buffer track)', function(done){
      var track = mixer.createTrack('gain', { source: silence9s, gain: 0, autoplay: true, sourceMode: 'buffer' })
      track.one('play', function(){
        track.tweenGain(1, 0.1);
        setTimeout(function(){
          expect(track.gain()).to.equal(1)
          mixer.removeTrack(track)
          done()
        }, 150)
      })
    })

    it('should tween gain (element track)', function(done){
      var track = mixer.createTrack('gain', { source: silence9s, gain: 0, autoplay: true, sourceMode: 'element' })
      track.one('play', function(){
        track.tweenGain(1, 0.1);
        setTimeout(function(){
          expect(track.gain()).to.equal(1)
          done()
        }, 150)
      })
    })
  })


  /*

    Analysis

  */
  describe('analysis', function(){

    var track;

    before(function(){
      track = mixer.createTrack('analysis', {
        source: silence9s,
        autoplay: false,
        nodes: ['analyse']
      })
    })

    it('should create the analysis node', function(done){
      track.one('play', function(){
        expect( track.nodes.analyse ).to.exist;
        track.pause();
        done()
      })
      track.play();
    })

    it('should make analysis data accessible at track.analysis', function(done){
      track.one('play', function(){
        expect( track.analysis ).to.exist;
        expect( track.analysis.raw ).to.be.a( 'Uint8Array' )
        expect( track.analysis.raw ).to.have.length.above(0)
        done()
      })
      track.play();
    })

    it('should trigger the analyse event', function(done){
      track.one('analyse', function(){
        expect( track.analysis ).to.exist;
        done()
      })
    })

    after(function(){
      mixer.removeTrack(track);
    })

  })




  after(function(){
    frameRunner.remove({id: 'tween'});
    frameRunner = null;
  })
})