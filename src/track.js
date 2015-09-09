/*

  ###### #####   #####   ##### ##  ##
    ##   ##  ## ##   ## ##     ## ##
    ##   #####  ####### ##     ####
    ##   ##  ## ##   ## ##     ## ##
    ##   ##  ## ##   ##  ##### ##  ##

*/

var u = require('./utils')
var detect = require('./detect')
var debug = require('./debug');

var Track = function(name, opts, mix) {

  this.defaults = {

    sourceMode: 'buffer', // buffer or (media) element

    source: false,   // either path to audio source (without file extension) or b) html5 <audio> or <video> element

    nodes:      [],  // array of strings: names of desired additional audio nodes

    gain:        1,  // initial/current gain (0-1)
    gainCache:   false,  // for resuming from mute

    pan:         0,  // circular horizontal pan

    panX:        0,  // real 3d pan
    panY:        0,  //
    panZ:        0,  //

    start:       0,  // start time in seconds
    cachedTime:  0,  // local current time (cached for resuming from pause)
    startTime:   0,  // time started (cached for accurately reporting currentTime)

    looping:  false, //
    autoplay: true,  // play immediately on load
    muted:    (mix.muted) ? true : false
  };

  // override option defaults
  this.options = u.extend(this.defaults, opts || {});

  if(this.options.gainCache === false)
    this.options.gainCache = this.options.gain

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
  this.nodes   = undefined;   // holds the web audio nodes (gain and pan are defaults, all other optional)

  this.onendtimer = undefined;  // web audio api in chrome doesn't support onend event yet :(

  this.element = undefined; // html5 <audio> or <video> element
  this.source  = undefined; //  web audio source:

  if(typeof this.options.source === 'string' && this.options.source.indexOf('blob:') !== 0) {
    // append extension only if it’s a file path
    this.options.source  += this.mix.options.fileTypes[0];
  } else if(typeof this.options.source === 'object') {
    // otherwise switch mode to element
    this.options.sourceMode = 'element'
  }

  debug.log(1, 'createTrack "' + this.name + '", mode: "' + this.options.sourceMode + '", autoplay: ' + this.options.autoplay);



  // Load
  // ~~~~

  if(Detect.webAudio === true) {

    // Web Audio

    if(!this.options.source) {
      debug.log(1, 'Creating track "' + name + '" without a source');
      return;
    }

    if(this.options.sourceMode === 'buffer') {

      this.loadBufferSource()

    } else if(this.options.sourceMode === 'element') {

      if(typeof this.options.source === 'object')
        this.useHTML5elementSource()
      else
        this.createHTML5elementSource()

    }

  } else {

    // HTML5

    debug.log(1, 'creating html5 element for track ' + name);

    // Look for pre-created audio element and failing that create one
    this.element = document.querySelector('audio#' + name);

    if(!this.element) {
      var el = document.createElement('audio');
      el.id = name;
      document.body.appendChild(el);
      this.element = document.querySelector('audio#' + name);
    }

    var canplay = function() {
      if(this.status.loaded) return;

      this.status.loaded = true;
      this.status.ready = true;

      if(!this.options.autoplay)
        this.pause();

      this.trigger('load', this);
    }

    var _this = this

    // canplaythrough listener
    _this.element.addEventListener('canplaythrough', canplay, false);
    _this.element.addEventListener('load',           canplay, false);

    // Looping
    _this.element.addEventListener('ended', function() {

      if(_this.options.looping) {

        debug.log(2, 'Track ' + _this.name + ' looping')

        _this.element.currentTime = 0;
        _this.element.play();

      } else {

        _this.trigger('ended', _this);
        _this.mix.removeTrack(_this.name);
      }

    }, false);

    this.createHTML5elementSource(this.options.source);
  }
};


/*

  Event Functionality

*/
Track.prototype.on = u.events.on;
Track.prototype.one = u.events.one;
Track.prototype.off = u.events.off;
Track.prototype.trigger = u.events.trigger;






// ##    ######   #####  ######
// ##   ##    ## ##   ## ##   ##
// ##   ##    ## ####### ##   ##
// ##   ##    ## ##   ## ##   ##
// ##### ######  ##   ## ######

// Create out-of-DOM html5 <audio> element as source
Track.prototype.createHTML5elementSource = function() {

  var _this = this;
  if(!_this.options.source) return;

  debug.log(2, 'Track "' + this.name + '" creating HTML5 element source: "' + _this.options.source + _this.mix.options.fileTypes[0]  + '"');
  _this.status.ready = false

  var src = _this.options.source

  _this.options.source = document.createElement('audio')
  _this.options.source.crossOrigin = ''
  _this.options.source.src = src

  _this.useHTML5elementSource()
}

// Use existing in-DOM html5 <audio> or <video> element as source
Track.prototype.useHTML5elementSource = function() {

  var _this = this;
  if(!_this.options.source) return;

  debug.log(2, 'Track "' + this.name + '" use HTML5 element source: "' + _this.options.source + '"')

  _this.element = _this.options.source
  _this.options.source.crossOrigin = ''
  _this.options.source = _this.element.src

  /**
   * Add options if they're set.
   */
  if (_this.options.looping) { _this.element.loop  = true; }
  if (_this.options.muted)   { _this.element.muted = true; }

  if(_this.mix.context)
    _this.source = _this.mix.context.createMediaElementSource(_this.element);

  var ready = function() {
    _this.status.loaded = true
    if(_this.options.autoplay) _this.play();
    _this.trigger('load', _this);
  }

  _this.element.addEventListener('canplaythrough', ready)
  _this.element.addEventListener('error', function() { _this.trigger('loadError') })

  _this.element.load()

  return _this
}

Track.prototype.loadBufferSource = function(forcePlay) {

  var _this = this;
  if(!_this.options.source) return;

  debug.log(2, 'Track "' + this.name + '" webAudio source: "' + _this.options.source + '"')

  var request = new XMLHttpRequest();
  request.open('GET', _this.options.source, true);
  request.responseType = 'arraybuffer';

  // asynchronous callback
  request.onload = function() {
    debug.log(2, '"' + _this.name + '" loaded "' + _this.options.source + '"');
    _this.options.audioData = request.response; // cache the audio data
    _this.status.loaded = true;
    _this.trigger('load', _this);
    if(forcePlay){
      _this.play(true)
    } else {
      if(_this.options.autoplay) _this.play();
    }
  }

  request.onerror = function() {
    debug.log(1, 'couldn’t load track "' + _this.name + '" with source "' + _this.options.source + '"')
    _this.trigger('loadError', _this)
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

Track.prototype.addNode = function(nodeType) {

  var _this = this;

  // if this is the first time we’re calling addNode, connect directly to the source
  if(!_this.nodes.lastnode) _this.nodes.lastnode = _this.source;

  debug.log(2, ' +  addNode ' + nodeType);

  // Analyser and Processor ********************************************************

  if(nodeType === 'analyse') {

    // create a script processor with bufferSize of 2048
    _this.nodes.processor = _this.mix.context.createScriptProcessor(2048, 1, 1)

    // create an analyser
    _this.nodes.analyser = _this.mix.context.createAnalyser()
    _this.nodes.analyser.smoothingTimeConstant = 0.5
    _this.nodes.analyser.fftSize = 32

    _this.nodes.processor.connect(_this.mix.context.destination) // processor -> destination
    _this.nodes.analyser.connect(_this.nodes.processor)          // analyser -> processor

    // define a Uint8Array to receive the analyser’s data
    _this.options.bufferLength = new Uint8Array(_this.nodes.analyser.frequencyBinCount)
    var analyserData = new Uint8Array(_this.options.bufferLength)

    _this.nodes.lastnode.connect(_this.nodes.analyser)

    _this.nodes.processor.onaudioprocess = function(){
      _this.nodes.analyser.getByteTimeDomainData(analyserData)
      _this.trigger('analyse', analyserData)
    }
  }

  // Gain ********************************************************
  // http://www.w3.org/TR/webaudio/#GainNode

  else if(nodeType === 'gain') {

    if(_this.mix.context.createGainNode)
      _this.nodes.gain = _this.mix.context.createGainNode();
    else
      _this.nodes.gain = _this.mix.context.createGain();

    // connect last created node to newly created node
    _this.nodes.lastnode.connect(_this.nodes.gain);

    // set newly created node to last node in the chain
    _this.nodes.lastnode = _this.nodes.gain;

  }

  // Panner ********************************************************
  // http://www.w3.org/TR/webaudio/#PannerNode

  else if(nodeType === 'panner') {

    if(window.AudioContext) {

      _this.nodes.panner = _this.mix.context.createPanner();
      // _this.nodes.panner.panningModel = 'equalpower';
      // _this.nodes.panner.panningModel = 'HRTF';

    } else if(window.webkitAudioContext) {

      _this.nodes.panner = _this.mix.context.createPanner();
      // _this.nodes.panner.panningModel = webkitAudioPannerNode.EQUALPOWER;
      // _this.nodes.panner.panningModel = _this.nodes.panner.EQUALPOWER;

    } else {
      return _this;
    }

    _this.nodes.lastnode.connect(_this.nodes.panner);
    _this.nodes.lastnode = _this.nodes.panner;

  }

  // Convolver (Reverb etc) **********************************************
  // http://www.w3.org/TR/webaudio/#ConvolverNode

  else if(nodeType === 'convolver') {

    if(!_this.mix.context.createConvolver) return _this;

    _this.nodes.convolver = _this.mix.context.createConvolver();

    // TODO: implement loading impulse response for the convolver node
    // http://chromium.googlecode.com/svn/trunk/samples/audio/impulse-responses/

    // _this.nodes.convolver.buffer = convolverBuffer;


  }

  // Compressor ********************************************************
  // http://www.w3.org/TR/webaudio/#DynamicsCompressorNode

  else if(nodeType === 'compressor') {

    _this.nodes.compressor = _this.mix.context.createDynamicsCompressor();

    // no settings required really…

    _this.nodes.lastnode.connect(_this.nodes.compressor);
    _this.nodes.lastnode = _this.nodes.compressor;

  }

  // Delay ********************************************************
  // http://www.w3.org/TR/webaudio/#DelayNode

  else if(nodeType === 'delay') {

    if(Detect.nodes.delayNode)
      _this.nodes.delay = _this.mix.context.createDelayNode();
    else
      _this.nodes.delay = _this.mix.context.createDelay();

    _this.nodes.delay.delayTime = 0;

    _this.nodes.lastnode.connect(_this.nodes.delay);
    _this.nodes.lastnode = _this.nodes.delay;

  }

  // it’s chainable
  return _this;
}


// ######  ##     ##### ##    ##
// ##   ## ##    ##   ## ##  ##
// ######  ##    #######  ####
// ##      ##    ##   ##   ##
// ##      ##### ##   ##   ##

Track.prototype.play = function(bufferSourceLoaded) {

  var _this = this;

  if(!_this.status.loaded) {
    debug.log(1, 'Can’t play track "' + _this.name + '", not loaded')
    return;
  }

  if(_this.status.playing === true) return;
  _this.status.playing = true;

  if(!Detect.webAudio)
    playSingleElement(_this)

  else if(Detect.webAudio && _this.options.sourceMode === 'buffer'){
    // need to re-xhr the audio file so we loop back to load
    if(bufferSourceLoaded)
      playBufferSource(_this)
    else {
      _this.status.playing = false;
      _this.loadBufferSource(true) // loop back to load
    }
  }

  else if(Detect.webAudio && _this.options.sourceMode === 'element')
    playElementSource(_this)


  return _this
}


function playCreateNodes(_this) {

  debug.log(2, 'Creating nodes for track "' + _this.name + '"')

  // Create Nodes
  // ~~~~~~~~~~~~

  _this.nodes = {}

  // 1. Create standard nodes (gain and pan)
  _this.addNode('panner').addNode('gain')

  // 2. Create additional nodes
  if(_this.options.nodes.length){
    for (var i = 0; i < _this.options.nodes.length; i++) {
      _this.addNode( _this.options.nodes[i] );
    }
  }

  // 3. Connect the last node in the chain to the destination
  _this.nodes.lastnode.connect(_this.mix.context.destination);

}

// ********************************************************

function playElementSource(_this) {

  // unlike buffer mode, we only need to construct the nodes once
  if( !_this.nodes ) {

    playCreateNodes(_this)

    // we also only want one event listener
    _this.element.addEventListener('ended', function() {
      _this.trigger('ended', _this)
    }, false)
  }


  // Apply Options
  // ~~~~~~~~~~~~~~

  _this.status.ready = true;
  _this.trigger('ready', _this);

  if(_this.options.looping) _this.element.loop = true;
  else                      _this.element.loop = false;

  _this.gain(_this.options.gain)
  _this.pan(_this.options.pan)

  // Start Time

  _this.options.startTime = _this.element.currentTime - _this.options.cachedTime;
  var startFrom = _this.options.cachedTime || 0;

  debug.log(1, 'Playing track "' + _this.name + '" from ' + startFrom + ' (' + _this.options.startTime + ') gain ' + _this.gain());

  // Play!

  _this.element.currentTime = startFrom;
  _this.element.play()

  _this.trigger('play', _this)

}


// ********************************************************

function setEndTimer(){
  var _this = this
  var startFrom = _this.options.cachedTime || 0
  var timerDuration = (_this.source.buffer.duration - startFrom)

  _this.onendtimer = setTimeout(function() {
    _this.trigger('ended', _this)

    if(_this.options.looping){

      if(bowser && bowser.chrome && Math.floor(bowser.version) >= 42){
        // HACK chrome 42+ looping fix
        _this.stop()
        _this.play()
      } else {
        setEndTimer.call(_this)
      }

    }

  }, timerDuration * 1000)
}

function playBufferSource(_this) {

  _this.status.ready = false

  // Construct Audio Buffer
  // ~~~~~~~~~~~~~~~~~~~~~~

  // (we have to re-construct the buffer every time we begin play)

  _this.source = null

  // *sigh* async makes for such messy code
  var finish = function() {

    playCreateNodes(_this)

    _this.status.ready = true;
    _this.trigger('ready', _this);

    // Apply Options
    _this.source.loop = (_this.options.looping) ? true : false
    _this.gain(_this.options.gain)
    _this.pan(_this.options.pan)


    // Play
    // ~~~~

    _this.options.startTime = _this.source.context.currentTime - _this.options.cachedTime;
    var startFrom = _this.options.cachedTime || 0;

    debug.log(2, 'Playing track "' + _this.name + '" from ' + startFrom + ' (' + _this.options.startTime + ') gain ' + _this.gain());

    // prefer start() but fall back to deprecated noteOn()
    if(typeof _this.source.start === 'function') _this.source.start(0, startFrom);
    else                                         _this.source.noteOn(startFrom);

    // fake ended event
    _this.onendtimer = false
    setEndTimer.call(_this)


    _this.trigger('play', _this)

  }


  // Create source
  // ~~~~~~~~~~~~~

  // W3C standard implementation (Firefox, recent Chrome)
  if(typeof _this.mix.context.createGain === 'function') {

    _this.mix.context.decodeAudioData(_this.options.audioData, function(decodedBuffer){
      if(_this.status.ready) return

      _this.source        = _this.mix.context.createBufferSource();
      var sourceBuffer    = decodedBuffer;
      _this.source.buffer = sourceBuffer;

      finish()
    })
  }

  // Non-standard Webkit implementation (Safari, old Chrome)
  else if(typeof _this.mix.context.createGainNode === 'function') {

    _this.source = _this.mix.context.createBufferSource();
    var sourceBuffer  = _this.mix.context.createBuffer(_this.options.audioData, true);
    _this.source.buffer = sourceBuffer;

    finish()
  }
}

// ********************************************************

function playSingleElement(_this) {

  debug.log(1, 'Playing track "' + _this.name + '" >')

  _this.gain(_this.options.gain)

  _this.status.ready  = true;
  _this.element.play();
  _this.trigger('play', _this);
}


// ######   #####  ##   ##  ####  ######
// ##   ## ##   ## ##   ## ##     ##
// ######  ####### ##   ##  ####  #####
// ##      ##   ## ##   ##     ## ##
// ##      ##   ##  #####  #####  ######


Track.prototype.pause = function(at) {

  if(!this.status.ready || !this.status.playing) return;

  var _this = this;

  // cache time to resume from later
  if(typeof at === 'number') _this.options.cachedTime = at;
  else                         _this.options.cachedTime = _this.currentTime();

  _this.status.playing = false;

  if(_this.onendtimer) clearTimeout(_this.onendtimer);

  if(Detect.webAudio === true) {

    if(_this.options.sourceMode === 'buffer') {

      // prefer stop(), fallback to deprecated noteOff()
      if(typeof _this.source.stop === 'function')
        _this.source.stop(0);
      else if(typeof _this.source.noteOff === 'function')
        _this.source.noteOff(0);

    } else if(_this.options.sourceMode === 'element') {

      _this.element.pause()
    }

  } else {

    _this.element.pause();
  }

  debug.log(2, 'Pausing track "' + _this.name + '" at ' + _this.options.cachedTime)
  _this.trigger('pause', _this);

  return _this
}


//  #### ###### ######  ######
// ##      ##  ##    ## ##   ##
//  ####   ##  ##    ## ######
//     ##  ##  ##    ## ##
// #####   ##   ######  ##

Track.prototype.stop = function() {

  if(!this.status.ready || !this.status.playing) return;

  var _this = this;

  if(!_this.status.playing) return

  if(_this.onendtimer) clearTimeout(_this.onendtimer)

  _this.options.cachedTime = _this.options.startTime = 0

  if(Detect.webAudio === true && _this.options.sourceMode === 'buffer') {

    // prefer stop(), fallback to deprecated noteOff()
    if(typeof _this.source.stop === 'function')
      _this.source.stop(0);
    else if(typeof _this.source.noteOff === 'function')
      _this.source.noteOff(0);

  } else {

    _this.options.autoplay = false;

    _this.element.pause();
    _this.element.currentTime = 0;
  }

  debug.log(2, 'Stopping track "' + _this.name)
  _this.status.playing = false
  _this.trigger('stop', _this);

  _this.options.gain = _this.options.gainCache;

  return _this

}


// ######   #####  ###  ##
// ##   ## ##   ## #### ##
// ######  ####### ## ####
// ##      ##   ## ##  ###
// ##      ##   ## ##   ##

// proper 3d stereo panning
Track.prototype.pan = function(angleDeg) {

  if( !Detect.webAudio || !this.status.ready || !this.nodes.panner ) return

  if(typeof angleDeg === 'string') {
    if(     angleDeg === 'front') angleDeg =   0;
    else if(angleDeg === 'back' ) angleDeg = 180;
    else if(angleDeg === 'left' ) angleDeg = 270;
    else if(angleDeg === 'right') angleDeg =  90;
  }

  if(typeof angleDeg === 'number') {

    this.options.pan = angleDeg % 360;

    var angleRad = (-angleDeg + 90) * 0.017453292519943295; // * PI/180

    var x = this.options.panX = Math.cos(angleRad);
    var y = this.options.panY = Math.sin(angleRad);
    var z = this.options.panZ = -0.5;

    this.nodes.panner.setPosition(x, y, z);

    this.trigger('pan', this.options.pan, this)

    return this // all setters should be chainable
  }

  return this.options.pan
}

Track.prototype.tweenPan = function(angleDeg, tweenDuration) {
  var _this = this;

  return new Promise(function(resolve, reject){
    if( !Detect.tween || !Detect.webAudio || !_this.status.ready || !_this.nodes.panner ) reject(Error('nope nope nope'))
    if( typeof angleDeg !== 'number' || typeof tweenDuration !== 'number' ) reject(Error('Not a valid tween duration.'))

    debug.log(2, '"' + _this.name + '" tweening pan2d')

    if(_this.tweens.pan) _this.tweens.pan.stop()

    _this.tweens.pan = new TWEEN.Tween({ currentAngle: _this.options.pan })
      .to({ currentAngle: angleDeg }, tweenDuration)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .onUpdate(function() {
        _this.pan(this.currentAngle)
      })
      .onComplete(function() {
        resolve(_this)
      })
      .start()

    return _this

  })
}


//  #####   #####  #### ###  ##
// ##      ##   ##  ##  #### ##
// ##  ### #######  ##  ## ####
// ##   ## ##   ##  ##  ##  ###
//  #####  ##   ## #### ##   ##

// cache current gain for restoring later
Track.prototype.gainCache = function(setTo) {
  if(typeof setTo === 'number') {
    this.options.gainCache = setTo;
    return this
  } else {
    return this.options.gainCache
  }
}

// gain range 0-1
Track.prototype.gain = function(val) {
  if(typeof val === 'number') {

    val = u.constrain(val, 0, 1) // normalize value

    if(this.options.muted) {
      this.gainCache(val) // cache the value
      this.options.gain = 0
    } else {
      this.options.gain = val
    }

    if(this.status.playing) {

      if(!Detect.webAudio)
        this.element.volume = this.options.gain * this.mix.options.gain
      else if( this.nodes && this.nodes.gain )
        this.nodes.gain.gain.value = this.options.gain * this.mix.options.gain

    }

    debug.log(2, '"' + this.name + '" setting gain to ' + this.options.gain)

    this.trigger('gain', this.options.gain, this)

    // setters should be chainable
    return this

  }

  return this.options.gain

}

Track.prototype.tweenGain = function(_val, _tweenDuration) {
  var _this = this;
  return new Promise(function(resolve, reject){
    if(typeof _val !== 'number' || typeof _tweenDuration !== 'number') reject(Error('Invalid value for duration.'))
    debug.log(2, '"' + _this.name + '" tweening gain ' + _this.options.gain + ' -> ' + _val + ' ('+_tweenDuration+'ms)')

    // replace existing gain tween
    if(_this.tweens.gain) _this.tweens.gain.stop()

    _this.tweens.gain = new TWEEN.Tween({ currentGain: _this.options.gain })
      .to({ currentGain: _val }, _tweenDuration)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .onUpdate(function() {
        _this.gain(this.currentGain)
      })
      .onComplete(function() {
        resolve(_this)
      })
      .start()

  })
}

Track.prototype.mute = function() {
  this.gainCache(this.options.gain)
  this.gain(0)
  this.options.muted = true
  if(this.options.sourceMode === 'element')
    this.element.muted = true
  return this
}

Track.prototype.unmute = function() {
  this.options.muted = false;
  if(this.options.sourceMode === 'element')
    this.element.muted = false
  this.gain(this.options.gainCache)
  return this
}


//  ##### ##   ## #####  ###### ###  ## ###### ###### #### ###  ### ######
// ##     ##   ## ##  ## ##     #### ##   ##     ##    ##  ######## ##
// ##     ##   ## #####  #####  ## ####   ##     ##    ##  ## ## ## #####
// ##     ##   ## ##  ## ##     ##  ###   ##     ##    ##  ##    ## ##
//  #####  #####  ##  ## ###### ##   ##   ##     ##   #### ##    ## ######

Track.prototype.currentTime = function(setTo) {
  if(!this.status.ready) return;

  if(typeof setTo === 'number') {

    debug.log(2, 'setting track "' + this.name + '" to time', setTo)

    if(Detect.webAudio && this.options.sourceMode === 'buffer') {

      if(this.status.playing) {
        this.pause(setTo);
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

function timeFormat(seconds) {
  var m = Math.floor(seconds / 60) < 10 ? '0' + Math.floor(seconds / 60) : Math.floor(seconds / 60);
  var s = Math.floor(seconds - (m * 60)) < 10 ? '0' + Math.floor(seconds - (m * 60)) : Math.floor(seconds - (m * 60));
  return m + ':' + s;
}

Track.prototype.formattedTime = function(includeDuration) {
  if(!this.status.ready) return;

  if(includeDuration)
    return timeFormat(this.currentTime()) + '/' + timeFormat(this.duration());
  else
    return timeFormat(this.currentTime());
}

Track.prototype.duration = function() {
  if(!this.status.ready) return;

  if(Detect.webAudio && this.options.sourceMode === 'buffer')
    return this.source.buffer.duration || 0;
  else
    return this.element.duration || 0;
}

module.exports = Track;