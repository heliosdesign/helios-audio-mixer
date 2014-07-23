describe('Audio Mixer',function(){

	window.mixer = new heliosAudioMixer()
	// var frameRunner = new heliosFrameRunner()
	// frameRunner.add('tween','everyFrame',)

	describe('Setup',function(){

		it('constructor',function(){
			expect( mixer ).to.exist
		})

	})
	
	describe('Fail Gracefully',function(){
		
		it('shouldn’t allow a track with no name',function(){
			expect( mixer.createTrack.bind() ).to.throw( Error )
		})

		it('shouldn’t allow duplicate tracks',function(){
			mixer.createTrack('test')
			expect( mixer.createTrack.bind('test') ).to.throw( Error )
		})

		after(function(){
			mixer.removeTrack('test')
		})
	})

	describe('Track Management', function(){

		it('should create a track',function(){
			var track = mixer.createTrack('test')
			expect( track ).to.exist
		})

		it('should create a track with a valid source',function(){
			console.log('hi')
			var track = mixer.createTrack( 'test', {source: 'audio/Drone_1_norm'} )
		})

		// it('should be playing',function(){
		// 	mixer.
		// })

		afterEach(function(){
			mixer.removeTrack('test')
		})



	})

	describe('TWEEN.js',function(){

	})

})