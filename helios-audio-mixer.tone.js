(function(Mix){

	var Tone = function(name, opts, mix){
		var defaults = {
			pitch: 440
		}

		this.options = mix.extend(defaults, opts || {})
		this.name = 'tone_'+this.options.pitch

		this.mix = mix
		this.playing = false
	}

	Tone.prototype.start = function(){

		var ctx = this.mix.context

		var now = ctx.currentTime

		this.playing = true

		this.oscillator = ctx.createOscillator()
		this.oscillator.frequency.value = this.options.pitch
		this.gainNode = ctx.createGain()
		this.gainNode.gain.value = 1
		this.oscillator.connect(this.gainNode)
		this.gainNode.connect(ctx.destination)

		this.oscillator.start()
	}

	Tone.prototype.stop = function(){
		var now = this.mix.context.currentTime

		this.playing = false

		this.gainNode.gain.value = 0
		this.oscillator.stop()
	}

	Mix.prototype.createTone = function(name, opts){
		console.log('[Mixer] create tone', name)

		if ( !name || this.lookup[name] ) return

		var tone = new Tone(name, opts, this)
		this.tone = tone
		return tone
	}

	Mix.prototype.removeTone = function(){
		this.tone = null
	}

	return Mix

})(HeliosAudioMixer || {})