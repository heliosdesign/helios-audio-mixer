(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var mix = require('./modules/mix');
window.heliosAudioMixer = mix;
},{"./modules/mix":4}],2:[function(require,module,exports){
/*

  Debug

*/

var u = require('./utils')

var debug = {};
module.exports = debug;

// 0 no logging, 1 minimal, 2 all (spammy)
debug.level = 1;

// u.log(1, arg, arg, arg) -> console.log('[Mixer] arg arg arg')
debug.log = function(lvl) {
  if(lvl <= debug.level) {
    var str = '[Mixer] '
    for (var i = 1; i < arguments.length; i++)
      str += arguments[i] + ' '
    console.log(str)
  }
}

debug.setLogLvl = function(lvl) {
  this.debug = u.constrain(lvl, 0, 2);
  debug.log(0, 'Set log level:', lvl)
}
},{"./utils":7}],3:[function(require,module,exports){
var detect = {};

// Web audio API support
detect.webAudio = !!(window.AudioContext || window.webkitAudioContext),

// Which audio types can the browser actually play?
detect.audioTypes =(function() {
  var el = document.createElement('audio')

  return {
    '.m4a': !!(el.canPlayType && el.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/, '')),
    '.mp3': !!(el.canPlayType && el.canPlayType('audio/mpeg;').replace(/no/, '')),
    '.ogg': !!(el.canPlayType && el.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''))
  }
})(),

detect.videoTypes = (function() {

  var el = document.createElement('video')

  return {
    '.webm': !!(el.canPlayType && el.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, '')),
    '.mp4':  !!(el.canPlayType && el.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, '')),
    '.ogv':  !!(el.canPlayType && el.canPlayType('video/ogg; codecs="theora"').replace(/no/, ''))
  }
})(),

// prefer bowser, but with fallback
detect.browser = (function() {

  if(typeof bowser !== 'undefined') return bowser;

  return {
    firefox: !!navigator.userAgent.match(/Firefox/g),
    android: !!navigator.userAgent.match(/Android/g),
    msie:    !!navigator.userAgent.match(/MSIE/g),
    ios:     !!navigator.userAgent.match(/(iPad|iPhone|iPod)/g),

    version: false
  };
})(),

// is tween.js present?
detect.tween = (function() {
  return (typeof TWEEN === 'undefined') ? false : true
})()

module.exports = detect;
},{}],4:[function(require,module,exports){
/*

  ###  ### #### ##   ##
  ########  ##   ## ##
  ## ## ##  ##    ###
  ##    ##  ##   ## ##
  ##    ## #### ##   ##

*/

var u = require('./utils')
var Track = require('./track')
var html5Track = require('./track-html5')
var detect = require('./detect')
var debug = require('./debug')


var Mix = function(opts) {

  // Web Audio support overrides
  if(
    (detect.browser.name === 'Firefox' && detect.version && detect.version < 25) || // Firefox < 25
    (detect.browser.ios === true && detect.browser.version === 7)                   // ios 7
  ) {
    detect.webAudio = false;
  }

  var defaults = {
    fileTypes: [ '.mp3', '.m4a', '.ogg' ],
    html5: !detect.webAudio,
    gain: 1, // master gain for entire mix
  }
  this.options = u.extend(defaults, opts || {});

  this.setLogLvl = debug.setLogLvl

  this.tracks  = [];    // tracks as numbered array
  this.lookup  = {};    // tracks as lookup table: lookup['trackname']

  this.muted   = false; // master mute status

  this.context = null;  // AudioContext object (if webAudio is available)

  this.detect  = detect; // external reference to detect object


  // File Types
  // ********************************************************

  for (var i = this.options.fileTypes.length - 1; i >= 0; i--) {
    if(!detect.audioTypes[ this.options.fileTypes[i] ])
      this.options.fileTypes.splice(i, 1);
  }

  if(this.options.fileTypes.length <= 0) {
    console.warn('Can’t initialize: none of the specified audio types can play in this browser.')
    return;
  }


  // Initialize
  // ********************************************************

  if(detect.webAudio){
    this.context = (typeof AudioContext === 'function' ? new window.AudioContext() : new window.webkitAudioContext() )
  }

  debug.log(1, 'initialized,', (detect.webAudio ? 'Web Audio Mode,' : 'HTML5 Mode,'), 'can play:', this.options.fileTypes)

  return this

};

/*

  Event Functionality

*/
Mix.prototype.on = u.events.on;
Mix.prototype.one = u.events.one;
Mix.prototype.off = u.events.off;
Mix.prototype.trigger = u.events.trigger;


/**************************************************************************

  Track Management

**************************************************************************/

Mix.prototype.createTrack = function(name, opts) {
  var mix = this;

  if(!name){
    debug.log(0, 'Can’t create track with no name');
    return;
  }

  if(mix.lookup[name]) {
    debug.log(0, 'a track named “' + mix.name + '” already exists')
    return;
  }

  var track = mix.options.html5 ? new html5Track(name, opts, mix) : new Track(name, opts, mix);

  mix.tracks.push(track);
  mix.lookup[name] = track;

  return track;
};




Mix.prototype.removeTrack = function(_input) {

  var mix = this;

  // _input can be either a string or a track object
  var trackName;
  if(typeof _input === 'string')
    trackName = _input
  else if(typeof _input === 'object' && _input.name)
    trackName = _input.name

  var track = mix.lookup[trackName];

  if(!track) {
    debug.log(1, 'can’t remove "' + trackName + '", it doesn’t exist');
    return;
  }


  var rest  = [];
  var arr   = mix.tracks;
  var total = arr.length;

  for (var i = 0; i < total; i++) {
    if(arr[i] && arr[i].name === trackName) {
      rest = arr.slice(i + 1 || total);
      arr.length = (i < 0) ? (total + i) : (i);
      arr.push.apply(arr, rest);
    }
  }

  track.pause();
  track.events = [];

  // stop memory leaks!
  if(track.element)
    track.element.src = '';

  track.trigger('remove', mix);

  track = null;
  delete mix.lookup[trackName];
  debug.log(1, 'Removed track "' + trackName + '"');

};


Mix.prototype.getTrack = function(name) {
  return this.lookup[name] || false;
};





/**************************************************************************

  Global Mix Control

**************************************************************************/

Mix.prototype.pause = function() {

  debug.log(1, 'Pausing ' + this.tracks.length + ' track(s) ||')

  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].pause()
};

Mix.prototype.play = function() {

  debug.log(1, 'Playing ' + this.tracks.length + ' track(s) >')

  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].play()
};

Mix.prototype.stop = function() {

  debug.log(1, 'Stopping ' + this.tracks.length + ' track(s) .')

  for (var i = 0; i < this.tracks.length; i++)
     this.tracks[i].stop()
};




Mix.prototype.mute = function() {
  if(this.muted) return
  this.muted = true
  debug.log(1, 'Muting ' + this.tracks.length + ' tracks')
  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].mute();
};


Mix.prototype.unmute = function() {
  if(!this.muted) return
  this.muted = false
  debug.log(1, 'Unmuting ' + this.tracks.length + ' tracks')
  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].unmute();
};



Mix.prototype.gain = function(masterGain) {
  if(typeof masterGain === 'number') {
    masterGain = u.constrain(masterGain, 0, 1);
    this.options.gain = masterGain;

    // tracks multiply their gain by the mix’s gain, so when
    // we change the master gain we need to call track.gain()
    // to get the intended result
    for (var i = 0; i < this.tracks.length; i++)
      this.tracks[i].gain(this.tracks[i].gain());
  }

  return this.options.gain;
}




/**************************************************************************

  Utilities

**************************************************************************/


// call this using requestanimationframe
Mix.prototype.updateTween = function() {
  TWEEN.update();
};



Mix.prototype.report = function(){
  var report = ""
  for (var i = 0; i < this.tracks.length; i++) {
    report += this.tracks[i].gain() + '\t' + this.tracks[i].currentTime() + '\t' + this.tracks[i].name + '\n'
  }
  console.log(report)
}





module.exports = Mix;
},{"./debug":2,"./detect":3,"./track":6,"./track-html5":5,"./utils":7}],5:[function(require,module,exports){
/*

  HTML5 Track

    wrapper for html5 media element

*/

var u = require('./utils')
var detect = require('./detect')
var debug = require('./debug');

var HTML5Track = function(name, opts, mix) {

  console.log('HTML5 TRACK');

  var track = this;

  var defaults = {

    source: false,   // path to audio source (without file extension) OR html5 <audio> or <video> element

    gain:        1,  // initial/current gain (0-1)

    start:       0,  // start time in seconds
    cachedTime:  0,  // local current time (cached for resuming from pause)
    startTime:   0,  // time started (cached for accurately reporting currentTime)

    looping:  false, //
    autoplay: true,  // play immediately on load
    muted:    (mix.muted) ? true : false
  };

  // override option defaults
  track.options = u.extend(defaults, opts || {});

  track.name = name;

  // Status
  track.status = {
    loaded:  false,
    ready:   false,
    playing: false
  }

  track.mix = mix;  // reference to parent

  track.events = {};
  track.tweens = {};

  track.element = undefined; // html5 <audio> or <video> element


  debug.log(1, 'createTrack "' + track.name + '", mode: "html5", autoplay: ' + track.options.autoplay);

  // Load
  // ~~~~

  if(typeof track.options.source === 'string' && track.options.source.indexOf('blob:') !== 0) {
    // append extension only if it’s a file path
    track.options.source  += track.mix.options.fileTypes[0];

    track.element = document.createElement('audio');

  } else if(typeof track.options.source === 'object') {
    track.element = track.options.source;
    track.source = track.element.src;
  }

  track.useElement();

};


/*

  Event Functionality

*/
HTML5Track.prototype.on = u.events.on;
HTML5Track.prototype.one = u.events.one;
HTML5Track.prototype.off = u.events.off;
HTML5Track.prototype.trigger = u.events.trigger;






/*

  Load

*/
HTML5Track.prototype.useElement = function() {
  var track = this;

  // Add options if they're set.
  if (track.options.looping)  track.element.loop  = true;
  if (track.options.muted)    track.element.muted = true;
  if (track.options.autoplay) track.element.autoplay = true;

  // Event listeners
  var ready = function() {
    track.status.loaded = true
    if(track.options.autoplay) track.play();
    track.trigger('load', track);
  }

  track.element.addEventListener('load', ready, false);
  track.element.addEventListener('canplaythrough', ready, false);

  track.element.addEventListener('error', function() { track.trigger('loadError') });

  track.element.src = track.options.source;
  track.element.load();
}



/*

  Play

*/
HTML5Track.prototype.play = function() {

  var track = this;

  debug.log(1, 'Playing track "' + track.name + '" >')

  track.gain(track.options.gain);

  track.status.ready = true;
  track.element.play();
  track.trigger('play', track);

  return track
}


/*

  Pause

*/

HTML5Track.prototype.pause = function(at) {
  var track = this;
  if(!track.status.ready || !track.status.playing) return;

  track.element.pause();
  debug.log(2, 'Pausing track "' + track.name + '" at ' + track.options.cachedTime)
  track.trigger('pause', track);

  return track
}


//  #### ###### ######  ######
// ##      ##  ##    ## ##   ##
//  ####   ##  ##    ## ######
//     ##  ##  ##    ## ##
// #####   ##   ######  ##

HTML5Track.prototype.stop = function() {
  var track = this;

  if(!track.status.ready || !track.status.playing) return;

  track.element.pause();
  track.element.currentTime = 0;

  track.status.playing = false;
  track.trigger('stop', track);

  debug.log(2, 'Stopping track "' + track.name)

  return track
}





function dummy(){ return this }

HTML5Track.prototype.pan = dummy
HTML5Track.prototype.tweenPan = dummy



//  #####   #####  #### ###  ##
// ##      ##   ##  ##  #### ##
// ##  ### #######  ##  ## ####
// ##   ## ##   ##  ##  ##  ###
//  #####  ##   ## #### ##   ##

// Gain getter/setter
HTML5Track.prototype.gain = function(val) {
  var track = this;

  if(typeof val === 'number') {

    val = u.constrain(val, 0, 1); // normalize value

    track.element.volume = val * track.mix.options.gain;

    debug.log(2, '"' + track.name + '" setting gain to ' + track.options.gain);
    track.trigger('gain', track.options.gain, track);

    return track;
  }

  return track.element.volume
}

HTML5Track.prototype.tweenGain = function(_val, _tweenDuration) {
  var track = this;
  return new Promise(function(resolve, reject){
    if(typeof _val !== 'number' || typeof _tweenDuration !== 'number') reject(Error('Invalid value for duration.'))
    debug.log(2, '"' + track.name + '" tweening gain ' + track.options.gain + ' -> ' + _val + ' ('+_tweenDuration+'ms)')

    // replace existing gain tween
    if(track.tweens.gain) track.tweens.gain.stop()

    track.tweens.gain = new TWEEN.Tween({ currentGain: track.options.gain })
      .to({ currentGain: _val }, _tweenDuration)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .onUpdate(function() {
        track.gain(this.currentGain)
      })
      .onComplete(function() {
        resolve(track)
      })
      .start()

  })
}

HTML5Track.prototype.mute = function() {
  this.options.muted = true;
  return this;
}

HTML5Track.prototype.unmute = function() {
  this.element.muted = false;
  return this;
}



/*

  ###### #### ###  ### ######
    ##    ##  ######## ##
    ##    ##  ## ## ## #####
    ##    ##  ##    ## ##
    ##   #### ##    ## ######

*/

// set/get
HTML5Track.prototype.currentTime = function(setTo) {
  if(!this.status.ready) return;
  var track = this;

  if(typeof setTo === 'number') {
    debug.log(2, 'setting track "' + track.name + '" to time', setTo)
    track.element.currentTime = setTo;
    return track
  }

  return track.element.currentTime;
}

// 00:01/00:02
HTML5Track.prototype.formattedTime = function(includeDuration) {
  if(includeDuration)
    return u.timeFormat(this.currentTime()) + '/' + u.timeFormat(this.duration());
  else
    return u.timeFormat(this.currentTime());
}

HTML5Track.prototype.duration = function() {
  return this.element.duration || 0;
}

module.exports = HTML5Track;

},{"./debug":2,"./detect":3,"./utils":7}],6:[function(require,module,exports){
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
  console.log('REGULAR TRACK');

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

  if(detect.webAudio === true) {

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

  // Analyzer ********************************************************

  if(nodeType === 'analyze') {

    // create a script processor with bufferSize of 2048
    _this.nodes.processor = _this.mix.context.createScriptProcessor(2048, 1, 1)

    // create an analyser
    _this.nodes.analyser = _this.mix.context.createAnalyser()
    _this.nodes.analyser.smoothingTimeConstant = 0.5
    _this.nodes.analyser.fftSize = 32

    _this.nodes.processor.connect(_this.mix.context.destination) // processor -> destination
    _this.nodes.analyser.connect(_this.nodes.processor)          // analyser -> processor

    // define a Uint8Array to receive the analyser’s data
    _this.options.bufferLength = _this.nodes.analyser.frequencyBinCount;
    _this.analysis = {
      raw: new Uint8Array(_this.nodes.analyser.frequencyBinCount),
      average: 0,
      low: 0,
      mid: 0,
      high: 0,
    };

    var third = Math.round(_this.options.bufferLength / 3);
    var scratch = 0;

    _this.nodes.lastnode.connect(_this.nodes.analyser);

    _this.nodes.processor.onaudioprocess = function(){
      // _this.nodes.analyser.getByteTimeDomainData(_this.analysis.raw);
      _this.nodes.analyser.getByteFrequencyData(_this.analysis.raw);

      // calculate average, mid, high
      scratch = 0;
      for (var i = 0; i < _this.options.bufferLength; i++)
        scratch += _this.analysis.raw[i];

      _this.analysis.average = (scratch / _this.options.bufferLength) / 256;

      // lows
      scratch = 0;
      for (var i = 0; i < third; i++)
        scratch += _this.analysis.raw[i];

      _this.analysis.low = scratch / third / 256;

      // mids
      scratch = 0;
      for (var i = third; i < third*2; i++)
        scratch += _this.analysis.raw[i];

      _this.analysis.mid = scratch / third / 256;

      // highs
      scratch = 0;
      for (var i = third*2; i < _this.options.bufferLength; i++)
        scratch += _this.analysis.raw[i];

      _this.analysis.high = scratch / third / 256;

      _this.trigger('analyse', _this.analysis)
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

    if(detect.nodes.delayNode)
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

  if(!detect.webAudio)
    playSingleElement(_this)

  else if(detect.webAudio && _this.options.sourceMode === 'buffer'){
    // need to re-xhr the audio file so we loop back to load
    if(bufferSourceLoaded)
      playBufferSource(_this)
    else {
      _this.status.playing = false;
      _this.loadBufferSource(true) // loop back to load
    }
  }

  else if(detect.webAudio && _this.options.sourceMode === 'element')
    playElementSource(_this)


  return _this
}


function playCreateNodes(_this) {

  debug.log(0, 'Creating nodes for track "' + _this.name + '"')

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

  debug.log(1, 'Playing track (element) "' + _this.name + '" from ' + startFrom + ' (' + _this.options.startTime + ') gain ' + _this.gain());

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

    debug.log(2, 'Playing track (buffer) "' + _this.name + '" from ' + startFrom + ' (' + _this.options.startTime + ') gain ' + _this.gain());

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

  debug.log(1, 'Playing track (single element) "' + _this.name + '" >')

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

  if(detect.webAudio === true) {

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

  if(detect.webAudio === true && _this.options.sourceMode === 'buffer') {

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

  if( !detect.webAudio || !this.status.ready || !this.nodes.panner ) return

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
    if( !detect.tween || !detect.webAudio || !_this.status.ready || !_this.nodes.panner ) reject(Error('nope nope nope'))
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

      if(!detect.webAudio)
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

    if(detect.webAudio && this.options.sourceMode === 'buffer') {

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

  if(detect.webAudio && this.options.sourceMode === 'buffer')
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

  if(detect.webAudio && this.options.sourceMode === 'buffer')
    return this.source.buffer.duration || 0;
  else
    return this.element.duration || 0;
}

module.exports = Track;
},{"./debug":2,"./detect":3,"./utils":7}],7:[function(require,module,exports){
/*

  Utils

*/

var u = {};
module.exports = u;


u.extend = function() {
  var output = {}
  var args = arguments
  var l = args.length

  for (var i = 0; i < l; i++)
    for (var key in args[i])
      if(args[i].hasOwnProperty(key))
        output[key] = args[i][key];
  return output;
}

u.constrain = function(val, min, max) {
  if(val < min) return min;
  if(val > max) return max;
  return val;
}


u.timeFormat = function(seconds) {
  var m = Math.floor(seconds / 60) < 10 ? '0' + Math.floor(seconds / 60) : Math.floor(seconds / 60);
  var s = Math.floor(seconds - (m * 60)) < 10 ? '0' + Math.floor(seconds - (m * 60)) : Math.floor(seconds - (m * 60));
  return m + ':' + s;
}

/*

  Events

*/
u.events = {};
u.events.on = function(type, callback) {
  this.events[type] = this.events[type] || [];
  this.events[type].push(callback);

  return this
}

u.events.one = function(type, callback) {
  var _this = this
  this.events[type] = this.events[type] || [];
  this.events[type].push(function(){
    _this.off(type)
    callback()
  });

  return this
}

u.events.off = function(type) {
  if(type === '*')
    this.events = {};
  else
    this.events[type] = [];

  return this
}

u.events.trigger = function(type) {

  if(!this.events[type]) return;

  var args = Array.prototype.slice.call(arguments, 1);

  for (var i = 0, l = this.events[type].length; i < l; i++)
      if(typeof this.events[type][i] === 'function')
        this.events[type][i].apply(this, args);

}


},{}]},{},[1])


//# sourceMappingURL=helios-audio-mixer.js.map