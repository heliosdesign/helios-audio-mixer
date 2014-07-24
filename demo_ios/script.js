
var mix = new heliosiOSAudioMixer({
	videoElement: document.querySelector('#videlement')
});

console.log('Welcome to the console. The mixer is available at window.mix.')


function mixViewModel(){

	var self = this
	window.view = self

	// Track Selection
	this.availableTracks = ['drone', 'buzz', 'helicopter', 'cctv']
	this.selectedTrack = ko.observable('drone') // currently selected track

	// loaded tracks
	this.tracks = ko.observableArray()

	// mixer status
	this.paused  = ko.observable('')
	this.muted   = ko.observable('')
	this.element = ko.observable('')
	this.time    = ko.observable('')

	// fired events log
	this.events = ko.observableArray()

	// update mixer status (fired by events)
	this.update = function( eventType ){

		self.paused( (mix.element) ? mix.element.paused : '' )
		self.muted( (mix.element) ? mix.element.muted : '' )
		self.element( (mix.element) ? mix.element.nodeName : '' )

		var time
		if( mix.element ){
			if( mix.element.src ) 
				time = mix.timeFormat( mix.element.currentTime )
			else
				time = ''
		} else{
			time = ''
		}
		self.time( time )

		if( eventType && eventType !== 'timeupdate' )
			self.events.push( { type: eventType } )
	}

	this.update()




	this.control = {

		unload : function(){ mix.unload() },

		play : function(){ 
			if( !mix.element ) return
			mix.element.play() 
		},

		pause : function(){ 
			if( !mix.element ) return
			mix.element.pause() 
		},

		mute : function(){ 
			if( !mix.element ) return
			mix.element.muted = !mix.element.muted
		},

		load: function(){
			mix.load( self.selectedTrack() )
		},

		createTrack: function(){

			console.log('creating track: %s', self.selectedTrack() )

			var eventTypes = [ 'loadstart', 'canplaythrough', 'play', 'pause', 'volumechange', 'timeupdate', 'seeking', 'error' ]

			var events = {}
			for (var i = eventTypes.length - 1; i >= 0; i--) {
				events[ eventTypes[i] ] = self.update.bind( self, eventTypes[i] )
			};

			switch( self.selectedTrack() ){
				case 'drone':
					mix.createTrack('drone', { 
						source: '../demo/audio/Drone_1_norm', 
						events: events
					})
					break;

				case 'buzz':
					mix.createTrack('buzz', {
						source: '../demo/audio/Fluorescencent_Tone',
						events: events
					})
					break;

				case 'helicopter':
					mix.createTrack('helicopter', {
						source: '../demo/audio/Helicopter_Interior',
						events: events
					})
					break;

				case 'cctv':
					mix.createTrack('cctv', {
						source: './video/ControlRoom_CCTV_1', 
						type: 'video',
						events: events
					})
			}

			obj = mix.tracks[self.selectedTrack()]
			obj.name = self.selectedTrack()

			self.tracks.push( obj )
			
		}

	}


}


ko.applyBindings(new mixViewModel( document.querySelector('#knockout')));

