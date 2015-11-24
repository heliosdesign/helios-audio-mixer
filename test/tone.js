describe('Tone', function(){

  var mixer, frameRunner;

  before(function(){
    mixer = new HeliosAudioMixer()

    mixer.setLogLvl(1);

    frameRunner = new heliosFrameRunner()
    frameRunner.add({id:'tween', type: 'everyFrame', f: mixer.update});

  })

  describe('tone', function(){

    var tone

    it('should create a tone', function(){
      tone = mixer.createTone('tone')
      expect( tone ).to.have.property('start')
    })

    it('should start the tone', function(){
      tone.start()
      expect(tone.playing).to.equal(true)
    })

    it('should stop the tone', function(){
      tone.stop()
      expect(tone.playing).to.equal(false)
    })

    it('should remove the tone', function(){
      mixer.removeTone()
      expect(mixer.tone).to.equal(null)
    })
  })

})