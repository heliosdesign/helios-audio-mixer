var Mix,    // Mixer class
    Track,  // Track class, accessed through Mix.tracks

    Detect, // Feature detection

    debug = 1; // 0 no logging, 1 minimal, 2 all (very spammy)


/**************************************************************************
***************************************************************************
    
    Utility Functions

***************************************************************************
**************************************************************************/


var debounce = function(func, wait) {
    var timeout;
    return function() {
        var context = this, args = arguments,
        later = function() {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

var on = function( type, callback ){
    this.events[type] = this.events[type] || [];
    this.events[type].push( callback );
};

var off = function( type ){
    this.events[type] = [];
};

var trigger = function( type ){
    if ( !this.events[type] ) return;
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0, l = this.events[type].length; i < l;  i++)
        if ( typeof this.events[type][i] == 'function' ) 
            this.events[type][i].apply(this, args);
};

var constrain = function(val, min, max){
    if(val < min) return min;
    if(val > max) return max;
    return val;
}


var log = function(msg, lvl){
    if(lvl <= debug) console.log(msg);
}






/**************************************************************************
***************************************************************************
    
    Detect

***************************************************************************
**************************************************************************/

Detect = {

    audioElement : !!document.createElement('audio').canPlayType,
    videoElement : !!document.createElement('video').canPlayType,

    // General web audio support
    webAudio : !!(window.webkitAudioContext || window.AudioContext),

    // Web Audio Components
    nodes : (function(){

        var context = (window.AudioContext) ? new AudioContext() : new webkitAudioContext();

        return {
            'gain'      : !!(typeof context.createGain === 'function'),
            'gainNode'  : !!(typeof context.createGainNode === 'function'),
            'panner'    : !!(typeof context.createPanner === 'function'),
            'convolver' : !!(typeof context.createConvolver === 'function'),
            'delay'     : !!(typeof context.createDelay === 'function'),
            'delayNode' : !!(typeof context.createDelayNode === 'function'),
            'compressor': !!(typeof context.createDynamicsCompressor === 'function')
        }
    })(),

    audioType : (function(){

        // http://diveintohtml5.info/everything.html

        var el = document.createElement('audio'),
            extension = false;

        if( !!(el.canPlayType && el.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/, '')) ) {
            extension = '.m4a';
        } else if( !!(el.canPlayType && el.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '')) ) {
            extension = '.ogg';
        } else if( !!(el.canPlayType && el.canPlayType('audio/mpeg;').replace(/no/, ''))  ) {
            extension = '.mp3';
        } else {
            extension = false;
        }

        el = null;
        return extension;
    })(),

    videoType : (function(){

        var el = document.createElement('video'),
            extension = false;

        if( !!(el.canPlayType && el.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, '')) ) {
            extension = '.webm';
        } else if( !!(el.canPlayType && el.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''))  ) {
            extension = '.mp4'; // h264
        } else if( !!(el.canPlayType && el.canPlayType('video/ogg; codecs="theora"').replace(/no/, '')) ) {
            extension = '.ogv';
        } else {
            extension = false;
        }

        el = null;
        return extension;

    })(),

    browser : {
        iOS     : navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false,
        Android : navigator.userAgent.match(/Android/g) ? true : false,
        Firefox : navigator.userAgent.match(/Firefox/g) ? true : false,
        MSIE    : navigator.userAgent.match(/MSIE/g) ? true : false
    },

    tween : !!TWEEN // is tween.js present?

}









/**************************************************************************
***************************************************************************
    
    Mix

***************************************************************************
**************************************************************************/


Mix = function(opts){

    log("[Mixer] Loaded", 1)

    this.tracks  = [];    // tracks as numbered array
    this.lookup  = {};    // tracks as lookup table: lookup['trackname']

    this.playing = false; // 
    this.muted   = false; // 
    this.gain = 1;        // master gain for entire mix

    this.events  = {};
    this.context = null;  // AudioContext object (if webAudio is available)

    this.detect  = Detect; // just an external reference for debugging

    // Overrides
    if(Detect.browser.Firefox) Detect.webAudio = false;

    // Initialize
    if(Detect.webAudio === true) {
        log('[Mixer] Web Audio Supported', 1)
        if ( typeof AudioContext === 'function' ) 
            this.context = new AudioContext();
        else 
            this.context = new webkitAudioContext();
    } else {
        log('[Mixer] no Web Audio, falling back to HTML5', 1)
    }

}


/**************************************************************************
    
    Track Management

**************************************************************************/

Mix.prototype.getTrack = function(name){
    return this.lookup[name] || false;
};

Mix.prototype.createTrack = function(name, opts){

    if(this.lookup[name]) {
        console.warn('[Mixer] A track called "'+name+'" already exists');
        return;
    }

    var track = new Track(name, opts, this);

    this.tracks.push(track);
    this.lookup[name] = track;
    return track;
    
};

Mix.prototype.removeTrack = function(name){

    var self  = this,
        track = self.lookup[name];

    if(!track) {
        console.warn('[Mixer] can’t remove "'+name+'", it doesn’t exist')
        return;
    }

    // Fade the track out if we can,
    // to avoid nasty crackling

    var doIt = function(){
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

        track.trigger('remove');

        track.events = [];

        track = null;
        delete self.lookup[name];
        log('[Mixer] Removed track "'+name+'"', 1)
    }

    if(Detect.tween) track.tweenGain(0,100, doIt);
    else doIt();
    
};

Mix.prototype.getTracks = function(group){
    if(typeof group === 'undefined') {
        return this.tracks;
    } else {
        var tracks = [];

        for (var i = this.tracks.length - 1; i >= 0; i--) {
            if(this.tracks[i].options.group === group) tracks.push(this.tracks[i]);
        };

        return tracks;
    }
}

Mix.prototype.removeAll = function(group){

    var tracks = this.getTracks(group),
        total = tracks.length;

    if(typeof group === 'undefined') {

        // no group specified, remove ALL tracks
        this.playing = false;
        log('[Mixer] Removing all '+total+' track(s)', 1)

    } else {
        // group specified: remove tracks from group only
        log('[Mixer] Removing '+total+' track(s) from group '+group, 1)
    }

    for ( var i = 0; i < total; i++ )
        this.removeTrack(tracks[i].name);
    
}



/**************************************************************************
    
    Global Mix Control

**************************************************************************/

Mix.prototype.pause = function(group){

    var tracks = this.getTracks(group),
        total = tracks.length;

    log('[Mixer] Pausing '+total+' track(s) ||', 1)

    this.playing = false;
    for ( var i = 0; i < total; i++ )
        if ( tracks[i].ready ) tracks[i].pause();
};

Mix.prototype.play = function(group){

    var tracks = this.getTracks(group),
        total = tracks.length;

    log('[Mixer] Playing '+total+' track(s) >', 1)

    this.playing = true;
    for ( var i = 0; i < total; i++ )
        if ( tracks[i].ready ) tracks[i].play();
};

Mix.prototype.stop = function(group){

    var tracks = this.getTracks(group),
        total = tracks.length;

    log('[Mixer] Stopping '+total+' track(s) .', 1)

    this.playing = true;
    for ( var i = 0; i < total; i++ )
        if ( tracks[i].ready ) tracks[i].stop();
}



/**************************************************************************
    
    Volume

**************************************************************************/

Mix.prototype.mute = function(group){
    if(this.muted === true) {
        this.unmute();
        return;
    }

    var total = this.tracks.length;
    log('[Mixer] Muting all '+total+' tracks', 1)

    this.playing = false;
    this.muted   = true;

    for ( var i = 0; i < total; i++ )
        if ( this.tracks[i].ready ) this.tracks[i].mute();
};


Mix.prototype.unmute = function(group){
    var total = this.tracks.length;
    log('[Mixer] Unmuting all '+total+' tracks', 1)

    this.playing = true;
    this.muted   = false;

    for ( var i = 0; i < total; i++ )
        if ( this.tracks[i].ready ) this.tracks[i].unmute();
};




Mix.prototype.setGain = function(masterGain){

    if( typeof masterGain !== 'undefined') {
        var total = this.tracks.length;
        this.gain = masterGain;

        // this seems silly, but tracks multiply their gain by the master's
        // so if we change the master gain and call track.gain() we will
        // get the intended result
        for ( var i = 0; i < total; i++ )
            this.tracks[i].gain( this.tracks[i].gain() );
    }

    return this.gain;
    
};





// TODO: what is this for?
Mix.prototype.createTrackZero = function(name, opts){
    //if ( !name || this.lookup[name] ) return;
    var track = new Track(name, opts, this);
    
    this.tracks[0] =  track;
    this.lookup[name] = track;
    return track;
    
};  



// ********************************************************
// Utilities

// call this using requestanimationframe
Mix.prototype.updateTween = function(){
    TWEEN.update();
}

Mix.prototype.extend = function(){
    var output = {}, 
        args = arguments,
        l = args.length;

    for ( var i = 0; i < l; i++ )       
        for ( var key in args[i] )
            if ( args[i].hasOwnProperty(key) )
                output[key] = args[i][key];
    return output;
};



/**************************************************************************
    
    Event System

    on() and off() work like jQuery, trigger() calls events

**************************************************************************/

Mix.prototype.on = function(type, callback){
    this.events[type] = this.events[type] || [];
    this.events[type].push( callback );
};

Mix.prototype.off = function(type){
    this.events[type] = [];
};

// manually triggers events
Mix.prototype.trigger = function(type){
   if ( !this.events[type] ) return;
   var args = Array.prototype.slice.call(arguments, 1);
   for (var i = 0, l = this.events[type].length; i < l;  i++)
           if ( typeof this.events[type][i] == 'function' ) 
                   this.events[type][i].apply(this, args);
}



Mix.prototype.setLogLvl = function(lvl){
    debug = constrain(lvl,0,2);
}

















/**************************************************************************
***************************************************************************
    
    Track

***************************************************************************
**************************************************************************/


Track = function(name, opts, mix){

    // default options
    var defaults = {
        group: "",
        source: null,      // path to audio source (without file extension)
        nodes: [],         // array of strings: names of desired additional audio nodes

        gain:        0,    // initial/current gain (0-1)
        gainCache:   0,    // for resuming from mute

        pan:         0,    // circular horizontal pan

        panX:        0,    // 
        panY:        0,    // 
        panZ:        0,    // 

        start:       0,    // start time in seconds
        cachedTime:  0,    // local current time (cached for resuming from pause)
        startTime:   0,    // time started (cached for accurately reporting currentTime)

        looping:  false,   //

        autoplay: true,    // play immediately on load

        onendtimer: null,  // web audio api in chrome/ doesn't support onend event yet (WTF)

        muted: false
    };

    // override option defaults
    this.options = Mix.prototype.extend.call(this, defaults, opts || {});
    this.options.source = this.options.source + Detect.audioType;
    
    this.name = name;

    this.events = {};
    this.ready = false;  // is the track loaded and ready to play?

    // holds the web audio nodes (gain and pan are defaults, all other optional)
    this.nodes = {
        gain:       undefined,
        panner:     undefined,
        convolver:  undefined,
        compressor: undefined,
        delay:      undefined
    };

    this.mix     = mix;  // reference to parent
    this.element = null; // html5 <audio> element

    var self = this;

    if(!this.options.source) {
        console.warn('[Mixer] Can’t create track "'+name+'" without a source');
        return;
    }

    log('[Mixer] Creating track "'+name, 1);
    log(this.options, 2)
        
    if(Detect.webAudio) this.loadBuffer(this.options.source);
    else                this.loadDOM(this.options.source);

}




/**************************************************************************
    
    Load

**************************************************************************/


Track.prototype.loadDOM = function( source ){

    log('[Mixer] load DOM "'+source+'"...',2)

    var self = this

    self.element = document.createElement('audio');
    self.element.src = source;

    // Loaded Event
    self.element.addEventListener('canplaythrough', function(e) {
        log('[Mixer] canplaythrough "'+source+'"',2)
        self.ready = true;

        self.trigger('load');

        if(self.options.autoplay) self.play();

    }, false);

    // Looping
    if(this.options.looping) {
        self.element.addEventListener('ended',function(e){
            self.element.currentTime = 0;
            self.element.play();
        }, false);
    }

    self.element.load();

    // Firefox only fires canplaythrough after seeking
    if(Detect.browser.Firefox) {
        self.element.play();
    }

}


Track.prototype.loadBuffer = function( source ){

    var self = this;

    var request = new XMLHttpRequest();
    request.open("GET", source, true);
    request.responseType = "arraybuffer";

    log('[Mixer] load Buffer "'+source+'"...',2)

    // asynchronous callback
    request.onload = function() {

        log('[Mixer] "'+self.name+'" loaded "' + source + '"',2)

        self.options.audioData = request.response; // cache the audio data
        self.ready = true; // ready to play

        if(self.options.autoplay) self.play();

        self.trigger('load')

    };

    request.send();
   
};








/**************************************************************************
    
    AudioNode Creation

    -> this function can be chained

**************************************************************************/


Track.prototype.addNode = function(nodeType){

    var self = this;

    // if this is the first time we’re calling addNode,
    // we should connect directly to the source
    if(!self.nodes.lastnode) self.nodes.lastnode = self.options.source;

    if(!Detect.nodes[nodeType]) return self; // if this node type is not supported


    // Gain ********************************************************
    // http://www.w3.org/TR/webaudio/#GainNode 

    if(nodeType === 'gain') {

        if(Detect.nodes.gainNode)
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

        if(Detect.nodes.gainNode) {

            self.nodes.panner = self.mix.context.createPanner();
            self.nodes.panner.panningModel = webkitAudioPannerNode.EQUALPOWER;

        } else {

            self.nodes.panner = self.mix.context.createPanner();
            self.nodes.panner.panningModel = 'equalpower';
            self.nodes.panner.panningModel = "HRTF";

        }

        self.nodes.lastnode.connect(self.nodes.panner);
        self.nodes.lastnode = self.nodes.panner;

    } 

    // Convolver (Reverb etc) **********************************************
    // http://www.w3.org/TR/webaudio/#ConvolverNode

    else if(nodeType === 'convolver' ){

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

    log('+ addNode '+nodeType, 2)

    // it’s chainable
    return self;
}








/**************************************************************************
    
    Play/Pause/Stop

**************************************************************************/


Track.prototype.play = function(){

    var self = this;

    if(!self.ready) return;
    if(self.options.playing === true) return;

    self.options.playing = true;

    if(!Detect.webAudio) {
        log('[Mixer] Playing track "'+self.name+'" >',1)
        self.element.play();
    } else {

        // Construct Audio Buffer
        // ~~~~~~~~~~~~~~~~~~~~~~

        // (we have to re-construct the buffer every time we begin play)

        self.options.source = self.options.sourceBuffer = null;
        self.nodes = {};


        // Chrome Mode
        if(typeof self.mix.context.createGainNode === 'function') {

            // Create source & buffer
            self.options.source        = self.mix.context.createBufferSource();
            self.options.sourceBuffer  = self.mix.context.createBuffer(self.options.audioData,true);
            self.options.source.buffer = self.options.sourceBuffer;

            if(self.options.looping) self.options.source.loop = true;
            else                     self.options.source.loop = false;

            // Nodes //
            // ~~~~~ //

            // 1. Create standard nodes (gain and pan)
            self.addNode('panner').addNode('gain');

            // 2. Create additional nodes
            for (var i = 0; i < self.options.nodes.length; i++) {
                self.addNode(self.options.nodes[i]);
            };

            // 3. Connect the last node in the chain to the destination
            self.nodes.lastnode.connect(self.mix.context.destination);

        // Firefox Mode
        } else {

            self.mix.context.decodeAudioData(self.options.audioData, function onSuccess(decodedBuffer) {

                log("web audio file decoded",2)

                self.options.source        = self.mix.context.createBufferSource();
                self.options.sourceBuffer  = decodedBuffer;
                self.options.source.buffer = self.options.sourceBuffer
                
                if(self.options.looping) self.options.source.loop = true;
                else                     self.options.source.loop = false;
                
                // Nodes //
                // ~~~~~ //

                // 1. Create standard nodes (gain and pan)
                self.addNode('panner').addNode('gain');
                
                // 2. Create additional nodes
                for (var i = 0; i < self.options.nodes.length; i++) {
                    self.addNode(self.options.nodes[i]);
                };

                // 3. Connect the last node in the chain to the destination
                self.nodes.lastnode.connect(self.mix.context.destination);

            }, function onFailure() {
                console.warn("Buggah!");
            });
            
        }


        // Apply Options
        // ~~~~~~~~~~~~~~

        self.gain(self.options.gain);
        this.options.gainCache = this.gain();

        self.pan(self.options.pan);


        // Play Audio Buffer
        // ~~~~~~~~~~~~~~~~~

        self.options.startTime = self.options.source.context.currentTime - self.options.cachedTime;

        var startFrom = self.options.cachedTime || 0;
        log('[Mixer] Playing track "'+self.name+'" from '+startFrom+' ('+self.options.startTime+')', 1)

        if(Detect.browser.iOS){
            self.options.source.noteOn(self.options.start)
        } else {

            // prefer start() but fall back to deprecated noteOn()
            if(typeof self.options.source.start === 'function') 
                self.options.source.start(0, startFrom)
            else
                self.options.source.noteOn(self.options.start)
        }

        console.log('duration: %s',this.options.source.buffer.duration)

        // onend timer
        // ~~~~~~~~~~~
        var timer_duration = (this.options.source.buffer.duration - startFrom);
        console.log('timer_duration: %s',timer_duration)
        self.options.onendtimer = setTimeout(function() {
            
            if(!self.options.looping) {
                self.stop();
            }

            self.trigger('end');

        }, timer_duration * 1000);

    }
    
    self.trigger('play');
};




Track.prototype.pause = function(){

    if(!this.ready || !this.options.playing) return;

    var self = this;

    var doIt = function(){

        self.options.cachedTime = self.getCurrentTime(); // cache time to resume from later
        self.options.playing = false;

        if(self.options.onendtimer) clearTimeout(self.options.onendtimer);

        if(!Detect.webAudio) {
            self.element.pause();
        } else {

            // prefer stop(), fallback to deprecated noteOff()
            if(typeof self.options.source.stop === 'function')
                self.options.source.stop(0);
            else if(typeof self.options.source.noteOff === 'function')
                self.options.source.noteOff(0);
        }

        log('[Mixer] Pausing track "'+self.name+'" at '+self.options.cachedTime,1)
        self.trigger('pause', self);

        self.options.gain = self.options.gainCache;

    }

    if(Detect.tween) this.tweenGain(0, 100, function(){ doIt() } );
    else doIt();
    
};




Track.prototype.stop = function(){

    if(!this.ready || !this.options.playing) return;

    var self = this;
 
    var doIt = function(){
        self.options.playing = false;
        self.options.cachedTime = self.options.startTime = 0;

        if(!Detect.webAudio) {
            self.element.pause();
            self.element.currentTime = 0;
        } else {

            if(typeof self.options.source.noteOff === 'function')
                self.options.source.noteOff(0);
            else if(typeof self.options.source.stop === 'function')
                self.options.source.stop(0);

            self.options.source.context.currentTime = 0;
        }

        log('[Mixer] Stopping track "'+self.name+'"',1)
        self.trigger('stop', self);

        self.options.gain = self.options.gainCache;
    }

    if(Detect.tween) this.tweenGain(0, 100, function(){ doIt() } );
    else doIt();
    
}






/**************************************************************************
    
    Pan

**************************************************************************/

// proper 3d stereo panning
Track.prototype.pan = function(angle_deg){

    if(!Detect.webAudio || !this.options.playing) return

    if(typeof angle_deg === 'string') {
        if(angle_deg === 'front') angle_deg = 0;
        else if(angle_deg === 'back') angle_deg = 180;
        else if(angle_deg === 'left') angle_deg = 270;
        else if(angle_deg === 'right') angle_deg = 90;
    }
  
    if(typeof angle_deg === 'number') {

        this.options.pan = angle_deg % 360;

        var angle_rad = (-angle_deg+90) * 0.017453292519943295; // * PI/180

        var x = this.options.panX = Math.cos(angle_rad);
        var y = this.options.panY = Math.sin(angle_rad);
        var z = this.options.panZ = -0.5;

        this.nodes.panner.setPosition(x, y, z);

        this.trigger('pan', this.options.pan)
    }

    return {
        'angle': this.options.pan
    }
}

Track.prototype.tweenPan = function(angle_deg, tweenDuration, callback){

    if(!Detect.tween || !Detect.webAudio) return;

    if(typeof angle_deg !== 'number' || typeof tweenDuration !== 'number') return;

    var self = this;

    log('[Mixer] "'+self.name+'" tweening pan2d',2)

    var panTween = new TWEEN.Tween({ currentAngle: self.options.pan })
        .to( { currentAngle: angle_deg }, tweenDuration )
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(function(){
            self.pan(this.currentAngle)
        })
        .onComplete(function(){
            if(typeof callback === 'function') callback();
        })
        .start();

    return true;

}





// // coords should be { x: num, y: num, z: num }
// // http://www.html5rocks.com/en/tutorials/webaudio/games/#toc-3d
// Track.prototype.pan3d = function(coords){

//     if(!Detect.webAudio) return

//     if(typeof coords !== 'undefined') {
//         if ( typeof coords.x === 'number' || typeof coords.y === 'number' || typeof coords.z === 'number' ) {

//             this.options.panX = constrain(coords.x,-1,1) ||  0;
//             this.options.panY = constrain(coords.y,-1,1) ||  0;
//             this.options.panZ = constrain(coords.z,-1,1) || -1;

//             this.nodes.panner.setPosition(this.options.pan, this.options.panY, this.options.panZ);
            
//             this.trigger('pan3d', { 'x': this.options.pan, 'y': this.options.panY, 'z': this.options.panZ });
//         }    
//     }
        
//     return { 'x': this.options.pan, 'y': this.options.panY, 'z': this.options.panZ };
// }

// // coords should be { x: num, y: num, z: num }
// Track.prototype.tweenPan3d = function(coords, tweenDuration, callback){

//     if(!Detect.tween || !Detect.webAudio) return; // check for tween lib

//     if(typeof coords === 'undefined' || typeof tweenDuration !== 'number') return;

//     var self = this;

//     console.log('[Mixer] "'+self.name+'" tweening pan3d')

//     var x = constrain(coords.x,-1,1) || 0;
//     var y = constrain(coords.y,-1,1) || 0;
//     var z = constrain(coords.z,-1,1) || -1;

//     var panTween = new TWEEN.Tween({ 
//             currentX: self.options.pan,
//             currentY: self.options.panY,
//             currentZ: self.options.panZ
//         })

//         .to( { 
//             currentX: x,
//             currentY: y,
//             currentZ: z 
//         }, tweenDuration )

//         .easing(TWEEN.Easing.Sinusoidal.InOut)

//         .onUpdate(function(){
//             self.pan3d({
//                 x: currentX,
//                 y: currentY,
//                 z: currentZ
//             })
//         })

//         .onComplete(function(){
//             if(typeof callback === 'function') callback();
//         })

//         .start();

//     return true;

// }





/**************************************************************************
    
    Gain/Mute

**************************************************************************/

// cache current gain for restoring later   
Track.prototype.gainCache = function(setTo){
    
    if( typeof setTo !== 'undefined' ) 
        this.options.gainCache = setTo;

    return this.options.gainCache || 0;
}

// gain range 0-1
Track.prototype.gain = function(val){

    if(this.options.muted || !this.options.playing) return;

   if(typeof val === 'number') {

        this.options.gain = constrain(val,0,1);

        if(!Detect.webAudio){
            this.element.volume = this.options.gain * this.mix.gain;
        } else {
            this.nodes.gain.gain.value = this.options.gain * this.mix.gain;
        }

        this.trigger('gain',this.options.gain);

    }

    return this.options.gain;

};

Track.prototype.tweenGain = function(val, tweenDuration, callback){

    if(!Detect.tween) return; // check for tween lib
    if(this.options.muted === true) return;
    if(typeof val !== 'number' || typeof tweenDuration !== 'number') return;

    var self = this;

    log('[Mixer] "'+self.name+'" tweening gain '+self.options.gain+' -> '+val,2)

    var gainTween = new TWEEN.Tween({ currentGain: self.options.gain })
        .to( { currentGain: val }, tweenDuration )
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(function(){
            self.gain(this.currentGain)
        })
        .onComplete(function(){
            if(typeof callback === 'function') callback();
        })
        .start();
};


Track.prototype.mute = function(){
    var self = this;

    if(self.options.muted === true) {
        self.unmute();
        return;
    }

    self.gainCache(self.options.gain);
    self.tweenGain(0, 500,function(){
        self.options.muted = true;  
    });
    
};

Track.prototype.unmute = function(){
    this.options.muted = false;
    this.tweenGain(this.options.gainCache, 500);
};



/**************************************************************************
    
    Getters

**************************************************************************/


Track.prototype.getCurrentTime = function(){
    if(!this.ready) return;
    
    if(!this.options.playing) return this.options.cachedTime || 0;

    if(Detect.webAudio) return this.options.source.context.currentTime - this.options.startTime;
    else                return this.element.currentTime;
}

Track.prototype.getDuration = function(){
    if(!this.ready) return;

    if(Detect.webAudio) return this.options.source.buffer.duration;
    else                return this.options.element.duration;
}





/**************************************************************************
    
    Event System

**************************************************************************/

Track.prototype.on = function(type, callback){
    this.events[type] = this.events[type] || [];
    this.events[type].push( callback );
};

Track.prototype.off = function(type){
    this.events[type] = [];
};

Track.prototype.trigger = function(type){

    if ( !this.events[type] ) return;

    log(arguments,2);

    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0, l = this.events[type].length; i < l;  i++)
            if ( typeof this.events[type][i] == 'function' ) 
                this.events[type][i].apply(this, args);

};