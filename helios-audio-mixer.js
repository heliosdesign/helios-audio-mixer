'use strict';

var heliosAudioMixer = (function(){

	// ######  ###### ###### ######  ##### ###### 
	// ##   ## ##       ##   ##     ##       ##   
	// ##   ## #####    ##   #####  ##       ##   
	// ##   ## ##       ##   ##     ##       ##   
	// ######  ######   ##   ######  #####   ##   
	// Feature Detection

	var Detect = {

		// Web audio API support
		webAudio : !!(window.webkitAudioContext || window.AudioContext),

		// Which audio types can the browser actually play?
		audioTypes : (function(){
			var el = document.createElement('audio')

			return {
				'.m4a': !!(el.canPlayType && el.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/, '')),
				'.mp3': !!(el.canPlayType && el.canPlayType('audio/mpeg;').replace(/no/, '')),
				'.ogg': !!(el.canPlayType && el.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''))    
			}
		})(),

		videoTypes : (function(){

			var el = document.createElement('video')

			return {
				'.webm': !!(el.canPlayType && el.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, '')),
				'.mp4':  !!(el.canPlayType && el.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, '')),
				'.ogv':  !!(el.canPlayType && el.canPlayType('video/ogg; codecs="theora"').replace(/no/, ''))
			}
		})(),

		// prefer bowser, but with fallback
		browser : (function(){

			if( typeof bowser !== 'undefined' ) return bowser;

			return {
				firefox: !!navigator.userAgent.match(/Firefox/g),
				android: !!navigator.userAgent.match(/Android/g),
				msie:    !!navigator.userAgent.match(/MSIE/g),
				ios:     !!navigator.userAgent.match(/(iPad|iPhone|iPod)/g),

				version: false
			};
		})(),

		// is tween.js present?
		tween : (function(){
			return ( typeof TWEEN === 'undefined' ) ? false : true
		})()

	};



	// ######   #####   ####  ###### 
	// ##   ## ##   ## ##     ##     
	// ######  #######  ####  #####  
	// ##   ## ##   ##     ## ##     
	// ######  ##   ## #####  ###### 

	// shared functionality: event system, extend

	var BaseClass = function(){};

	BaseClass.prototype.on = function(type, callback){
		this.events[type] = this.events[type] || [];
		this.events[type].push( callback );

		return this
	};

	BaseClass.prototype.off = function(type){
		if( type === '*' )
			this.events = {};
		else
			this.events[type] = [];

		return this
	};

	BaseClass.prototype.trigger = function(type){

		if ( !this.events[type] ) return;

		var args = Array.prototype.slice.call(arguments, 1);

		for (var i = 0, l = this.events[type].length; i < l;  i++)
				if ( typeof this.events[type][i] == 'function' ) 
					this.events[type][i].apply(this, args);

	};

	BaseClass.prototype.extend = function(){
		var output = {}, 
			args = arguments,
			l = args.length;

		for ( var i = 0; i < l; i++ )       
			for ( var key in args[i] )
				if ( args[i].hasOwnProperty(key) )
					output[key] = args[i][key];
		return output;
	};

	// ######   #####   ####  ###### 
	// ##   ## ##   ## ##     ##     
	// ######  #######  ####  #####  
	// ##   ## ##   ##     ## ##     
	// ######  ##   ## #####  ###### 

	// // shared functionality: event system, extend
	// var Event = {
	// 	on: function(type, callback){
	// 		this.events[type] = this.events[type] || [];
	// 		this.events[type].push( callback );

	// 		return this
	// 	},
	// 	off: function(type){
	// 		if( type === '*' )
	// 			this.events = {};
	// 		else
	// 			this.events[type] = [];

	// 		return this
	// 	},
	// 	trigger: function(type){

	// 		if ( !this.events[type] ) return;

	// 		var args = Array.prototype.slice.call(arguments, 1);

	// 		for (var i = 0, l = this.events[type].length; i < l;  i++)
	// 				if ( typeof this.events[type][i] == 'function' ) 
	// 					this.events[type][i].apply(this, args);

	// 	}
	// }

	// var extend = function(){
	// 	var output = {}, 
	// 		args = arguments,
	// 		l = args.length;

	// 	for ( var i = 0; i < l; i++ )       
	// 		for ( var key in args[i] )
	// 			if ( args[i].hasOwnProperty(key) )
	// 				output[key] = args[i][key];
	// 	return output;
	// };












	var constrain = function(val, min, max){
		if(val < min) return min;
		if(val > max) return max;
		return val;
	};








	// ###  ### #### ##   ## 
	// ########  ##   ## ##  
	// ## ## ##  ##    ###   
	// ##    ##  ##   ## ##  
	// ##    ## #### ##   ## 

	var Mix = function(opts){

		this.Track = Track

		this.debug = 1 // 0 no logging, 1 minimal, 2 all (spammy)

		this.log = function(lvl){
			if(lvl <= this.debug){
				var str = ''
				for (var i = 1; i < arguments.length; i++)
				  str += ' ' + arguments[i]
				console.log(str)
			}
		}

		this.setLogLvl = function( lvl ){
			this.debug = constrain(lvl,0,2);
			this.log(1, '[Mixer] Set log level:', lvl)
		}

		var defaults = {
			fileTypes: [ '.mp3', '.m4a', '.ogg' ],
			html5: false,
		}
		this.options = this.extend(defaults, opts || {})


		this.tracks  = [];    // tracks as numbered array
		this.lookup  = {};    // tracks as lookup table: lookup['trackname']

		this.muted   = false; // master mute status
		this.gain    = 1;     // master gain for entire mix

		this.context = null;  // AudioContext object (if webAudio is available)

		this.detect  = Detect; // external reference to Detect object


		// Web Audio support overrides
		// ********************************************************

		if( 
			( Detect.browser.name === 'Firefox' && Detect.version && Detect.version < 25 ) || // Firefox < 25
			( Detect.browser.ios === true && Detect.browser.version != 6 ) ||                 // ios 7
			this.options.html5
		){
			Detect.webAudio = false;
		}


		// File Types
		// ********************************************************

		for (var i = this.options.fileTypes.length-1; i >= 0; i--) {
			if( ! Detect.audioTypes[ this.options.fileTypes[i] ] )
				this.options.fileTypes.splice(i,1); 
		};

		if( this.options.fileTypes.length <= 0 ) {
			console.warn('[Mixer] Can’t initialize: none of the specified audio types can play in this browser.')
			return;
		}

		this.log(1, '[Mixer] can play:', this.options.fileTypes)


		// Initialize
		// ********************************************************

		if(Detect.webAudio === true) {

			this.log(1, '[Mixer] Web Audio Mode');

			if ( typeof AudioContext === 'function' ) this.context = new window.AudioContext();
			else                                      this.context = new window.webkitAudioContext();

		} else {

			this.log(1, '[Mixer] HTML5 Mode');

		}

		return this

	};

	
	Mix.prototype = new BaseClass()


	/**************************************************************************
		
		Track Management

	**************************************************************************/

	Mix.prototype.createTrack = function(name, opts){

		var self = this;
		var track;

		if( !name )
			self.log(0, '[Mixer] Can’t create track with no name')

		if(Detect.webAudio === true) {

			if(this.lookup[name]){
				self.log(0, '[Mixer] a track named “'+self.name+'” already exists')
				return
			}
				

			track = new Track(name, opts, self);

			this.tracks.push( track );
			this.lookup[name] = track;

		} else {

			track = this.lookup[name];

			if( ! track ){ // create new track

				track = new Track( name, opts, self );

				this.tracks.push( track );
				this.lookup[ name ] = track;

			} else { // change source

				track.pause();

				track.options = track.extend( track, track.defaults, opts || {} );

				if(track.options.source) {
					track.options.source += self.mix.options.fileTypes[0];
					track.createHTML5elementSource();
				}
			}
		}

		return track;
		
	};


	Mix.prototype.removeTrack = function(name){

		var self  = this,
			track = self.lookup[name];

		if(!track) {
			console.warn('[Mixer] can’t remove "%s", it doesn’t exist', name);
			return;
		}

		if( Detect.webAudio === true ){

			// Fade the track out if we can,
			// to avoid nasty crackling

			var doIt = function(){
				if( ! track ) return; // sanity check, things can happen in 100ms
				track.pause();

				var rest, 
					arr   = self.tracks, 
					total = arr.length;

				for ( var i = 0; i < total; i++ ){
					if ( arr[i] && arr[i].name == name ) {
						rest = arr.slice(i + 1 || total);
						arr.length = i < 0 ? total + i : i;
						arr.push.apply( arr, rest );
					}
				}

				track.trigger('remove', self);

				track.events = [];

				track = null;
				delete self.lookup[name];
				self.log(1, '[Mixer] Removed track "'+name+'"');
			};

			if(Detect.tween) track.tweenGain(0,100, doIt);
			else doIt();

		} else {

			track.pause();

			track.element.src = track.source = null;

			track.ready = false;
			track.loaded = false;

		}
		
	};


	Mix.prototype.getTrack = function(name){
		return this.lookup[name] || new Track(false, { dummy: name }, this);
	};





	/**************************************************************************
		
		Global Mix Control

	**************************************************************************/

	Mix.prototype.pause = function(){

		this.log(1, '[Mixer] Pausing '+this.tracks.length+' track(s) ||')

		for ( var i = 0; i < this.tracks.length; i++ )
			this.tracks[i].pause()
	};

	Mix.prototype.play = function(){

		this.log(1, '[Mixer] Playing '+this.tracks.length+' track(s) >')

		for ( var i = 0; i < this.tracks.length; i++ )
			this.tracks[i].play()
	};

	Mix.prototype.stop = function(){

		this.log(1, '[Mixer] Stopping '+this.tracks.length+' track(s) .')

		for ( var i = 0; i < this.tracks.length; i++ )
			 this.tracks[i].stop()
	};




	Mix.prototype.mute = function(){

		if(this.muted === true) {
			this.unmute();
			return;
		}

		this.log(1, '[Mixer] Muting '+this.tracks.length+' tracks')

		this.muted   = true;

		for ( var i = 0; i < this.tracks.length; i++ )
			this.tracks[i].mute();

	};


	Mix.prototype.unmute = function(){

		this.log(1, '[Mixer] Unmuting '+this.tracks.length+' tracks')

		this.muted = false;

		for ( var i = 0; i < this.tracks.length; i++ )
			this.tracks[i].unmute();

	};



	Mix.prototype.gain = function(masterGain){
		if( typeof masterGain !== 'undefined') {
			this.gain = masterGain;

			// this seems silly, but tracks multiply their gain by the master's
			// so if we change the master gain and call track.gain() we will
			// get the intended result
			for ( var i = 0; i < this.tracks.length; i++ )
				this.tracks[i].gain( this.tracks[i].gain() );
		}

		return this.gain;
	}

	Mix.prototype.setGain = function(masterGain){

		console.warn('Mix.setGain has been deprecated; use Mix.gain()')
		this.gain(masterGain)
		
	};





	/**************************************************************************
		
		Utilities

	**************************************************************************/


	// call this using requestanimationframe
	Mix.prototype.updateTween = function(){
		TWEEN.update();
	};



































	// ###### #####   #####   ##### ##  ## 
	//   ##   ##  ## ##   ## ##     ## ##  
	//   ##   #####  ####### ##     ####   
	//   ##   ##  ## ##   ## ##     ## ##  
	//   ##   ##  ## ##   ##  ##### ##  ## 


	var Track = function(name, opts, mix){

		// this.extend = extend
		// this.on = Event.on
		// this.off = Event.off
		// this.trigger = Event.trigger

		// default options
		this.defaults = {

			sourceMode: 'buffer', // buffer or element

			source: false,   // either a) path to audio source (without file extension)
								       //     or b) html5 <audio> or <video> element

			nodes:      [],  // array of strings: names of desired additional audio nodes

			gain:        1,  // initial/current gain (0-1)
			gainCache:   1,  // for resuming from mute

			pan:         0,  // circular horizontal pan

			panX:        0,  // real 3d pan
			panY:        0,  // 
			panZ:        0,  // 

			start:       0,  // start time in seconds
			cachedTime:  0,  // local current time (cached for resuming from pause)
			startTime:   0,  // time started (cached for accurately reporting currentTime)

			looping:  false, //
			autoplay: true,  // play immediately on load
			muted: false,

			dummy: false // making it possible to chain bad getTrack() calls
		};

		// override option defaults
		this.options = this.extend.call(this, this.defaults, opts || {});


		this.name = name;

		// Status
		this.status = {
			loaded:  false,
			ready:   false,
			playing: false
		}

		this.mix     = mix;  // reference to parent

		this.events  = {};
		this.tweens  = {};
		this.nodes   = null;   // holds the web audio nodes (gain and pan are defaults, all other optional)

		this.onendtimer = null,  // web audio api in chrome doesn't support onend event yet (WTF)

		this.element = null; // html5 <audio> or <video> element
		this.source  = null; //  web audio source:

		if( this.options.dummy ){ 
			this.mix.log(0, '[Mixer] Couldn’t find track "' + this.options.dummy + '"')
			return
		}

		var self = this;

		if( self.mix.muted === true )
			self.options.muted = true;

		
		if( typeof this.options.source === 'string' ){
			// append extension only if it’s a file path
			this.options.source += this.mix.options.fileTypes[0];
		} else if( typeof this.options.source === 'object' ){
			// otherwise switch mode to element
			this.options.sourceMode = 'element'
		}

		this.mix.log(2, '[Mixer] createTrack "'+this.name+'" with options:', this.options);



		// Load
		// ~~~~

		if( Detect.webAudio === true ) {

			// Web Audio

			if(!this.options.source) {
				this.mix.log(1, '[Mixer] Creating track "'+name+'" without a source');
				return;
			}

			if( this.options.sourceMode === 'buffer' ){

				this.webAudioSource()

			} else if ( this.options.sourceMode === 'element' ){

				if( typeof this.options.source === 'object' )
					this.useHTML5elementSource()
				else
					this.createHTML5elementSource()

			}

		} else {

			// HTML5

			this.mix.log(1, '[Mixer] creating html5 element for track '+name);

			// Look for pre-created audio element and failing that create one
			self.element = document.querySelector( 'audio#'+name );

			if( ! self.element ) {
				var el = document.createElement('audio');
				el.id = name;
				document.body.appendChild( el );
				self.element = document.querySelector( 'audio#'+name );
			}

			var canplay = function(){
				if( self.status.loaded ) return;

				self.status.loaded = true;
				self.status.ready = true;
				self.trigger('load', self);

				if( ! self.options.autoplay) 
					self.pause();
			}

			// canplaythrough listener
			self.element.addEventListener('canplaythrough', canplay, false);
			self.element.addEventListener('load',           canplay, false);

			// Looping
			self.element.addEventListener('ended', function(){

				if(self.options.looping){

					self.mix.log(2, 'Track '+self.name+' looping')

					self.element.currentTime = 0;
					self.element.play();  

				} else {

					self.trigger('ended', self);
					self.mix.removeTrack(self.name);
				}

			}, false);

			this.createHTML5elementSource( this.options.source );
		}                
	};



	Track.prototype = new BaseClass()




	// ##    ######   #####  ######  
	// ##   ##    ## ##   ## ##   ## 
	// ##   ##    ## ####### ##   ## 
	// ##   ##    ## ##   ## ##   ## 
	// ##### ######  ##   ## ######  

	// Create out-of-DOM html5 <audio> element as source
	Track.prototype.createHTML5elementSource = function(){

		var self = this;
		if( ! self.options.source || self.dummy ) return;

		self.mix.log(2, '[Mixer] Track "'+this.name+'" creating HTML5 element source: "'+self.options.source + self.mix.options.fileTypes[0] +'"');
		self.status.ready = false

		var source = self.options.source

		self.options.source = document.createElement('audio')
		self.options.source.src = source

		self.useHTML5elementSource()
	}

	// Use existing in-DOM html5 <audio> or <video> element as source
	Track.prototype.useHTML5elementSource = function(){

		var self = this;
		if( ! self.options.source || self.dummy ) return;

		self.mix.log(2, '[Mixer] Track "' + this.name + '" use HTML5 element source: "' + self.options.source + '"')

		self.element = self.options.source
		self.options.source = self.element.src

		self.source = self.mix.context.createMediaElementSource( self.element );

		var ready = function(){
			self.status.loaded = true
			self.trigger('load', self);
			if( self.options.autoplay ) self.play();
		}

		self.element.addEventListener('canplaythrough', ready)

		self.element.addEventListener('error', function(){ self.trigger('loadError') })

		self.element.load()

		return self
	}

	Track.prototype.webAudioSource = function(){

		var self = this;
		if( ! self.options.source || self.dummy ) return;

		this.mix.log(2, '[Mixer] Track "' + this.name + '" webAudio source: "' + self.options.source + '"')

		var request = new XMLHttpRequest();
		request.open('GET', self.options.source, true);
		request.responseType = 'arraybuffer';

		// asynchronous callback
		request.onload = function() {

			self.mix.log(2, '[Mixer] "'+self.name+'" loaded "' + self.options.source + '"');

			self.options.audioData = request.response; // cache the audio data

			self.status.loaded = true;

			self.trigger('load', self);

			if(self.options.autoplay) self.play();
		}

		request.onerror = function(){
			self.mix.log(1, '[Mixer] couldn’t load track "'+self.name+'" with source "'+self.options.source+'"')
			self.trigger('loadError', self)
		}

		request.send();
	   
	}









	// ###  ##  ######  ######  ######  ####  
	// #### ## ##    ## ##   ## ##     ##     
	// ## #### ##    ## ##   ## #####   ####  
	// ##  ### ##    ## ##   ## ##         ## 
	// ##   ##  ######  ######  ###### #####  

	 
	// AudioNode Creation
	// -> this function can be chained

	Track.prototype.addNode = function(nodeType){

		var self = this;
		if( self.dummy ) return

		// if this is the first time we’re calling addNode,
		// we should connect directly to the source
		if(!self.nodes.lastnode) self.nodes.lastnode = self.source;

		// if(!Detect.nodes[nodeType]) return self; // if this node type is not supported


		// Gain ********************************************************
		// http://www.w3.org/TR/webaudio/#GainNode 

		if(nodeType === 'gain') {

			if( self.mix.context.createGainNode )
				self.nodes.gain = self.mix.context.createGainNode();
			else
				self.nodes.gain = self.mix.context.createGain();

			// connect last created node to newly created node
			self.nodes.lastnode.connect(self.nodes.gain);

			// set newly created node to last node in the chain
			self.nodes.lastnode = self.nodes.gain;

		}
		
		// Panner ********************************************************
		// http://www.w3.org/TR/webaudio/#PannerNode

		else if(nodeType === 'panner'){

			if( window.AudioContext ){

				self.nodes.panner = self.mix.context.createPanner();
				// self.nodes.panner.panningModel = 'equalpower';
				// self.nodes.panner.panningModel = 'HRTF';

			} else if( window.webkitAudioContext ){

				self.nodes.panner = self.mix.context.createPanner();
				// self.nodes.panner.panningModel = webkitAudioPannerNode.EQUALPOWER;
				// self.nodes.panner.panningModel = self.nodes.panner.EQUALPOWER;

			} else {
				return self;
			}

			self.nodes.lastnode.connect(self.nodes.panner);
			self.nodes.lastnode = self.nodes.panner;

		} 

		// Convolver (Reverb etc) **********************************************
		// http://www.w3.org/TR/webaudio/#ConvolverNode

		else if(nodeType === 'convolver' ){

			if( ! self.mix.context.createConvolver ) return self;

			self.nodes.convolver = self.mix.context.createConvolver();

			// TODO: implement loading impulse response for the convolver node
			// http://chromium.googlecode.com/svn/trunk/samples/audio/impulse-responses/

			// self.nodes.convolver.buffer = convolverBuffer;


		}

		// Compressor ********************************************************
		// http://www.w3.org/TR/webaudio/#DynamicsCompressorNode

		else if(nodeType === 'compressor' ){

			self.nodes.compressor = self.mix.context.createDynamicsCompressor();

			// no settings required really…

			self.nodes.lastnode.connect(self.nodes.compressor);
			self.nodes.lastnode = self.nodes.compressor;

		} 

		// Delay ********************************************************
		// http://www.w3.org/TR/webaudio/#DelayNode

		else if(nodeType === 'delay'){

			if(Detect.nodes.delayNode)
				self.nodes.delay = self.mix.context.createDelayNode();
			else
				self.nodes.delay = self.mix.context.createDelay();

			self.nodes.delay.delayTime = 0;

			self.nodes.lastnode.connect(self.nodes.delay);
			self.nodes.lastnode = self.nodes.delay;

		}

		this.mix.log(2, '+ addNode '+nodeType);

		// it’s chainable
		return self;
	}








	// ######  ##     ##### ##    ## 
	// ##   ## ##    ##   ## ##  ##  
	// ######  ##    #######  ####   
	// ##      ##    ##   ##   ##    
	// ##      ##### ##   ##   ##    

							 
	Track.prototype.play = function(){

		var self = this;
		if( self.dummy ) return

		if( !self.status.loaded ){
			this.mix.log(1, 'Can’t play track "' + self.name + '", not loaded')
			return;
		}

		if( self.status.playing === true ) return;
		self.status.playing = true;

		if( ! Detect.webAudio )
			play_singleElement( self )

		else if( Detect.webAudio && self.options.sourceMode === 'buffer' )
			play_bufferSource( self )

		else if( Detect.webAudio && self.options.sourceMode === 'element' )
			play_elementSource( self )
		

		return self
	};



	function play_createNodes( self ){

		self.mix.log(2, 'Creating nodes for track "' + self.name + '"')

		// Create Nodes
		// ~~~~~~~~~~~~

		self.nodes = {}

		// 1. Create standard nodes (gain and pan)
		self.addNode('panner').addNode('gain');

		// 2. Create additional nodes
		for (var i = 0; i < self.options.nodes.length; i++) {
			self.addNode(self.options.nodes[i]);
		}

		// 3. Connect the last node in the chain to the destination
		self.nodes.lastnode.connect(self.mix.context.destination);

	}

	// ********************************************************

	function play_elementSource( self ){

		// unlike buffer mode, we only need to construct the nodes once
		if( ! self.nodes ){

			play_createNodes( self )

			// we also only want one event listener
			self.element.addEventListener('ended', function(){
				if( !self.options.looping ) self.stop()
				else { self.stop(); self.play() }
				self.trigger('ended', self)
			}, false)
		}
			

		// Apply Options
		// ~~~~~~~~~~~~~~

		self.status.ready = true;
		self.trigger('ready', self);

		if(self.options.looping) self.source.loop = true;
		else                     self.source.loop = false;

		if(self.options.muted) self.options.gain = 0;

		self.gain(self.options.gain);
		self.options.gainCache = self.gain();

		self.pan( self.options.pan );

		// Start Time

		self.options.startTime = self.element.currentTime - self.options.cachedTime;
		var startFrom = self.options.cachedTime || 0;

		self.mix.log(1, '[Mixer] Playing track "'+self.name+'" from '+startFrom+' ('+self.options.startTime+') gain '+self.gain());

		// Play!

		self.element.currentTime = startFrom;
		self.element.play()

		self.trigger('play', self)

	}


	// ********************************************************

	function play_bufferSource( self ){

		self.status.ready = false

		// Construct Audio Buffer
		// ~~~~~~~~~~~~~~~~~~~~~~

		// (we have to re-construct the buffer every time we begin play)

		self.source = null
		self.options.sourceBuffer = null    

		// *sigh* async makes for such messy code

		var finish = function(){

			play_createNodes( self )

			// Apply Options
			// ~~~~~~~~~~~~~~

			self.status.ready = true;
			self.trigger('ready', self);

			if(self.options.looping) self.source.loop = true;
			else                     self.source.loop = false;

			if(self.options.muted) self.options.gain = 0;

			self.gain(self.options.gain);
			self.options.gainCache = self.gain();

			self.pan( self.options.pan );


			// Play
			// ~~~~

			self.options.startTime = self.source.context.currentTime - self.options.cachedTime;
			var startFrom = self.options.cachedTime || 0;

			self.mix.log(2, '[Mixer] Playing track "'+self.name+'" from '+startFrom+' ('+self.options.startTime+') gain '+self.gain());

			// prefer start() but fall back to deprecated noteOn()
			if( typeof self.source.start === 'function' ) self.source.start( 0, startFrom );
			else                                          self.source.noteOn( startFrom );

			// fake ended event
			var timer_duration = ( self.source.buffer.duration - startFrom );

			self.onendtimer = setTimeout(function() {
				if(!self.options.looping) self.stop();
				self.trigger('ended', self);
			}, timer_duration * 1000);

			self.trigger('play', self);

		}


		// Create source
		// ~~~~~~~~~~~~~

		// Non-standard Webkit implementation
		if( typeof self.mix.context.createGainNode === 'function' ){

			// Web Audio buffer source
			self.source = self.mix.context.createBufferSource();
			self.sourceBuffer  = self.mix.context.createBuffer(self.options.audioData, true);
			self.source.buffer = self.sourceBuffer;

			finish()
		}

		// W3C standard implementation (Firefox)
		else if( typeof self.mix.context.createGain === 'function' ){

			self.mix.context.decodeAudioData( self.options.audioData, function onSuccess(decodedBuffer) {
				if(self.status.ready) return
				self.mix.log(2, 'web audio file decoded')

				self.source        = self.mix.context.createBufferSource();
				self.sourceBuffer  = decodedBuffer;
				self.source.buffer = self.sourceBuffer;

				finish()
			})
		}
	}



	// ********************************************************

	function play_singleElement( self ){

		self.mix.log(1, '[Mixer] Playing track "'+self.name+'" >')

		if(self.options.muted) self.options.gain = 0;

		self.gain(self.options.gain);
		self.options.gainCache = self.gain();

		self.status.ready  = true;
		self.element.play();
		self.trigger('play', self);
	}






	// ######   #####  ##   ##  ####  ###### 
	// ##   ## ##   ## ##   ## ##     ##     
	// ######  ####### ##   ##  ####  #####  
	// ##      ##   ## ##   ##     ## ##     
	// ##      ##   ##  #####  #####  ###### 


	Track.prototype.pause = function( at ){

		if( !this.status.ready || !this.status.playing || this.dummy ) return;

		var self = this;

		// cache time to resume from later
		if( typeof at === 'number' ) self.options.cachedTime = at;
		else                         self.options.cachedTime = self.currentTime(); 
		
		self.status.playing = false;

		if(self.onendtimer) clearTimeout(self.onendtimer);

		if( Detect.webAudio === true ) {

			if( self.options.sourceMode === 'buffer' ){

				// prefer stop(), fallback to deprecated noteOff()
				if(typeof self.source.stop === 'function')
					self.source.stop(0);
				else if(typeof self.source.noteOff === 'function')
					self.source.noteOff(0);

			} else if( self.options.sourceMode === 'element' ){

				self.element.pause()
			}

		} else {

			self.element.pause();
		}

		self.mix.log(2, '[Mixer] Pausing track "'+self.name+'" at '+self.options.cachedTime)
		self.trigger('pause', self);
		
		return self
	};






	//  #### ###### ######  ######  
	// ##      ##  ##    ## ##   ## 
	//  ####   ##  ##    ## ######  
	//     ##  ##  ##    ## ##      
	// #####   ##   ######  ##      


	Track.prototype.stop = function(){

		if( !this.status.ready || !this.status.playing || this.dummy ) return;

		var self = this;

		if(!self.status.playing) return

		self.options.cachedTime = self.options.startTime = 0

		if( Detect.webAudio === true && self.options.sourceMode === 'buffer' ) {

			// prefer stop(), fallback to deprecated noteOff()
			if(typeof self.source.stop === 'function')
				self.source.stop(0);
			else if(typeof self.source.noteOff === 'function')
				self.source.noteOff(0);

		} else {

			self.options.autoplay = false;

			self.element.pause();
			self.element.currentTime = 0;
		}

		self.mix.log(2, '[Mixer] Stopping track "'+self.name)
		self.status.playing = false
		self.trigger('stop', self);

		self.options.gain = self.options.gainCache;

		return self
		
	}








	// ######   #####  ###  ## 
	// ##   ## ##   ## #### ## 
	// ######  ####### ## #### 
	// ##      ##   ## ##  ### 
	// ##      ##   ## ##   ## 
							  
	// proper 3d stereo panning
	Track.prototype.pan = function(angle_deg){

		if( ! Detect.webAudio ||  ! this.status.ready || this.dummy ) return

		if(typeof angle_deg === 'string') {
			if     ( angle_deg === 'front' ) angle_deg =   0;
			else if( angle_deg === 'back'  ) angle_deg = 180;
			else if( angle_deg === 'left'  ) angle_deg = 270;
			else if( angle_deg === 'right' ) angle_deg =  90;
		}
	  
		if(typeof angle_deg === 'number') {

			this.options.pan = angle_deg % 360;

			var angle_rad = (-angle_deg+90) * 0.017453292519943295; // * PI/180

			var x = this.options.panX = Math.cos(angle_rad);
			var y = this.options.panY = Math.sin(angle_rad);
			var z = this.options.panZ = -0.5;

			this.nodes.panner.setPosition( x, y, z );

			this.trigger( 'pan', this.options.pan, this )

			return self // all setters should be chainable
		}

		return this.options.pan
	}

	Track.prototype.tweenPan = function(angle_deg, tweenDuration, callback){

		if( ! Detect.tween ||  ! Detect.webAudio || ! this.status.ready || this.dummy ) return;

		if(typeof angle_deg !== 'number' || typeof tweenDuration !== 'number') return;

		var self = this;

		self.mix.log(2, '[Mixer] "'+self.name+'" tweening pan2d')

		if( self.tweens.pan ) self.tweens.pan.stop()

		self.tweens.pan = new TWEEN.Tween({ currentAngle: self.options.pan })
			.to( { currentAngle: angle_deg }, tweenDuration )
			.easing(TWEEN.Easing.Sinusoidal.InOut)
			.onUpdate(function(){
				self.pan(this.currentAngle)
			})
			.onComplete(function(){
				if(typeof callback === 'function') callback();
			})
			.start();

		return self
	}





	//  #####   #####  #### ###  ## 
	// ##      ##   ##  ##  #### ## 
	// ##  ### #######  ##  ## #### 
	// ##   ## ##   ##  ##  ##  ### 
	//  #####  ##   ## #### ##   ## 

	// cache current gain for restoring later   
	Track.prototype.gainCache = function(setTo){
		if( this.dummy ) return

		if( typeof setTo === 'number' ){
			this.options.gainCache = setTo;
			return this
		} else {
			return this.options.gainCache
		}
	}




	// gain range 0-1
	Track.prototype.gain = function(val){
		if( this.dummy ) return

		if(typeof val === 'number') {

			this.options.gain = constrain(val,0,1);

			if( this.options.muted ) this.options.gain = 0;

			if(this.status.playing && this.nodes.gain){

				if(!Detect.webAudio){
					this.element.volume = this.options.gain * this.mix.gain;
				} else {
					this.nodes.gain.gain.value = this.options.gain * this.mix.gain;
				}       
			}

			this.mix.log(2, '[Mixer] "'+this.name+'" setting gain to '+this.options.gain)

			this.trigger( 'gain',this.options.gain, this );

			return this // setters should be chainable

		}

		return this.options.gain;

	};




	Track.prototype.tweenGain = function(_val, _tweenDuration, _callback){
		if( typeof _val !== 'number' || typeof _tweenDuration !== 'number' || this.dummy ) return;
		var self = this;
		self.mix.log(2, '[Mixer] "'+self.name+'" tweening gain '+self.options.gain+' -> '+_val)

		if( self.tweens.gain ) self.tweens.gain.stop() // replace existing gain tween

		self.tweens.gain = new TWEEN.Tween({ currentGain: self.options.gain })
			.to( { currentGain: _val }, _tweenDuration )
			.easing(TWEEN.Easing.Sinusoidal.InOut)
			.onUpdate(function(){
				self.gain(this.currentGain)
			})
			.onComplete(function(){
				if(_callback)
					if(typeof _callback === 'function') 
						_callback();
			})
			.start();

		return self
	};


	Track.prototype.mute = function( duration ){
		if( this.dummy ) return

		this.gainCache( this.options.gain );

		if( duration ) {
			this.tweenGain(0, 500, function(){
				this.options.muted = true;
			});    
		} else {
			this.gain(0);
			this.options.muted = true;
		}

		return this
	};

	Track.prototype.unmute = function( duration ){
		if( this.dummy ) return
		this.options.muted = false;

		if( duration ){
			this.tweenGain(this.options.gainCache, 500);
		} else {
			this.gain(this.options.gainCache)
		}

		return this
	};



	//  ##### ##   ## #####  ###### ###  ## ###### ###### #### ###  ### ###### 
	// ##     ##   ## ##  ## ##     #### ##   ##     ##    ##  ######## ##     
	// ##     ##   ## #####  #####  ## ####   ##     ##    ##  ## ## ## #####  
	// ##     ##   ## ##  ## ##     ##  ###   ##     ##    ##  ##    ## ##     
	//  #####  #####  ##  ## ###### ##   ##   ##     ##   #### ##    ## ###### 

	Track.prototype.currentTime = function( setTo ){
		if( !this.status.ready || this.dummy ) return;

		if( typeof setTo === 'number' ){

			this.mix.log(2, '[Mixer] setting track "'+this.name+'" to time', setTo)

			if( Detect.webAudio && this.options.sourceMode === 'buffer' ){

				if( this.status.playing ){
					this.pause( setTo );
					this.play();
				} else {
					this.options.cachedTime = setTo;  
				}

			} else {

				this.element.currentTime = setTo;
			}

			return this
		}
		
		if(!this.status.playing) return this.options.cachedTime || 0;

		if(Detect.webAudio && this.options.sourceMode === 'buffer') 
			return this.source.context.currentTime - this.options.startTime || 0;
		else
			return this.element.currentTime || 0;
	}



	/**************************************************************************
		
		Getters Only

	**************************************************************************/

	function timeFormat(seconds){
		var m=Math.floor(seconds/60)<10 ? '0'+Math.floor(seconds/60):Math.floor(seconds/60);
		var s=Math.floor(seconds-(m*60))<10 ? '0'+Math.floor(seconds-(m*60)):Math.floor(seconds-(m*60));
		return m+':'+s;
	}

	Track.prototype.formattedTime = function( includeDuration){
		if( !this.status.ready || this.dummy ) return;

		if( includeDuration )
			return timeFormat( this.currentTime() ) + '/' + timeFormat( this.duration() );
		else
			return timeFormat( this.currentTime() );
	}

	Track.prototype.duration = function(){
		if( !this.status.ready || this.dummy ) return;

		if(Detect.webAudio && this.options.sourceMode === 'buffer')
			return this.source.buffer.duration || 0;
		else
			return this.element.duration || 0;
	}
	
	return Mix

}())